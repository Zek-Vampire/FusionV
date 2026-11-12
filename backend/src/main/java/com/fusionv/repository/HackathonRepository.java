package com.fusionv.repository;

import com.fusionv.model.Hackathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;

public interface HackathonRepository extends JpaRepository<Hackathon, Long>, JpaSpecificationExecutor<Hackathon> {

    /** Used by imports to skip hackathons that are already stored. */
    boolean existsByNameIgnoreCaseAndStartDate(String name, LocalDate startDate);
}
