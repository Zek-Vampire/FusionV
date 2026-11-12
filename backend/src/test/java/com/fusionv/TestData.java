package com.fusionv;

import com.fusionv.model.Role;
import com.fusionv.model.Team;
import com.fusionv.model.TeamMember;
import com.fusionv.model.TeamRole;
import com.fusionv.model.User;

import java.time.LocalDateTime;

/** Small helpers that build entities for the tests. */
public final class TestData {

    private TestData() {
    }

    public static User user(Long id, String name) {
        User user = new User(name, name.toLowerCase() + "@example.com", "hash", Role.STUDENT, LocalDateTime.now());
        user.setId(id);
        return user;
    }

    /** A team whose leader is already a member (like after createTeam). */
    public static Team teamWithLeader(Long teamId, User leader, int maxMembers) {
        Team team = new Team("Demo Team", "desc", null, leader, maxMembers, LocalDateTime.now());
        team.setId(teamId);
        addMember(team, leader, TeamRole.LEADER, 1L);
        return team;
    }

    public static void addMember(Team team, User user, TeamRole role, Long memberId) {
        TeamMember member = new TeamMember(team, user, role, LocalDateTime.now());
        member.setId(memberId);
        team.getMembers().add(member);
    }
}
