package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.InterestsRequest;
import com.blog.blog_platform.dto.OnboardingStateDTO;
import com.blog.blog_platform.dto.UpdateProfileRequest;
import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserProfileDTO getPublicProfile(String username) {
        return toProfileDTO(getUserByUsername(username));
    }

    public User updateMyProfile(String currentUsername, UpdateProfileRequest request) {
        User user = getUserByUsername(currentUsername);
        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }
        if (request.getWebsite() != null) {
            user.setWebsite(request.getWebsite().trim());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation().trim());
        }
        return userRepository.save(user);
    }

    public User incrementTokenVersion(String currentUsername) {
        User user = getUserByUsername(currentUsername);
        user.setTokenVersion(user.getTokenVersion() + 1);
        return userRepository.save(user);
    }

    public User saveInterests(String currentUsername, InterestsRequest request) {
        User user = getUserByUsername(currentUsername);
        Set<String> normalized = request.getInterests() == null
                ? Set.of()
                : request.getInterests().stream()
                        .filter(v -> v != null && !v.isBlank())
                        .map(v -> v.trim().toLowerCase())
                        .limit(10)
                        .collect(Collectors.toSet());
        user.setInterests(normalized);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public OnboardingStateDTO getOnboardingState(String currentUsername) {
        User user = getUserByUsername(currentUsername);
        int size = user.getInterests() == null ? 0 : user.getInterests().size();
        return new OnboardingStateDTO(size >= 3, size);
    }

    public UserProfileDTO toProfileDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUsername(user.getUsername());
        dto.setDisplayName(user.getDisplayName());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setWebsite(user.getWebsite());
        dto.setLocation(user.getLocation());
        dto.setJoinedAt(user.getJoinedAt());
        dto.setFollowerCount(user.getFollowerCount());
        dto.setFollowingCount(user.getFollowingCount());
        return dto;
    }
}
