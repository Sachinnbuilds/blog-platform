package com.blog.blog_platform.repository;

import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.blog_platform.entity.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);
    Long countByPostId(Long postId);
    void deleteByUserId(Long userId);
    void deleteByPostIdIn(Collection<Long> postIds);
}
