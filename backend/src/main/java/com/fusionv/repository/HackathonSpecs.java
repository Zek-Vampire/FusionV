package com.fusionv.repository;

import com.fusionv.model.Hackathon;
import com.fusionv.model.HackathonMode;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Builds the WHERE part of the hackathon search from the filters the student chose. */
public final class HackathonSpecs {

    private HackathonSpecs() {
    }

    public static Specification<Hackathon> filter(String name, String domain, String location, HackathonMode mode,
                                                  Integer minTeamSize, Integer maxTeamSize,
                                                  LocalDate deadlineFrom, LocalDate deadlineTo) {
        return (root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (SpecUtil.hasText(name)) {
                conditions.add(SpecUtil.containsIgnoreCase(cb, root.get("name"), name));
            }
            if (SpecUtil.hasText(domain)) {
                conditions.add(SpecUtil.containsIgnoreCase(cb, root.get("domain"), domain));
            }
            if (SpecUtil.hasText(location)) {
                conditions.add(SpecUtil.containsIgnoreCase(cb, root.get("location"), location));
            }
            if (mode != null) {
                conditions.add(cb.equal(root.get("mode"), mode));
            }
            // The student wants teams of size [minTeamSize..maxTeamSize]: keep hackathons whose allowed range overlaps.
            if (minTeamSize != null) {
                conditions.add(cb.or(cb.isNull(root.get("maxTeamSize")), cb.greaterThanOrEqualTo(root.<Integer>get("maxTeamSize"), minTeamSize)));
            }
            if (maxTeamSize != null) {
                conditions.add(cb.or(cb.isNull(root.get("minTeamSize")), cb.lessThanOrEqualTo(root.<Integer>get("minTeamSize"), maxTeamSize)));
            }
            if (deadlineFrom != null) {
                conditions.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("registrationDeadline"), deadlineFrom));
            }
            if (deadlineTo != null) {
                conditions.add(cb.lessThanOrEqualTo(root.<LocalDate>get("registrationDeadline"), deadlineTo));
            }
            return cb.and(conditions.toArray(new Predicate[0]));
        };
    }
}
