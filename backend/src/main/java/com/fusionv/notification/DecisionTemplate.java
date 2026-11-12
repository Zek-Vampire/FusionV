package com.fusionv.notification;

import com.fusionv.model.NotificationType;

/** Sent to the applicant when the leader accepts or rejects the join request. */
public class DecisionTemplate extends NotificationTemplate {

    private final String teamName;
    private final boolean accepted;

    public DecisionTemplate(String teamName, Long teamId, boolean accepted) {
        super(accepted ? NotificationType.REQUEST_ACCEPTED : NotificationType.REQUEST_REJECTED, teamId);
        this.teamName = teamName;
        this.accepted = accepted;
    }

    @Override
    protected String buildText() {
        if (accepted) {
            return "Your request to join " + teamName + " was accepted. Welcome to the team!";
        }
        return "Your request to join " + teamName + " was declined.";
    }
}
