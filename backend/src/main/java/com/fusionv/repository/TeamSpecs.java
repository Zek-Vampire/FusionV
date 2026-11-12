package com.fusionv.repository;

import com.fusionv.model.Skill;
import com.fusionv.model.Hackathon;
import com.fusionv.model.Team;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** WHERE part of the team search. */
public final class TeamSpecs {

    private TeamSpecs() {
    }

    public static Specification<Team> filter(String text, List<String> skillNames, Long hackathonId,
                                             Integer minSize, Integer maxSize) {
        return (root, query, cb) -> {
            query.distinct(true);                       // joins can repeat a team: keep each team once
            List<Predicate> conditions = new ArrayList<>();

            if (SpecUtil.hasText(text)) {
                Join<Team, Hackathon> hackathon = root.join("hackathon", JoinType.LEFT);
                Join<Team, Skill> anySkill = root.join("requiredSkills", JoinType.LEFT);
                conditions.add(cb.or(
                        SpecUtil.containsIgnoreCase(cb, root.get("name"), text),
                        SpecUtil.containsIgnoreCase(cb, root.get("description"), text),
                        SpecUtil.containsIgnoreCase(cb, hackathon.get("name"), text),
                        SpecUtil.containsIgnoreCase(cb, anySkill.get("name"), text)));
            }
            if (skillNames != null && !skillNames.isEmpty()) {
                Join<Team, Skill> wantedSkill = root.join("requiredSkills", JoinType.LEFT);
                List<String> lowerNames = new ArrayList<>();
                for (String skillName : skillNames) {
                    lowerNames.add(skillName.trim().toLowerCase());
                }
                conditions.add(cb.lower(wantedSkill.<String>get("name")).in(lowerNames));
            }
            if (hackathonId != null) {
                conditions.add(cb.equal(root.get("hackathon").get("id"), hackathonId));
            }
            if (minSize != null) {
                conditions.add(cb.greaterThanOrEqualTo(root.<Integer>get("maxMembers"), minSize));
            }
            if (maxSize != null) {
                conditions.add(cb.lessThanOrEqualTo(root.<Integer>get("maxMembers"), maxSize));
            }
            return cb.and(conditions.toArray(new Predicate[0]));
        };
    }
}
