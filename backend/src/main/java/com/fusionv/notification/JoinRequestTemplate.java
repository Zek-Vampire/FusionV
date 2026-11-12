package com.fusionv.notification;

import com.fusionv.model.NotificationType;

/** Sent to the team leader when somebody asks to join the team. */
public class JoinRequestTemplate extends NotificationTemplate {

    private final String applicantName;
    private final String teamName;

    public JoinRequestTemplate(String applicantName, String teamName, Long teamId) {
        super(NotificationType.JOIN_REQUEST, teamId);   // Module 3: super keyword (constructor)
        this.applicantName = applicantName;
        this.teamName = teamName;
    }

    @Override   // Module 3: method overriding
    protected String buildText() {
        return applicantName + " wants to join your team " + teamName;
    }
}
