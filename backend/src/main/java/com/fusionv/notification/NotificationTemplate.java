package com.fusionv.notification;

import com.fusionv.model.NotificationType;

/**
 * Module 3: ABSTRACT CLASS. It describes what every notification has in common but cannot be
 * created directly. Each subclass must write its own text in buildText() (abstract method).
 */
public abstract class NotificationTemplate {

    private static final int MAX_TEXT_LENGTH = 280;

    private final NotificationType type;
    private final Long relatedTeamId;

    /** Constructor of the parent class. Subclasses call it with "super(...)". */
    protected NotificationTemplate(NotificationType type, Long relatedTeamId) {
        this.type = type;
        this.relatedTeamId = relatedTeamId;
    }

    /** Abstract method: no body here, every child class must override it. */
    protected abstract String buildText();

    /**
     * Module 3: "final" method. Children may NOT override it, so every notification is cut to the
     * same maximum length no matter which subclass created the text.
     */
    public final String render() {
        String text = buildText();
        if (text.length() > MAX_TEXT_LENGTH) {
            return text.substring(0, MAX_TEXT_LENGTH - 3) + "...";
        }
        return text;
    }

    public NotificationType getType() {
        return type;
    }

    public Long getRelatedTeamId() {
        return relatedTeamId;
    }

    /** Short description for logs. Child classes may extend it by calling super.describe(). */
    public String describe() {
        return type + " (team " + relatedTeamId + ")";
    }
}
