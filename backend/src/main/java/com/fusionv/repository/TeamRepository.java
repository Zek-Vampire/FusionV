package com.fusionv.repository;

import com.fusionv.model.Team;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long>, JpaSpecificationExecutor<Team> {

    /**
     * Loads the team and LOCKS its row until the transaction ends. Two leaders/students changing the
     * same team at the same moment are processed one after the other, so the team can never get
     * more members than maxMembers.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Team t where t.id = :id")
    Optional<Team> findByIdForUpdate(@Param("id") Long id);

    /** When a hackathon is deleted its teams stay, they just lose the link. */
    @Modifying
    @Query("update Team t set t.hackathon = null where t.hackathon.id = :hackathonId")
    int detachHackathon(@Param("hackathonId") Long hackathonId);
}
