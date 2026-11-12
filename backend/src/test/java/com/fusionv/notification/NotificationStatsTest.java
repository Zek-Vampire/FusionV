package com.fusionv.notification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Timeout(value = 10, unit = TimeUnit.SECONDS)
class NotificationStatsTest {

    @Test
    void awaitReturnsTrueWhenAnotherThreadDeliversInTime() throws InterruptedException {
        NotificationStats stats = new NotificationStats();
        Thread worker = new Thread(() -> {
            for (int i = 0; i < 3; i++) {
                stats.markDelivered();
            }
        });
        worker.start();
        assertTrue(stats.awaitDelivered(3, 3000));
        worker.join();
    }

    @Test
    void awaitReturnsFalseOnTimeout() {
        assertFalse(new NotificationStats().awaitDelivered(1, 100));
    }

    @Test
    void awaitStopsWhenInterrupted() throws InterruptedException {
        NotificationStats stats = new NotificationStats();
        boolean[] result = {true};
        Thread waiter = new Thread(() -> result[0] = stats.awaitDelivered(1, 5000));
        waiter.start();
        waiter.interrupt();
        waiter.join(2000);
        assertFalse(result[0]);
    }

    @Test
    void countersAreThreadSafe() throws InterruptedException {
        NotificationStats stats = new NotificationStats();
        Runnable job = () -> {
            for (int i = 0; i < 5000; i++) {
                stats.markQueued();
            }
        };
        Thread a = new Thread(job);
        Thread b = new Thread(job);
        a.start();
        b.start();
        a.join();
        b.join();
        assertEquals(10_000, stats.getQueued());
    }
}
