package com.fusionv.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Join table row: which user belongs to which team, and with which role. */
@Entity
@Table(name = "team_members",
       indexes = {@Index(name = "idx_team_members_user", columnList = "user_id")},
       uniqueConstraints = @UniqueConstraint(name = "uk_team_members_team_user", columnNames = {"team_id", "user_id"}))
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private TeamRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /** Needed by JPA/Hibernate. */
    protected TeamMember() {
    }

    /** Convenient constructor used by the services. */
    public TeamMember(Team team, User user, TeamRole role, LocalDateTime joinedAt) {
        this.team = team;
        this.user = user;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public TeamRole getRole() {
        return role;
    }

    public void setRole(TeamRole role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

}
