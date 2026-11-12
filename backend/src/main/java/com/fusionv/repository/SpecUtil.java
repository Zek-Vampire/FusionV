package com.fusionv.repository;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

/** Helper for the search specifications. */
final class SpecUtil {

    private SpecUtil() {
    }

    /** "contains, ignoring case" with %, _ and \ escaped so users cannot inject wildcards. */
    static Predicate containsIgnoreCase(CriteriaBuilder cb, Expression<String> column, String text) {
        String escaped = text.trim().toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return cb.like(cb.lower(column), "%" + escaped + "%", '\\');
    }

    static boolean hasText(String text) {
        return text != null && !text.isBlank();
    }
}
