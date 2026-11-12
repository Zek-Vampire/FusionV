package com.fusionv.repository;

import com.fusionv.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    List<TeamMember> findByUserId(Long userId);

    List<TeamMember> findByTeamId(Long teamId);

    long countByUserId(Long userId);

    /** Custom JPQL query: in how many different hackathons is the student taking part through a team? */
    @Query("select count(distinct t.hackathon.id) from TeamMember m join m.team t "
            + "where m.user.id = :userId and t.hackathon is not null")
    long countHackathonsOfUser(@Param("userId") Long userId);
}
