package com.fusionv.service;

import com.fusionv.dto.MessageResponse;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.Message;
import com.fusionv.model.Team;
import com.fusionv.model.TeamMember;
import com.fusionv.model.User;
import com.fusionv.notification.NewMessageTemplate;
import com.fusionv.notification.NotificationSender;
import com.fusionv.repository.MessageRepository;
import com.fusionv.repository.TeamMemberRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Persistent team chat (REST based). Only team members may read or write. */
@Service
public class MessageService {

    private static final int HISTORY_SIZE = 100;

    private final MessageRepository messageRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final NotificationSender notificationSender;

    public MessageService(MessageRepository messageRepository, TeamRepository teamRepository,
                          TeamMemberRepository teamMemberRepository, UserRepository userRepository,
                          NotificationSender notificationSender) {
        this.messageRepository = messageRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.notificationSender = notificationSender;
    }

    @Transactional
    public MessageResponse sendMessage(Long userId, Long teamId, String content) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
        requireMember(teamId, userId);
        User sender = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));

        Message saved = messageRepository.save(new Message(team, sender, content.trim(), LocalDateTime.now()));

        // Tell the other members in the background (thread pool), the request does not wait for it.
        for (TeamMember member : teamMemberRepository.findByTeamId(teamId)) {
            Long memberId = member.getUser().getId();
            if (!memberId.equals(userId)) {
                notificationSender.send(memberId, new NewMessageTemplate(sender.getFullName(), team.getName(), teamId));
            }
        }
        return DtoMapper.toMessageResponse(saved);
    }

    /** The last 100 messages, oldest first. */
    @Transactional(readOnly = true)
    public List<MessageResponse> getHistory(Long userId, Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ResourceNotFoundException("Team", teamId);
        }
        requireMember(teamId, userId);
        List<Message> newestFirst = messageRepository.findByTeamIdOrderByCreatedAtDesc(teamId, PageRequest.of(0, HISTORY_SIZE));
        List<MessageResponse> result = new ArrayList<>();
        for (Message message : newestFirst) {
            result.add(DtoMapper.toMessageResponse(message));
        }
        Collections.reverse(result);
        return result;
    }

    private void requireMember(Long teamId, Long userId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new NotAllowedException("Only team members can use the team chat");
        }
    }
}
