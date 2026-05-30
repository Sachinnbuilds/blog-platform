package com.blog.blog_platform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    Optional<Post> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<Post> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String title, String content, Pageable pageable);
    Page<Post> findByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCase(
            PostStatus statusForTitle, String title, PostStatus statusForContent, String content, Pageable pageable);
    List<Post> findTop5ByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCase(
            PostStatus statusForTitle, String title, PostStatus statusForContent, String content);
    long countByStatus(PostStatus status);
    long countByAuthorIdAndStatus(Long authorId, PostStatus status);
    @Query("select coalesce(sum(p.likes), 0) from Post p where p.author.id = :authorId and p.status = :status")
    long sumLikesByAuthorIdAndStatus(Long authorId, PostStatus status);
    @Query("select coalesce(sum(p.viewCount), 0) from Post p where p.author.id = :authorId and p.status = :status")
    long sumViewsByAuthorIdAndStatus(Long authorId, PostStatus status);
    Page<Post> findByTagsSlug(String tagSlug, Pageable pageable);
    Page<Post> findByStatusAndTagsSlug(PostStatus status, String tagSlug, Pageable pageable);
    Page<Post> findByStatus(PostStatus status, Pageable pageable);
    Page<Post> findByStatusAndAuthorIdIn(PostStatus status, List<Long> authorIds, Pageable pageable);
    Page<Post> findDistinctByStatusAndTagsNameIn(PostStatus status, List<String> tagNames, Pageable pageable);
    Page<Post> findByAuthorIdAndStatus(Long authorId, PostStatus status, Pageable pageable);
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);
    List<Post> findAllByAuthorId(Long authorId);
}
