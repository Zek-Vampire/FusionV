package com.fusionv.service;

import com.fusionv.dto.NotificationResponse;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.Notification;
import com.fusionv.model.NotificationType;
import com.fusionv.model.User;
import com.fusionv.notification.NotificationTemplate;
import com.fusionv.repository.NotificationRepository;
import com.fusionv.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Stores and reads notifications. Created by the background threads of AsyncNotificationSender. */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /** Module 2 (compile-time polymorphism): two methods with the same name but different parameters. */
    @Transactional
    public Notification createNotification(Long userId, NotificationTemplate template) {
        return createNotification(userId, template.getType(), template.render(), template.getRelatedTeamId());
    }

    @Transactional
    public Notification createNotification(Long userId, NotificationType type, String text, Long relatedTeamId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        return notificationRepository.save(new Notification(user, type, text, relatedTeamId, LocalDateTime.now()));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 30))
                .stream().map(DtoMapper::toNotificationResponse).toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        notification.setRead(true);
        return DtoMapper.toNotificationResponse(notification);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadForUser(userId);
    }
}
