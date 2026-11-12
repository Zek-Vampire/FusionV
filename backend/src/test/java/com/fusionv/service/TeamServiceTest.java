package com.fusionv.service;

import com.fusionv.TestData;
import com.fusionv.dto.JoinRequestResponse;
import com.fusionv.exception.DuplicateEntryException;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.TeamFullException;
import com.fusionv.model.JoinRequest;
import com.fusionv.model.RequestStatus;
import com.fusionv.model.RequestType;
import com.fusionv.model.Team;
import com.fusionv.model.TeamRole;
import com.fusionv.model.User;
import com.fusionv.notification.NotificationSender;
import com.fusionv.notification.NotificationTemplate;
import com.fusionv.repository.HackathonRepository;
import com.fusionv.repository.JoinRequestRepository;
import com.fusionv.repository.MessageRepository;
import com.fusionv.repository.TeamMemberRepository;
import com.fusionv.repository.TeamRepository;
import com.fusionv.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock UserRepository userRepository;
    @Mock HackathonRepository hackathonRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock JoinRequestRepository joinRequestRepository;
    @Mock MessageRepository messageRepository;
    @Mock SkillService skillService;
    @Mock NotificationSender notificationSender;
    TeamService teamService;

    User leader;
    User student;
    Team team;

    @BeforeEach
    void setUp() {
        teamService = new TeamService(teamRepository, userRepository, hackathonRepository, teamMemberRepository,
                joinRequestRepository, messageRepository, skillService, notificationSender);
        leader = TestData.user(1L, "Leader");
        student = TestData.user(5L, "Student");
        team = TestData.teamWithLeader(10L, leader, 2);
        when(teamRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(team));
        when(userRepository.findById(1L)).thenReturn(Optional.of(leader));
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(joinRequestRepository.save(any(JoinRequest.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void requestToJoinCreatesPendingRequestAndNotifiesLeader() {
        JoinRequestResponse response = teamService.requestToJoin(5L, 10L);
        assertEquals("PENDING", response.status());
        assertEquals("REQUEST", response.type());
        verify(notificationSender).send(eq(1L), any(NotificationTemplate.class));
    }

    @Test
    void cannotRequestWhenTeamIsFull() {
        TestData.addMember(team, TestData.user(2L, "Second"), TeamRole.MEMBER, 2L);   // 2 of 2 members
        assertThrows(TeamFullException.class, () -> teamService.requestToJoin(5L, 10L));
        verify(joinRequestRepository, never()).save(any());
    }

    @Test
    void cannotRequestWhenAlreadyMember() {
        assertThrows(DuplicateEntryException.class, () -> teamService.requestToJoin(1L, 10L));
    }

    @Test
    void cannotSendSecondPendingRequest() {
        when(joinRequestRepository.existsByTeamIdAndUserIdAndStatus(10L, 5L, RequestStatus.PENDING)).thenReturn(true);
        assertThrows(DuplicateEntryException.class, () -> teamService.requestToJoin(5L, 10L));
    }

    @Test
    void onlyLeaderCanAcceptRequests() {
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now());
        when(joinRequestRepository.findById(77L)).thenReturn(Optional.of(request));
        assertThrows(NotAllowedException.class, () -> teamService.decideRequest(5L, 77L, true));
    }

    @Test
    void leaderAcceptingAddsMemberAndNotifiesApplicant() {
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now());
        when(joinRequestRepository.findById(77L)).thenReturn(Optional.of(request));

        teamService.decideRequest(1L, 77L, true);

        assertEquals(RequestStatus.ACCEPTED, request.getStatus());
        assertEquals(2, team.getMemberCount());
        verify(notificationSender).send(eq(5L), any(NotificationTemplate.class));
    }

    @Test
    void acceptingIntoFullTeamFails() {
        TestData.addMember(team, TestData.user(2L, "Second"), TeamRole.MEMBER, 2L);
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now());
        when(joinRequestRepository.findById(77L)).thenReturn(Optional.of(request));
        assertThrows(TeamFullException.class, () -> teamService.decideRequest(1L, 77L, true));
        assertEquals(RequestStatus.PENDING, request.getStatus());
    }

    @Test
    void rejectingKeepsTeamUnchanged() {
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now());
        when(joinRequestRepository.findById(77L)).thenReturn(Optional.of(request));
        teamService.decideRequest(1L, 77L, false);
        assertEquals(RequestStatus.REJECTED, request.getStatus());
        assertEquals(1, team.getMemberCount());
    }

    @Test
    void answeredRequestCannotBeAnsweredTwice() {
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.REJECTED, LocalDateTime.now());
        when(joinRequestRepository.findById(77L)).thenReturn(Optional.of(request));
        assertThrows(DuplicateEntryException.class, () -> teamService.decideRequest(1L, 77L, true));
    }

    @Test
    void leavingLeaderPassesLeadershipToOldestMember() {
        team.setMaxMembers(5);
        TestData.addMember(team, student, TeamRole.MEMBER, 2L);
        teamService.leaveTeam(1L, 10L);
        assertEquals(1, team.getMemberCount());
        assertEquals(5L, team.getLeader().getId());
    }

    @Test
    void lastMemberLeavingDeletesTeam() {
        teamService.leaveTeam(1L, 10L);
        verify(teamRepository).delete(team);
    }

    @Test
    void studentCanCancelOwnPendingJoinRequest() {
        JoinRequest request = new JoinRequest(team, student, RequestType.REQUEST, RequestStatus.PENDING, LocalDateTime.now());
        when(joinRequestRepository.findByTeamIdAndUserIdAndStatus(10L, 5L, RequestStatus.PENDING))
                .thenReturn(Optional.of(request));

        teamService.cancelJoinRequest(5L, 10L);

        verify(joinRequestRepository).delete(request);
    }

    @Test
    void cancellingWithoutPendingRequestFails() {
        when(joinRequestRepository.findByTeamIdAndUserIdAndStatus(10L, 5L, RequestStatus.PENDING))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> teamService.cancelJoinRequest(5L, 10L));
    }

    @Test
    void onlyLeaderCanDeleteTeam() {
        assertThrows(NotAllowedException.class, () -> teamService.deleteTeam(5L, false, 10L));
        verify(teamRepository, never()).delete(any(Team.class));
    }
}
