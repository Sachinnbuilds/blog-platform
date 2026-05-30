package com.blog.blog_platform.controller;

import java.security.Principal;
import java.util.List;

import com.blog.blog_platform.dto.PostDetailDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.service.PostService;

@RestController
@RequestMapping("/api/posts")
@Validated
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestParam @NotBlank @Size(max = 180) String title,
                                           @RequestParam @NotBlank @Size(max = 50000) String content,
                                           @RequestParam(required = false) List<String> tags,
                                           @RequestParam(required = false) @Size(max = 2048) String thumbnail,
                                           @RequestParam(required = false) @Size(max = 500) String summary,
                                           @RequestParam(defaultValue = "PUBLISHED") PostStatus status,
                                           Principal principal) {
        return ResponseEntity.ok(postService.createPost(title, content, principal.getName(), tags, thumbnail, summary, status));
    }

    @GetMapping
    public ResponseEntity<Page<PostSummaryDTO>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getAllPostSummaries(page, size));
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<PostSummaryDTO>> getTrendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getTrendingPostSummaries(page, size));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostSummaryDTO>> getFeed(
            @RequestParam(defaultValue = "for_you") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getFeedSummaries(principal.getName(), type, page, size));
    }

    @GetMapping("/by-user/{username}")
    public ResponseEntity<Page<PostSummaryDTO>> getPostsByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostSummariesByAuthor(username, page, size));
    }

    @GetMapping("/me")
    public ResponseEntity<Page<PostSummaryDTO>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getPostSummariesByAuthor(principal.getName(), page, size));
    }

    @GetMapping("/drafts")
    public ResponseEntity<Page<PostSummaryDTO>> getMyDrafts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getDraftSummariesByAuthor(principal.getName(), page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPublishedPostById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostDetailDTO> getPostBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(postService.getPostDetailBySlug(slug));
    }

    @GetMapping("/editor/{slug}")
    public ResponseEntity<PostDetailDTO> getEditablePostBySlug(@PathVariable String slug, Principal principal) {
        return ResponseEntity.ok(postService.getEditablePostDetailBySlug(slug, principal.getName()));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostSummaryDTO>> searchPosts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String author,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String query = q != null ? q : keyword;
        return ResponseEntity.ok(postService.searchPostSummaries(query, tags, author, sort, page, size));
    }

    @GetMapping("/tag/{slug}")
    public ResponseEntity<Page<PostSummaryDTO>> getPostsByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostSummariesByTag(slug, page, size));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id,
                                           @RequestParam @NotBlank @Size(max = 180) String title,
                                           @RequestParam @NotBlank @Size(max = 50000) String content,
                                           @RequestParam(required = false) List<String> tags,
                                           @RequestParam(required = false) @Size(max = 2048) String thumbnail,
                                           @RequestParam(required = false) @Size(max = 500) String summary,
                                           @RequestParam(defaultValue = "PUBLISHED") PostStatus status,
                                           Principal principal) {
        return ResponseEntity.ok(postService.updatePost(id, title, content, tags, thumbnail, summary, status, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePost(@PathVariable Long id,
                                             Principal principal) {
        postService.deletePost(id, principal.getName());
        return ResponseEntity.ok("Post deleted successfully");
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<PostDetailDTO> likePost(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Please login to like a post");
        }
        return ResponseEntity.ok(postService.likePostDetail(id, principal.getName()));
    }
}
