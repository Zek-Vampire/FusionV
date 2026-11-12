package com.fusionv.security;

import com.fusionv.model.Role;

/** The logged-in user as read from the JWT. Controllers receive it with @AuthenticationPrincipal. */
public class UserPrincipal {

    private final Long id;
    private final String email;
    private final Role role;

    public UserPrincipal(Long id, String email, Role role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
