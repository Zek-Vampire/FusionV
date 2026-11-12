package com.fusionv.repository;

import com.fusionv.model.Post;
import com.fusionv.model.PostType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** WHERE part of the feed: optional author and optional post type. */
public final class PostSpecs {

    private PostSpecs() {
    }

    public static Specification<Post> filter(Long authorId, PostType type) {
        return (root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (authorId != null) {
                conditions.add(cb.equal(root.get("author").get("id"), authorId));
            }
            if (type != null) {
                conditions.add(cb.equal(root.get("type"), type));
            }
            return cb.and(conditions.toArray(new Predicate[0]));
        };
    }
}
