package com.blog.blog_platform.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.blog.blog_platform.entity.Comment;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.CommentRepository;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Comment addComment(Long postId, String content, String username) {
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Comment cannot be empty");
        }
        if (content.length() > 500) {
            throw new RuntimeException("Comment cannot exceed 500 characters");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new RuntimeException("Post not found");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = new Comment();
        comment.setContent(content.trim());
        comment.setPost(post);
        comment.setUser(user);

        Comment saved = commentRepository.save(comment);
        post.setCommentCount(Math.max(0, post.getCommentCount()) + 1);
        postRepository.save(post);
        return saved;
    }

    public Page<Comment> getCommentsByPost(Long postId, int page, int size) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new RuntimeException("Post not found");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);
    }

    public Comment editComment(Long id, String content, String username) {
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Comment cannot be empty");
        }
        if (content.length() > 500) {
            throw new RuntimeException("Comment cannot exceed 500 characters");
        }

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        comment.setContent(content.trim());
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long id, String username) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!comment.getUser().getUsername().equals(username) && !user.isAdmin()) {
            throw new RuntimeException("Unauthorized");
        }

        Post post = comment.getPost();
        commentRepository.delete(comment);
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepository.save(post);
        }
    }

    public Long getCommentCount(Long postId) {
        return commentRepository.countByPostId(postId);
    }
}
