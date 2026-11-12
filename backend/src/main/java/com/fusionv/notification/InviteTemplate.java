package com.fusionv.notification;

import com.fusionv.model.NotificationType;

/** Sent to a student who has been invited to a team (also used when an invitation is answered). */
public class InviteTemplate extends NotificationTemplate {

    private final String text;

    private InviteTemplate(String text, Long teamId) {
        super(NotificationType.TEAM_INVITE, teamId);
        this.text = text;
    }

    /** Static factory: tells the invited student about the invitation. */
    public static InviteTemplate invitation(String leaderName, String teamName, Long teamId) {
        return new InviteTemplate(leaderName + " invited you to join the team " + teamName, teamId);
    }

    /** Static factory: tells the leader how the invited student answered. */
    public static InviteTemplate answer(String studentName, String teamName, Long teamId, boolean accepted) {
        String result = accepted ? "accepted" : "declined";
        return new InviteTemplate(studentName + " " + result + " your invitation to " + teamName, teamId);
    }

    @Override
    protected String buildText() {
        return text;
    }
}
