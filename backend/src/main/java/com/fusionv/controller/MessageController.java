package com.fusionv.controller;

import com.fusionv.dto.MessageRequest;
import com.fusionv.dto.MessageResponse;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public List<MessageResponse> history(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long teamId) {
        return messageService.getHistory(me.getId(), teamId);
    }

    @PostMapping
    public ResponseEntity<MessageResponse> send(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long teamId,
                                                @Valid @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendMessage(me.getId(), teamId, request.content()));
    }
}
