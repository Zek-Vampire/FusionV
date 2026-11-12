package com.fusionv.repository;

import com.fusionv.model.StudyResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyResourceRepository extends JpaRepository<StudyResource, Long>, JpaSpecificationExecutor<StudyResource> {

    long countByUploaderId(Long uploaderId);

    /** One SQL UPDATE: safe even when two people download at the same moment. */
    @Modifying
    @Query("update StudyResource r set r.downloadCount = r.downloadCount + 1 where r.id = :id")
    int incrementDownloadCount(@Param("id") Long id);
}
