package com.fusionv.service;

import com.fusionv.dto.JoinRequestResponse;
import com.fusionv.dto.MemberResponse;
import com.fusionv.dto.TeamRequest;
import com.fusionv.dto.TeamResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.DuplicateEntryException;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.TeamFullException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.Hackathon;
import com.fusionv.model.JoinRequest;
import com.fusionv.model.RequestStatus;
import com.fusionv.model.RequestType;
import com.fusionv.model.Team;
import com.fusionv.model.TeamMember;
import com.fusionv.model.TeamRole;
import com.fusionv.model.User;
import com.fusionv.notification.DecisionTemplate;
import com.fusionv.notification.InviteTemplate;
import com.fusionv.notification.JoinRequestTemplate;
import com.fusionv.notification.NotificationSender;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.JoinRequestRepository;
import com.fusionv.repository.MessageRepository;
import com.fusionv.repository.TeamMemberRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.TeamSpecs;
import com.fusionv.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Team creation, search, membership, join requests and invitations.
 * Every method that changes members runs in ONE transaction and locks the team row first, so two
 * people can never push the team over its size limit at the same time.
 */
@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final HackathonRepository hackathonRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final MessageRepository messageRepository;
    private final SkillService skillService;
    private final NotificationSender notificationSender;

    public TeamService(TeamRepository teamRepository, UserRepository userRepository,
                       HackathonRepository hackathonRepository, TeamMemberRepository teamMemberRepository,
                       JoinRequestRepository joinRequestRepository, MessageRepository messageRepository,
                       SkillService skillService, NotificationSender notificationSender) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.hackathonRepository = hackathonRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.messageRepository = messageRepository;
        this.skillService = skillService;
        this.notificationSender = notificationSender;
    }

    // ================================================================ create / read / update / delete

    @Transactional
    public TeamResponse createTeam(Long userId, TeamRequest request) {
        User leader = loadUser(userId);
        Hackathon hackathon = loadHackathonOrNull(request.hackathonId());
        checkSizeAgainstHackathon(request.maxMembers(), hackathon);

        Team team = new Team(request.name().trim(), cleanText(request.description()), hackathon, leader,
                request.maxMembers(), LocalDateTime.now());
        team.setRequiredSkills(skillService.findOrCreateAll(request.skills()));
        Team saved = teamRepository.save(team);
        addMember(saved, leader, TeamRole.LEADER);
        return toResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> searchTeams(Long userId, String text, List<String> skills, Long hackathonId,
                                          Integer minSize, Integer maxSize, boolean openOnly, boolean mineOnly,
                                          String sortBy) {
        var spec = TeamSpecs.filter(text, skills, hackathonId, minSize, maxSize);
        List<Team> teams = teamRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<TeamResponse> result = new ArrayList<>();
        for (Team team : teams) {
            if (openOnly && team.isFull()) {
                continue;
            }
            if (mineOnly && findMembership(team, userId) == null) {
                continue;
            }
            result.add(toResponse(team, userId));
        }
        if ("name".equals(sortBy)) {
            result.sort(Comparator.comparing(TeamResponse::name, String.CASE_INSENSITIVE_ORDER));
        } else if ("spots".equals(sortBy)) {
            result.sort(Comparator.comparingInt((TeamResponse t) -> t.maxMembers() - t.memberCount()).reversed());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeam(Long teamId, Long userId) {
        return toResponse(loadTeam(teamId), userId);
    }

    @Transactional
    public TeamResponse updateTeam(Long userId, Long teamId, TeamRequest request) {
        Team team = loadTeamForUpdate(teamId);
        requireLeader(team, userId);
        if (request.maxMembers() < team.getMemberCount()) {
            throw new BadRequestException("The team already has " + team.getMemberCount() + " members");
        }
        Hackathon hackathon = loadHackathonOrNull(request.hackathonId());
        checkSizeAgainstHackathon(request.maxMembers(), hackathon);
        team.setName(request.name().trim());
        team.setDescription(cleanText(request.description()));
        team.setHackathon(hackathon);
        team.setMaxMembers(request.maxMembers());
        team.setRequiredSkills(skillService.findOrCreateAll(request.skills()));
        return toResponse(team, userId);
    }

    @Transactional
    public void deleteTeam(Long userId, boolean isAdmin, Long teamId) {
        Team team = loadTeamForUpdate(teamId);
        if (!isAdmin) {
            requireLeader(team, userId);
        }
        deleteTeamData(team);
    }

    // ================================================================ join requests

    @Transactional
    public JoinRequestResponse requestToJoin(Long userId, Long teamId) {
        Team team = loadTeamForUpdate(teamId);
        User user = loadUser(userId);
        if (findMembership(team, userId) != null) {
            throw new DuplicateEntryException("You are already a member of this team");
        }
        if (team.isFull()) {
            throw new TeamFullException(team.getName(), team.getMaxMembers());
        }
        if (joinRequestRepository.existsByTeamIdAndUserIdAndStatus(teamId, userId, RequestStatus.PENDING)) {
            throw new DuplicateEntryException("You already have a pending request or invitation for this team");
        }
        JoinRequest request = joinRequestRepository.save(
                new JoinRequest(team, user, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now()));
        notificationSender.send(team.getLeader().getId(), new JoinRequestTemplate(user.getFullName(), team.getName(), teamId));
        return DtoMapper.toJoinRequestResponse(request);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> listPendingRequests(Long leaderId, Long teamId) {
        Team team = loadTeam(teamId);
        requireLeader(team, leaderId);
        List<JoinRequestResponse> result = new ArrayList<>();
        for (JoinRequest request : joinRequestRepository.findByTeamIdAndTypeAndStatusOrderByCreatedAtAsc(
                teamId, RequestType.REQUEST, RequestStatus.PENDING)) {
            result.add(DtoMapper.toJoinRequestResponse(request));
        }
        return result;
    }

    /** A student may withdraw their own outstanding join request. Invitations are not affected. */
    @Transactional
    public void cancelJoinRequest(Long userId, Long teamId) {
        loadTeamForUpdate(teamId);
        JoinRequest request = joinRequestRepository
                .findByTeamIdAndUserIdAndStatus(teamId, userId, RequestStatus.PENDING)
                .filter(pending -> pending.getType() == RequestType.REQUEST)
                .orElseThrow(() -> new ResourceNotFoundException("Pending join request for team", teamId));
        joinRequestRepository.delete(request);
    }

    @Transactional
    public JoinRequestResponse decideRequest(Long leaderId, Long requestId, boolean accept) {
        JoinRequest request = loadJoinRequest(requestId);
        Team team = loadTeamForUpdate(request.getTeam().getId());
        requireLeader(team, leaderId);
        if (request.getType() != RequestType.REQUEST) {
            throw new BadRequestException("This is an invitation, not a join request");
        }
        requirePending(request);

        if (accept) {
            if (findMembership(team, request.getUser().getId()) != null) {
                throw new DuplicateEntryException("This student is already a member");
            }
            if (team.isFull()) {
                throw new TeamFullException(team.getName(), team.getMaxMembers());
            }
            addMember(team, request.getUser(), TeamRole.MEMBER);
            request.setStatus(RequestStatus.ACCEPTED);
        } else {
            request.setStatus(RequestStatus.REJECTED);
        }
        request.setDecidedAt(LocalDateTime.now());
        notificationSender.send(request.getUser().getId(), new DecisionTemplate(team.getName(), team.getId(), accept));
        return DtoMapper.toJoinRequestResponse(request);
    }

    // ================================================================ invitations

    @Transactional
    public JoinRequestResponse inviteByEmail(Long leaderId, Long teamId, String email) {
        Team team = loadTeamForUpdate(teamId);
        requireLeader(team, leaderId);
        User invited = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new UserNotFoundException("No student is registered with " + email.trim()));
        if (findMembership(team, invited.getId()) != null) {
            throw new DuplicateEntryException("This student is already in the team");
        }
        if (team.isFull()) {
            throw new TeamFullException(team.getName(), team.getMaxMembers());
        }
        if (joinRequestRepository.existsByTeamIdAndUserIdAndStatus(teamId, invited.getId(), RequestStatus.PENDING)) {
            throw new DuplicateEntryException("This student already has a pending request or invitation");
        }
        JoinRequest invitation = joinRequestRepository.save(
                new JoinRequest(team, invited, RequestType.INVITE, RequestStatus.PENDING, LocalDateTime.now()));
        notificationSender.send(invited.getId(), InviteTemplate.invitation(team.getLeader().getFullName(), team.getName(), teamId));
        return DtoMapper.toJoinRequestResponse(invitation);
    }

    @Transactional(readOnly = true)
    public List<JoinRequestResponse> listMyInvitations(Long userId) {
        List<JoinRequestResponse> result = new ArrayList<>();
        for (JoinRequest invitation : joinRequestRepository.findByUserIdAndTypeAndStatusOrderByCreatedAtDesc(
                userId, RequestType.INVITE, RequestStatus.PENDING)) {
            result.add(DtoMapper.toJoinRequestResponse(invitation));
        }
        return result;
    }

    @Transactional
    public JoinRequestResponse respondToInvitation(Long userId, Long invitationId, boolean accept) {
        JoinRequest invitation = loadJoinRequest(invitationId);
        if (invitation.getType() != RequestType.INVITE || !invitation.getUser().getId().equals(userId)) {
            throw new NotAllowedException("This invitation does not belong to you");
        }
        requirePending(invitation);
        Team team = loadTeamForUpdate(invitation.getTeam().getId());

        if (accept) {
            if (team.isFull()) {
                throw new TeamFullException(team.getName(), team.getMaxMembers());
            }
            if (findMembership(team, userId) != null) {
                throw new DuplicateEntryException("You are already a member of this team");
            }
            addMember(team, invitation.getUser(), TeamRole.MEMBER);
            invitation.setStatus(RequestStatus.ACCEPTED);
        } else {
            invitation.setStatus(RequestStatus.REJECTED);
        }
        invitation.setDecidedAt(LocalDateTime.now());
        notificationSender.send(team.getLeader().getId(),
                InviteTemplate.answer(invitation.getUser().getFullName(), team.getName(), team.getId(), accept));
        return DtoMapper.toJoinRequestResponse(invitation);
    }

    // ================================================================ leaving

    @Transactional
    public void leaveTeam(Long userId, Long teamId) {
        Team team = loadTeamForUpdate(teamId);
        TeamMember me = findMembership(team, userId);
        if (me == null) {
            throw new BadRequestException("You are not a member of this team");
        }
        if (team.getMembers().size() == 1) {
            deleteTeamData(team);                       // the last person left: the team disappears
            return;
        }
        if (me.getRole() == TeamRole.LEADER) {
            promoteOldestMember(team, me);              // somebody must lead the team
        }
        team.getMembers().remove(me);                   // orphanRemoval deletes the team_members row
    }

    // ================================================================ helpers

    private void promoteOldestMember(Team team, TeamMember leavingLeader) {
        TeamMember next = null;
        for (TeamMember candidate : team.getMembers()) {
            boolean isOther = !candidate.getId().equals(leavingLeader.getId());
            if (isOther && (next == null || candidate.getJoinedAt().isBefore(next.getJoinedAt()))) {
                next = candidate;
            }
        }
        next.setRole(TeamRole.LEADER);
        team.setLeader(next.getUser());
    }

    private void addMember(Team team, User user, TeamRole role) {
        TeamMember member = new TeamMember(team, user, role, LocalDateTime.now());
        teamMemberRepository.save(member);
        team.getMembers().add(member);
    }

    private void deleteTeamData(Team team) {
        joinRequestRepository.deleteByTeamId(team.getId());
        messageRepository.deleteByTeamId(team.getId());
        teamRepository.delete(team);                    // team_members are removed by cascade
    }

    private TeamMember findMembership(Team team, Long userId) {
        if (userId == null) {
            return null;
        }
        for (TeamMember member : team.getMembers()) {
            if (member.getUser().getId().equals(userId)) {
                return member;
            }
        }
        return null;
    }

    private void requireLeader(Team team, Long userId) {
        if (!team.getLeader().getId().equals(userId)) {
            throw new NotAllowedException("Only the team leader can do this");
        }
    }

    private void requirePending(JoinRequest request) {
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new DuplicateEntryException("This request has already been answered");
        }
    }

    private void checkSizeAgainstHackathon(int maxMembers, Hackathon hackathon) {
        if (hackathon == null) {
            return;
        }
        if (hackathon.getMaxTeamSize() != null && maxMembers > hackathon.getMaxTeamSize()) {
            throw new BadRequestException("This hackathon allows at most " + hackathon.getMaxTeamSize() + " members per team");
        }
        if (hackathon.getMinTeamSize() != null && maxMembers < hackathon.getMinTeamSize()) {
            throw new BadRequestException("This hackathon needs at least " + hackathon.getMinTeamSize() + " members per team");
        }
    }

    /** Converts a team for the caller: includes myStatus and (for the leader) the number of pending requests. */
    private TeamResponse toResponse(Team team, Long userId) {
        List<MemberResponse> members = new ArrayList<>();
        for (TeamMember member : team.getMembers()) {
            members.add(DtoMapper.toMemberResponse(member));
        }
        members.sort(Comparator.comparing((MemberResponse m) -> !"LEADER".equals(m.role()))
                .thenComparing(MemberResponse::joinedAt));

        boolean isLeader = team.getLeader().getId().equals(userId);
        long pending = isLeader ? joinRequestRepository.countByTeamIdAndTypeAndStatus(
                team.getId(), RequestType.REQUEST, RequestStatus.PENDING) : 0;
        Hackathon hackathon = team.getHackathon();
        return new TeamResponse(team.getId(), team.getName(), team.getDescription(),
                hackathon == null ? null : hackathon.getId(), hackathon == null ? null : hackathon.getName(),
                team.getLeader().getId(), team.getLeader().getFullName(), team.getMaxMembers(), members.size(),
                DtoMapper.skillNames(team.getRequiredSkills()), members, statusFor(team, userId), pending,
                team.getCreatedAt());
    }

    private String statusFor(Team team, Long userId) {
        TeamMember membership = findMembership(team, userId);
        if (membership != null) {
            return membership.getRole() == TeamRole.LEADER ? "LEADER" : "MEMBER";
        }
        if (userId == null) {
            return "NONE";
        }
        Optional<JoinRequest> pending = joinRequestRepository.findByTeamIdAndUserIdAndStatus(
                team.getId(), userId, RequestStatus.PENDING);
        if (pending.isPresent()) {
            return pending.get().getType() == RequestType.REQUEST ? "REQUESTED" : "INVITED";
        }
        return "NONE";
    }

    private Team loadTeam(Long teamId) {
        return teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
    }

    private Team loadTeamForUpdate(Long teamId) {
        return teamRepository.findByIdForUpdate(teamId).orElseThrow(() -> new ResourceNotFoundException("Team", teamId));
    }

    private JoinRequest loadJoinRequest(Long requestId) {
        return joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Hackathon loadHackathonOrNull(Long hackathonId) {
        if (hackathonId == null) {
            return null;
        }
        return hackathonRepository.findById(hackathonId)
                .orElseThrow(() -> new ResourceNotFoundException("Hackathon", hackathonId));
    }

    private String cleanText(String text) {
        return (text == null || text.isBlank()) ? null : text.trim();
    }
}
