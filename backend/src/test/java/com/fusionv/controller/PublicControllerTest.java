package com.fusionv.controller;

import com.fusionv.dto.PublicStatsResponse;
import com.fusionv.model.Role;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.UserRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PublicControllerTest {

    @Test
    void statsReturnsRealAggregateCounts() {
        UserRepository users = mock(UserRepository.class);
        TeamRepository teams = mock(TeamRepository.class);
        HackathonRepository hackathons = mock(HackathonRepository.class);
        StudyResourceRepository resources = mock(StudyResourceRepository.class);
        PostRepository posts = mock(PostRepository.class);
        when(users.countByRole(Role.STUDENT)).thenReturn(4L);
        when(teams.count()).thenReturn(2L);
        when(hackathons.count()).thenReturn(3L);
        when(resources.count()).thenReturn(5L);
        when(posts.count()).thenReturn(7L);

        PublicStatsResponse stats = new PublicController(users, teams, hackathons, resources, posts).stats();

        assertEquals(4L, stats.students());
        assertEquals(2L, stats.teams());
        assertEquals(3L, stats.hackathons());
        assertEquals(5L, stats.resources());
        assertEquals(7L, stats.posts());
    }
}
