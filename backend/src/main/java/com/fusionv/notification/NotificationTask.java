package com.fusionv.notification;

import com.fusionv.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Module 7: a job for the thread pool. It implements Runnable, so any thread can execute run().
 * It stores only ids/text (not JPA entities) because it runs on another thread, outside the
 * request's database transaction.
 */
public class NotificationTask implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(NotificationTask.class);

    private final Long recipientUserId;
    private final NotificationTemplate template;
    private final NotificationService notificationService;
    private final NotificationStats stats;

    public NotificationTask(Long recipientUserId, NotificationTemplate template,
                            NotificationService notificationService, NotificationStats stats) {
        this.recipientUserId = recipientUserId;
        this.template = template;
        this.notificationService = notificationService;
        this.stats = stats;
    }

    @Override
    public void run() {
        try {
            notificationService.createNotification(recipientUserId, template);
            stats.markDelivered();
        } catch (RuntimeException e) {
            // A failed notification must never break the request that caused it: log and count it.
            log.warn("Could not save notification {} for user {}: {}", template.describe(), recipientUserId, e.getMessage());
            stats.markFailed();
        }
    }
}
