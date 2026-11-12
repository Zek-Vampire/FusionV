package com.fusionv.controller;

import com.fusionv.dto.InviteRequest;
import com.fusionv.dto.JoinRequestResponse;
import com.fusionv.dto.TeamRequest;
import com.fusionv.dto.TeamResponse;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/teams")
    public ResponseEntity<TeamResponse> createTeam(@AuthenticationPrincipal UserPrincipal me,
                                                   @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(me.getId(), request));
    }

    @GetMapping("/teams")
    public List<TeamResponse> searchTeams(@AuthenticationPrincipal UserPrincipal me,
                                          @RequestParam(required = false) String q,
                                          @RequestParam(name = "skill", required = false) List<String> skills,
                                          @RequestParam(required = false) Long hackathonId,
                                          @RequestParam(required = false) Integer minSize,
                                          @RequestParam(required = false) Integer maxSize,
                                          @RequestParam(defaultValue = "false") boolean openOnly,
                                          @RequestParam(defaultValue = "false") boolean mine,
                                          @RequestParam(defaultValue = "latest") String sort) {
        return teamService.searchTeams(me.getId(), q, skills, hackathonId, minSize, maxSize, openOnly, mine, sort);
    }

    @GetMapping("/teams/{id}")
    public TeamResponse getTeam(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return teamService.getTeam(id, me.getId());
    }

    @PutMapping("/teams/{id}")
    public TeamResponse updateTeam(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id,
                                   @Valid @RequestBody TeamRequest request) {
        return teamService.updateTeam(me.getId(), id, request);
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<Void> deleteTeam(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        teamService.deleteTeam(me.getId(), me.isAdmin(), id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- join requests (student -> team)

    @PostMapping("/teams/{id}/join-requests")
    public ResponseEntity<JoinRequestResponse> requestToJoin(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.requestToJoin(me.getId(), id));
    }

    @GetMapping("/teams/{id}/join-requests")
    public List<JoinRequestResponse> listRequests(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return teamService.listPendingRequests(me.getId(), id);
    }

    /** Withdraw my own pending request to join a team. */
    @DeleteMapping("/teams/{id}/join-requests/me")
    public ResponseEntity<Void> cancelJoinRequest(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        teamService.cancelJoinRequest(me.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teams/join-requests/{requestId}/accept")
    public JoinRequestResponse acceptRequest(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long requestId) {
        return teamService.decideRequest(me.getId(), requestId, true);
    }

    @PostMapping("/teams/join-requests/{requestId}/reject")
    public JoinRequestResponse rejectRequest(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long requestId) {
        return teamService.decideRequest(me.getId(), requestId, false);
    }

    // ---------------- invitations (leader -> student)

    @PostMapping("/teams/{id}/invitations")
    public ResponseEntity<JoinRequestResponse> invite(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id,
                                                      @Valid @RequestBody InviteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.inviteByEmail(me.getId(), id, request.email()));
    }

    @GetMapping("/invitations")
    public List<JoinRequestResponse> myInvitations(@AuthenticationPrincipal UserPrincipal me) {
        return teamService.listMyInvitations(me.getId());
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public JoinRequestResponse acceptInvitation(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long invitationId) {
        return teamService.respondToInvitation(me.getId(), invitationId, true);
    }

    @PostMapping("/invitations/{invitationId}/decline")
    public JoinRequestResponse declineInvitation(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long invitationId) {
        return teamService.respondToInvitation(me.getId(), invitationId, false);
    }

    // ---------------- leaving

    @DeleteMapping("/teams/{id}/members/me")
    public ResponseEntity<Void> leaveTeam(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        teamService.leaveTeam(me.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
