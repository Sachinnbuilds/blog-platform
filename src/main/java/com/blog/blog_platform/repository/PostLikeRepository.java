package com.blog.blog_platform.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.blog_platform.entity.PostLike;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    void deleteByUserIdAndPostId(Long userId, Long postId);
    void deleteByUserId(Long userId);
    void deleteByPostIdIn(Collection<Long> postIds);
}
