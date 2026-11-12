package com.fusionv.controller;

import com.fusionv.dto.PublicStatsResponse;
import com.fusionv.model.Role;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public, aggregate-only data. No personal information is exposed here. */
@RestController
@RequestMapping("/api/v1/public")
public class PublicController {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final HackathonRepository hackathonRepository;
    private final StudyResourceRepository resourceRepository;
    private final PostRepository postRepository;

    public PublicController(UserRepository userRepository, TeamRepository teamRepository,
                            HackathonRepository hackathonRepository, StudyResourceRepository resourceRepository,
                            PostRepository postRepository) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.hackathonRepository = hackathonRepository;
        this.resourceRepository = resourceRepository;
        this.postRepository = postRepository;
    }

    @GetMapping("/stats")
    public PublicStatsResponse stats() {
        return new PublicStatsResponse(userRepository.countByRole(Role.STUDENT), teamRepository.count(),
                hackathonRepository.count(), resourceRepository.count(), postRepository.count());
    }
}
