package com.fusionv.notification;

import com.fusionv.model.NotificationType;

/** Sent to team members when a new team message arrives. */
public class NewMessageTemplate extends NotificationTemplate {

    private final String senderName;
    private final String teamName;

    public NewMessageTemplate(String senderName, String teamName, Long teamId) {
        super(NotificationType.NEW_MESSAGE, teamId);
        this.senderName = senderName;
        this.teamName = teamName;
    }

    @Override
    protected String buildText() {
        return "New message from " + senderName + " in " + teamName;
    }

    @Override
    public String describe() {
        return super.describe() + " [chat message]";   // Module 3: super keyword (method)
    }
}
