package com.blog.blog_platform.repository;

import com.blog.blog_platform.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findBySlug(String slug);
    Optional<Tag> findByNameIgnoreCase(String name);
    boolean existsBySlug(String slug);
    List<Tag> findTop20ByOrderByPostCountDesc();
    List<Tag> findTop5ByNameContainingIgnoreCaseOrderByPostCountDesc(String name);
}
