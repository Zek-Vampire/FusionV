package com.fusionv.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** A notification for one user (table notifications, column is_read). */
@Entity
@Table(name = "notifications",
       indexes = {@Index(name = "idx_notifications_user", columnList = "user_id, is_read")})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private NotificationType type;

    @Column(name = "message", nullable = false, length = 300)
    private String message;

    @Column(name = "related_team_id")
    private Long relatedTeamId;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Needed by JPA/Hibernate. */
    protected Notification() {
    }

    /** Convenient constructor used by the services. */
    public Notification(User user, NotificationType type, String message, Long relatedTeamId, LocalDateTime createdAt) {
        this.user = user;
        this.type = type;
        this.message = message;
        this.relatedTeamId = relatedTeamId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getRelatedTeamId() {
        return relatedTeamId;
    }

    public void setRelatedTeamId(Long relatedTeamId) {
        this.relatedTeamId = relatedTeamId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}
