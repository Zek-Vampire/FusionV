package com.fusionv.notification;

import com.fusionv.model.NotificationType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationTemplateTest {

    @Test
    void joinRequestTextNamesApplicantAndTeam() {
        NotificationTemplate template = new JoinRequestTemplate("Priya", "CodeCrafters", 3L);
        assertEquals("Priya wants to join your team CodeCrafters", template.render());
        assertEquals(NotificationType.JOIN_REQUEST, template.getType());
        assertEquals(3L, template.getRelatedTeamId());
    }

    @Test
    void decisionTemplateChangesTypeAndText() {
        NotificationTemplate accepted = new DecisionTemplate("Team A", 1L, true);
        NotificationTemplate rejected = new DecisionTemplate("Team A", 1L, false);
        assertEquals(NotificationType.REQUEST_ACCEPTED, accepted.getType());
        assertEquals(NotificationType.REQUEST_REJECTED, rejected.getType());
        assertTrue(accepted.render().contains("accepted"));
        assertTrue(rejected.render().contains("declined"));
    }

    @Test
    void inviteFactoriesBuildBothMessages() {
        assertTrue(InviteTemplate.invitation("Leader", "Team A", 1L).render().contains("invited you"));
        assertTrue(InviteTemplate.answer("Sam", "Team A", 1L, true).render().contains("accepted your invitation"));
    }

    @Test
    void renderCutsVeryLongText() {
        NotificationTemplate template = new JoinRequestTemplate("x".repeat(400), "Team", 1L);
        assertEquals(280, template.render().length());
        assertTrue(template.render().endsWith("..."));
    }

    @Test
    void overriddenDescribeCallsSuper() {
        NotificationTemplate template = new NewMessageTemplate("Sam", "Team A", 9L);
        assertEquals("NEW_MESSAGE (team 9) [chat message]", template.describe());
    }

    @Test
    void polymorphismTreatsEverySubclassAsTemplate() {
        NotificationTemplate[] templates = {
                new JoinRequestTemplate("A", "T", 1L), new DecisionTemplate("T", 1L, true),
                InviteTemplate.invitation("L", "T", 1L), new NewMessageTemplate("S", "T", 1L)};
        for (NotificationTemplate template : templates) {
            assertTrue(template.render().length() > 5);
        }
    }
}
