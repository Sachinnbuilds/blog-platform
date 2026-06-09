package com.blog.blog_platform.controller;

import java.security.Principal;

import com.blog.blog_platform.dto.CommentRequest;
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

import com.blog.blog_platform.entity.Comment;
import com.blog.blog_platform.service.CommentService;

@RestController
@RequestMapping("/api/comments")
@Validated
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping("/{postId}")
    public ResponseEntity<Comment> addComment(@PathVariable Long postId,
                                              @Valid @RequestBody(required = false) CommentRequest body,
                                              @RequestParam(required = false) @Size(max = 500) String content,
                                              Principal principal) {
        return ResponseEntity.ok(commentService.addComment(postId, resolveContent(body, content), principal.getName()));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Page<Comment>> getComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId, page, size));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> editComment(@PathVariable Long id,
                                               @Valid @RequestBody(required = false) CommentRequest body,
                                               @RequestParam(required = false) @Size(max = 500) String content,
                                               Principal principal) {
        return ResponseEntity.ok(commentService.editComment(id, resolveContent(body, content), principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(@PathVariable Long id,
                                                Principal principal) {
        commentService.deleteComment(id, principal.getName());
        return ResponseEntity.ok("Comment deleted");
    }

    private String resolveContent(CommentRequest body, String content) {
        String value = body == null ? content : body.getContent();
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Comment cannot be empty");
        }
        return value;
    }
}
