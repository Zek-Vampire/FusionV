package com.fusionv.controller;

import com.fusionv.dto.NotificationResponse;
import com.fusionv.dto.UnreadCountResponse;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal UserPrincipal me) {
        return notificationService.listForUser(me.getId());
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal me) {
        return new UnreadCountResponse(notificationService.countUnread(me.getId()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return notificationService.markRead(me.getId(), id);
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal me) {
        notificationService.markAllRead(me.getId());
        return ResponseEntity.noContent().build();
    }
}
