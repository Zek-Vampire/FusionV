package com.fusionv.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** A post: an update, a project showcase or an achievement. */
@Entity
@Table(name = "posts",
       indexes = {@Index(name = "idx_posts_author", columnList = "author_id"), @Index(name = "idx_posts_created", columnList = "created_at")})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private PostType type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Project name or achievement title (optional, structured metadata for PROJECT/ACHIEVEMENT posts). */
    @Column(name = "title", length = 150)
    private String title;

    /** Technologies used by a project, stored in their own table instead of inside the text. */
    @ElementCollection
    @CollectionTable(name = "post_technologies", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "technology", length = 50)
    private List<String> technologies = new ArrayList<>();

    @Column(name = "repo_url", length = 300)
    private String repoUrl;

    @Column(name = "project_url", length = 300)
    private String projectUrl;

    /** Issuing organisation or hackathon for an achievement. */
    @Column(name = "organization", length = 150)
    private String organization;

    @Column(name = "achievement_url", length = 300)
    private String achievementUrl;

    /** Project completion date or achievement date. */
    @Column(name = "event_date")
    private LocalDate eventDate;

    /** Needed by JPA/Hibernate. */
    protected Post() {
    }

    /** Convenient constructor used by the services. */
    public Post(User author, String content, PostType type, LocalDateTime createdAt) {
        this.author = author;
        this.content = content;
        this.type = type;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public PostType getType() {
        return type;
    }

    public void setType(PostType type) {
        this.type = type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getTechnologies() {
        return technologies;
    }

    public void setTechnologies(List<String> technologies) {
        this.technologies = technologies;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getProjectUrl() {
        return projectUrl;
    }

    public void setProjectUrl(String projectUrl) {
        this.projectUrl = projectUrl;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getAchievementUrl() {
        return achievementUrl;
    }

    public void setAchievementUrl(String achievementUrl) {
        this.achievementUrl = achievementUrl;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

}
