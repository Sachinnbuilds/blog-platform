package com.blog.blog_platform.controller;

import java.security.Principal;
import java.util.List;

import com.blog.blog_platform.dto.PostDetailDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.PostUpsertRequest;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.exception.BadRequestException;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestBody;
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
    public ResponseEntity<Post> createPost(@Valid @RequestBody(required = false) PostUpsertRequest body,
                                           @RequestParam(required = false) @Size(max = 180) String title,
                                           @RequestParam(required = false) @Size(max = 50000) String content,
                                           @RequestParam(required = false) List<String> tags,
                                           @RequestParam(required = false) @Size(max = 2048) String thumbnail,
                                           @RequestParam(required = false) @Size(max = 500) String summary,
                                           @RequestParam(defaultValue = "PUBLISHED") PostStatus status,
                                           Principal principal) {
        PostUpsertRequest request = resolveRequest(body, title, content, tags, thumbnail, summary, status);
        return ResponseEntity.ok(postService.createPost(
                request.getTitle(),
                request.getContent(),
                principal.getName(),
                request.getTags(),
                request.getThumbnail(),
                request.getSummary(),
                request.getStatus()
        ));
    }

    @GetMapping
    public ResponseEntity<Page<PostSummaryDTO>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getAllPostSummaries(safePage(page), safeSize(size)));
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<PostSummaryDTO>> getTrendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getTrendingPostSummaries(safePage(page), safeSize(size)));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostSummaryDTO>> getFeed(
            @RequestParam(defaultValue = "for_you") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getFeedSummaries(principal.getName(), type, safePage(page), safeSize(size)));
    }

    @GetMapping("/by-user/{username}")
    public ResponseEntity<Page<PostSummaryDTO>> getPostsByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostSummariesByAuthor(username, safePage(page), safeSize(size)));
    }

    @GetMapping("/me")
    public ResponseEntity<Page<PostSummaryDTO>> getMyPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getPostSummariesByAuthor(principal.getName(), safePage(page), safeSize(size)));
    }

    @GetMapping("/drafts")
    public ResponseEntity<Page<PostSummaryDTO>> getMyDrafts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        return ResponseEntity.ok(postService.getDraftSummariesByAuthor(principal.getName(), safePage(page), safeSize(size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPublishedPostById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostDetailDTO> getPostBySlug(@PathVariable String slug, Principal principal) {
        String username = principal == null ? null : principal.getName();
        return ResponseEntity.ok(postService.getPostDetailBySlug(slug, username));
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
        return ResponseEntity.ok(postService.searchPostSummaries(query, tags, author, sort, safePage(page), safeSize(size)));
    }

    @GetMapping("/tag/{slug}")
    public ResponseEntity<Page<PostSummaryDTO>> getPostsByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostSummariesByTag(slug, safePage(page), safeSize(size)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id,
                                           @Valid @RequestBody(required = false) PostUpsertRequest body,
                                           @RequestParam(required = false) @Size(max = 180) String title,
                                           @RequestParam(required = false) @Size(max = 50000) String content,
                                           @RequestParam(required = false) List<String> tags,
                                           @RequestParam(required = false) @Size(max = 2048) String thumbnail,
                                           @RequestParam(required = false) @Size(max = 500) String summary,
                                           @RequestParam(defaultValue = "PUBLISHED") PostStatus status,
                                           Principal principal) {
        PostUpsertRequest request = resolveRequest(body, title, content, tags, thumbnail, summary, status);
        return ResponseEntity.ok(postService.updatePost(
                id,
                request.getTitle(),
                request.getContent(),
                request.getTags(),
                request.getThumbnail(),
                request.getSummary(),
                request.getStatus(),
                principal.getName()
        ));
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

    private PostUpsertRequest resolveRequest(PostUpsertRequest body, String title, String content, List<String> tags,
                                             String thumbnail, String summary, PostStatus status) {
        PostUpsertRequest request = body;
        if (request == null) {
            request = new PostUpsertRequest();
            request.setTitle(title);
            request.setContent(content);
            request.setTags(tags);
            request.setThumbnail(thumbnail);
            request.setSummary(summary);
            request.setStatus(status);
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("Content is required");
        }
        return request;
    }

    private int safePage(int page) {
        return Math.max(0, page);
    }

    private int safeSize(int size) {
        return Math.max(1, Math.min(size, 50));
    }
}
