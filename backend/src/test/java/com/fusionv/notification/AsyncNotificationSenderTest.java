package com.fusionv.notification;

import com.fusionv.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@Timeout(value = 15, unit = TimeUnit.SECONDS)
class AsyncNotificationSenderTest {

    @Test
    void notificationsAreSavedByBackgroundThreadsAndCounted() {
        NotificationService service = mock(NotificationService.class);
        AsyncNotificationSender sender = new AsyncNotificationSender(service, 2, 10);
        try {
            for (int i = 0; i < 5; i++) {
                sender.send(9L, new JoinRequestTemplate("Priya", "Team", 1L));
            }
            assertTrue(sender.getStats().awaitDelivered(5, 5000));   // wait()/notifyAll() inside
            verify(service, times(5)).createNotification(eq(9L), any(NotificationTemplate.class));
            assertEquals(5, sender.getStats().getQueued());
        } finally {
            sender.shutdown();
        }
    }

    @Test
    void failingNotificationIsCountedAndDoesNotKillTheWorker() throws InterruptedException {
        NotificationService service = mock(NotificationService.class);
        doThrow(new IllegalStateException("db down")).when(service).createNotification(eq(1L), any(NotificationTemplate.class));
        AsyncNotificationSender sender = new AsyncNotificationSender(service, 1, 10);
        try {
            sender.send(1L, new NewMessageTemplate("A", "T", 1L));     // fails
            sender.send(2L, new NewMessageTemplate("A", "T", 1L));     // must still be processed afterwards
            assertTrue(sender.getStats().awaitDelivered(1, 5000));
            assertEquals(1, sender.getStats().getFailed());
        } finally {
            sender.shutdown();
        }
    }
}
