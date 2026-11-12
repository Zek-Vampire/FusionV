package com.fusionv.service;

import com.fusionv.dto.CommentResponse;
import com.fusionv.dto.HackathonResponse;
import com.fusionv.dto.JoinRequestResponse;
import com.fusionv.dto.MemberResponse;
import com.fusionv.dto.MessageResponse;
import com.fusionv.dto.NotificationResponse;
import com.fusionv.dto.StudentSummaryResponse;
import com.fusionv.dto.StudyResourceResponse;
import com.fusionv.dto.UserResponse;
import com.fusionv.model.Comment;
import com.fusionv.model.Hackathon;
import com.fusionv.model.JoinRequest;
import com.fusionv.model.Message;
import com.fusionv.model.Notification;
import com.fusionv.model.Skill;
import com.fusionv.model.StudyResource;
import com.fusionv.model.TeamMember;
import com.fusionv.model.User;

import java.util.Collection;
import java.util.List;

/** Converts entities to DTOs (the objects sent to the browser). Call it inside a transaction (lazy fields). */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static List<String> skillNames(Collection<Skill> skills) {
        return skills.stream().map(Skill::getName).sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(),
                user.getYearBranch(), user.getCollege(), user.getMotto(), user.getAbout(), user.getLocation(),
                user.getLinkUrl(), user.getResumeFileName(), skillNames(user.getSkills()),
                user.getInterests().stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(), user.getCreatedAt());
    }

    public static StudentSummaryResponse toStudentSummary(User user) {
        return new StudentSummaryResponse(user.getId(), user.getFullName(), user.getYearBranch(),
                user.getCollege(), user.getAbout(), user.getLocation(), user.getLinkUrl(),
                skillNames(user.getSkills()),
                user.getInterests().stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(),
                user.getCreatedAt());
    }

    public static HackathonResponse toHackathonResponse(Hackathon h) {
        return new HackathonResponse(h.getId(), h.getName(), h.getDomain(), h.getOrganizer(), h.getLocation(),
                h.getMode().name(), h.getDescription(), h.getEligibility(), h.getStartDate(), h.getEndDate(),
                h.getRegistrationDeadline(), h.getMinTeamSize(), h.getMaxTeamSize(), h.getRegistrationUrl());
    }

    public static MemberResponse toMemberResponse(TeamMember m) {
        return new MemberResponse(m.getUser().getId(), m.getUser().getFullName(), m.getRole().name(), m.getJoinedAt());
    }

    public static JoinRequestResponse toJoinRequestResponse(JoinRequest r) {
        return new JoinRequestResponse(r.getId(), r.getTeam().getId(), r.getTeam().getName(), r.getUser().getId(),
                r.getUser().getFullName(), r.getType().name(), r.getStatus().name(), r.getCreatedAt());
    }

    public static StudyResourceResponse toResourceResponse(StudyResource r) {
        return new StudyResourceResponse(r.getId(), r.getTitle(), r.getDescription(), r.getSubject(),
                r.getCategory().name(), r.getTags(), r.getOriginalFileName(), r.getContentType(), r.getSizeBytes(),
                r.getDownloadCount(), r.getUploader().getId(), r.getUploader().getFullName(), r.getCreatedAt(),
                "/api/v1/resources/" + r.getId() + "/download");
    }

    public static CommentResponse toCommentResponse(Comment c) {
        return new CommentResponse(c.getId(), c.getPost().getId(), c.getAuthor().getId(), c.getAuthor().getFullName(),
                c.getContent(), c.getCreatedAt());
    }

    public static MessageResponse toMessageResponse(Message m) {
        return new MessageResponse(m.getId(), m.getTeam().getId(), m.getSender().getId(), m.getSender().getFullName(),
                m.getContent(), m.getCreatedAt());
    }

    public static NotificationResponse toNotificationResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType().name(), n.getMessage(), n.getRelatedTeamId(),
                n.isRead(), n.getCreatedAt());
    }
}
