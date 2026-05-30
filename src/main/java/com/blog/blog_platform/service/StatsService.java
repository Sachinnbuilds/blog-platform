package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.AuthorStatsDTO;
import com.blog.blog_platform.dto.PlatformStatsDTO;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.TagRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private TagRepository tagRepository;

    public PlatformStatsDTO getPlatformStats() {
        return new PlatformStatsDTO(
                userRepository.count(),
                postRepository.countByStatus(PostStatus.PUBLISHED),
                tagRepository.count()
        );
    }

    public AuthorStatsDTO getAuthorStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new AuthorStatsDTO(
                postRepository.countByAuthorIdAndStatus(user.getId(), PostStatus.PUBLISHED),
                postRepository.countByAuthorIdAndStatus(user.getId(), PostStatus.DRAFT),
                postRepository.sumLikesByAuthorIdAndStatus(user.getId(), PostStatus.PUBLISHED),
                postRepository.sumViewsByAuthorIdAndStatus(user.getId(), PostStatus.PUBLISHED),
                user.getFollowerCount()
        );
    }
}
