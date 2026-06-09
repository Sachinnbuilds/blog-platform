package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.entity.Follow;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.exception.BadRequestException;
import com.blog.blog_platform.exception.ForbiddenException;
import com.blog.blog_platform.exception.NotFoundException;
import com.blog.blog_platform.repository.FollowRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FollowService {

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public void follow(String currentUsername, String targetUsername) {
        User follower = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
        User following = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (follower.getId().equals(following.getId())) {
            throw new BadRequestException("You cannot follow yourself");
        }

        if (followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId())) {
            return;
        }

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);

        userRepository.incrementFollowingCount(follower.getId());
        userRepository.incrementFollowerCount(following.getId());
    }

    @Transactional
    public void unfollow(String currentUsername, String targetUsername) {
        User follower = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
        User following = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Follow follow = followRepository.findByFollowerIdAndFollowingId(follower.getId(), following.getId())
                .orElse(null);
        if (follow == null) {
            return;
        }

        followRepository.delete(follow);
        userRepository.decrementFollowingCount(follower.getId());
        userRepository.decrementFollowerCount(following.getId());
    }

    public boolean isFollowing(String currentUsername, String targetUsername) {
        User follower = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
        User following = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId());
    }

    public Page<User> getFollowers(String username, int page, int size) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return followRepository.findByFollowingId(target.getId(), pageable)
                .map(Follow::getFollower);
    }

    public Page<User> getFollowing(String username, int page, int size) {
        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return followRepository.findByFollowerId(target.getId(), pageable)
                .map(Follow::getFollowing);
    }

    public Page<UserProfileDTO> getFollowerProfiles(String username, int page, int size) {
        return getFollowers(username, page, size).map(userService::toProfileDTO);
    }

    public Page<UserProfileDTO> getFollowingProfiles(String username, int page, int size) {
        return getFollowing(username, page, size).map(userService::toProfileDTO);
    }
}
