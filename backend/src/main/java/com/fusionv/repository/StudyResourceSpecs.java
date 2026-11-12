package com.fusionv.repository;

import com.fusionv.model.ResourceCategory;
import com.fusionv.model.StudyResource;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** WHERE part of the study-material search. */
public final class StudyResourceSpecs {

    private StudyResourceSpecs() {
    }

    public static Specification<StudyResource> filter(String text, ResourceCategory category, String subject,
                                                      String tag, Long uploaderId) {
        return (root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (SpecUtil.hasText(text)) {
                conditions.add(cb.or(
                        SpecUtil.containsIgnoreCase(cb, root.get("title"), text),
                        SpecUtil.containsIgnoreCase(cb, root.get("description"), text),
                        SpecUtil.containsIgnoreCase(cb, root.get("subject"), text),
                        SpecUtil.containsIgnoreCase(cb, root.get("tags"), text)));
            }
            if (category != null) {
                conditions.add(cb.equal(root.get("category"), category));
            }
            if (SpecUtil.hasText(subject)) {
                conditions.add(SpecUtil.containsIgnoreCase(cb, root.get("subject"), subject));
            }
            if (SpecUtil.hasText(tag)) {
                // tags are stored as "java,spring,dbms": wrap with commas so "java" does not match "javascript"
                var wrapped = cb.concat(cb.concat(",", cb.coalesce(root.<String>get("tags"), "")), ",");
                conditions.add(cb.like(wrapped, "%," + tag.trim().toLowerCase().replace("%", "").replace("_", "") + ",%"));
            }
            if (uploaderId != null) {
                conditions.add(cb.equal(root.get("uploader").get("id"), uploaderId));
            }
            return cb.and(conditions.toArray(new Predicate[0]));
        };
    }
}
