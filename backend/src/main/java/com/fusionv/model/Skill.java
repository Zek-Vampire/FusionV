package com.fusionv.model;

import jakarta.persistence.*;

/** A skill such as Java or UI/UX Design. Shared by students (user_skills) and teams (team_skills). */
@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    /** Needed by JPA/Hibernate. */
    protected Skill() {
    }

    /** Convenient constructor used by the services. */
    public Skill(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
