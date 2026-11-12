package com.fusionv.controller;

import com.fusionv.dto.AdminStatsResponse;
import com.fusionv.notification.AsyncNotificationSender;
import com.fusionv.notification.NotificationStats;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Administrator-only (see SecurityConfig: /api/v1/admin/** needs ROLE_ADMIN). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final StudyResourceRepository resourceRepository;
    private final PostRepository postRepository;
    private final AsyncNotificationSender notificationSender;

    public AdminController(UserRepository userRepository, TeamRepository teamRepository,
                           StudyResourceRepository resourceRepository, PostRepository postRepository,
                           AsyncNotificationSender notificationSender) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.resourceRepository = resourceRepository;
        this.postRepository = postRepository;
        this.notificationSender = notificationSender;
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        NotificationStats notificationStats = notificationSender.getStats();
        return new AdminStatsResponse(userRepository.count(), teamRepository.count(), resourceRepository.count(),
                postRepository.count(), notificationStats.getQueued(), notificationStats.getDelivered(),
                notificationStats.getFailed());
    }
}
