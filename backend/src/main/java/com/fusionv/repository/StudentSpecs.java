package com.fusionv.repository;

import com.fusionv.model.Skill;
import com.fusionv.model.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** WHERE part of "find students with a skill". */
public final class StudentSpecs {

    private StudentSpecs() {
    }

    public static Specification<User> filter(String nameText, String skillName) {
        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> conditions = new ArrayList<>();
            if (SpecUtil.hasText(nameText)) {
                conditions.add(SpecUtil.containsIgnoreCase(cb, root.get("fullName"), nameText));
            }
            if (SpecUtil.hasText(skillName)) {
                Join<User, Skill> skill = root.join("skills", JoinType.INNER);
                conditions.add(cb.equal(cb.lower(skill.<String>get("name")), skillName.trim().toLowerCase()));
            }
            return cb.and(conditions.toArray(new Predicate[0]));
        };
    }
}
