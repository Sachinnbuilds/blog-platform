package com.blog.blog_platform.service;

import java.util.List;
import java.util.stream.Collectors;

import com.blog.blog_platform.dto.AdminActionLogDTO;
import com.blog.blog_platform.dto.AdminUserDTO;
import com.blog.blog_platform.entity.AdminActionLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.exception.BadRequestException;
import com.blog.blog_platform.exception.ForbiddenException;
import com.blog.blog_platform.exception.NotFoundException;
import com.blog.blog_platform.repository.CommentRepository;
import com.blog.blog_platform.repository.AdminActionLogRepository;
import com.blog.blog_platform.repository.PostLikeRepository;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.UserRepository;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostService postService;

    @Autowired
    private AdminActionLogRepository adminActionLogRepository;

    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new AdminUserDTO(user.getId(), user.getUsername(), user.getEmail(), user.isAdmin()))
                .toList();
    }

    @Transactional
    public void deleteUser(Long id, String currentUsername) {
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (userToDelete.getUsername().equals(currentUsername)) {
            throw new ForbiddenException("Admins cannot delete themselves");
        }

        List<Post> authoredPosts = postRepository.findAllByAuthorId(userToDelete.getId());
        List<Long> authoredPostIds = authoredPosts.stream()
                .map(Post::getId)
                .collect(Collectors.toList());

        if (!authoredPostIds.isEmpty()) {
            postLikeRepository.deleteByPostIdIn(authoredPostIds);
            commentRepository.deleteByPostIdIn(authoredPostIds);
            postRepository.deleteAll(authoredPosts);
        }

        postLikeRepository.deleteByUserId(userToDelete.getId());
        commentRepository.deleteByUserId(userToDelete.getId());

        userRepository.delete(userToDelete);
        record(currentUsername, "DELETE_USER", "USER", id, "Deleted user " + userToDelete.getUsername());
    }

    public long cleanupTestData() {
        throw new ForbiddenException("Cleanup is disabled outside local seeded demo workflows");
    }

    public void makeAdmin(Long id, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setAdmin(true);
        userRepository.save(user);
        record(currentUsername, "MAKE_ADMIN", "USER", id, "Promoted user " + user.getUsername());
    }

    public void deletePost(Long id, String currentUsername) {
        postService.deletePost(id, currentUsername);
        record(currentUsername, "DELETE_POST", "POST", id, "Deleted post #" + id);
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public long getTotalPosts() {
        return postRepository.count();
    }

    public List<AdminActionLogDTO> getRecentActivity() {
        return adminActionLogRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(this::toActivityDTO)
                .toList();
    }

    private void record(String actorUsername, String action, String targetType, Long targetId, String details) {
        AdminActionLog log = new AdminActionLog();
        log.setActorUsername(actorUsername);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);
        adminActionLogRepository.save(log);
    }

    private AdminActionLogDTO toActivityDTO(AdminActionLog log) {
        AdminActionLogDTO dto = new AdminActionLogDTO();
        dto.setId(log.getId());
        dto.setActorUsername(log.getActorUsername());
        dto.setAction(log.getAction());
        dto.setTargetType(log.getTargetType());
        dto.setTargetId(log.getTargetId());
        dto.setDetails(log.getDetails());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
