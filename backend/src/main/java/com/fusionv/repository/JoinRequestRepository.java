package com.fusionv.repository;

import com.fusionv.model.JoinRequest;
import com.fusionv.model.RequestStatus;
import com.fusionv.model.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    List<JoinRequest> findByTeamIdAndTypeAndStatusOrderByCreatedAtAsc(Long teamId, RequestType type, RequestStatus status);

    List<JoinRequest> findByUserIdAndTypeAndStatusOrderByCreatedAtDesc(Long userId, RequestType type, RequestStatus status);

    Optional<JoinRequest> findByTeamIdAndUserIdAndStatus(Long teamId, Long userId, RequestStatus status);

    boolean existsByTeamIdAndUserIdAndStatus(Long teamId, Long userId, RequestStatus status);

    long countByTeamIdAndTypeAndStatus(Long teamId, RequestType type, RequestStatus status);

    void deleteByTeamId(Long teamId);
}
