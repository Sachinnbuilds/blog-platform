package com.blog.blog_platform.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.CommentRepository;
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

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id, String currentUsername) {
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userToDelete.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Admins cannot delete themselves");
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
    }

    public long cleanupTestData() {
        List<Post> testPosts = postRepository.findAll().stream()
                .filter(p -> p.getTitle().toLowerCase().contains("test")
                        || p.getContent().toLowerCase().contains("test junk"))
                .toList();
        long count = testPosts.size();
        postRepository.deleteAll(testPosts);
        return count;
    }

    public void makeAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAdmin(true);
        userRepository.save(user);
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public long getTotalPosts() {
        return postRepository.count();
    }
}
