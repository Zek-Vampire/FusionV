package com.fusionv.notification;

/**
 * Module 3: INTERFACE. Services only know "something that can send a notification".
 * The real implementation (AsyncNotificationSender) sends it in a background thread.
 * In unit tests we can replace it with a Mockito mock.
 */
public interface NotificationSender {

    /** Delivers the notification to the user with the given id. Must not block the caller for long. */
    void send(Long recipientUserId, NotificationTemplate template);
}
