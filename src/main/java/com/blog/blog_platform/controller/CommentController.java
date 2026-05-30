package com.blog.blog_platform.controller;

import java.security.Principal;

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
                                              @RequestParam @NotBlank @Size(max = 500) String content,
                                              Principal principal) {
        return ResponseEntity.ok(commentService.addComment(postId, content, principal.getName()));
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
                                               @RequestParam @NotBlank @Size(max = 500) String content,
                                               Principal principal) {
        return ResponseEntity.ok(commentService.editComment(id, content, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(@PathVariable Long id,
                                                Principal principal) {
        commentService.deleteComment(id, principal.getName());
        return ResponseEntity.ok("Comment deleted");
    }
}
