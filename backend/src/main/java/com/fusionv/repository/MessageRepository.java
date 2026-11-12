package com.fusionv.repository;

import com.fusionv.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Newest first; the service reverses the list so the chat shows oldest first. */
    List<Message> findByTeamIdOrderByCreatedAtDesc(Long teamId, Pageable pageable);

    void deleteByTeamId(Long teamId);
}
