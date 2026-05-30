package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.service.FollowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class FollowController {

    @Autowired
    private FollowService followService;

    @PostMapping("/{username}/follow")
    public ResponseEntity<String> followUser(@PathVariable String username, Principal principal) {
        followService.follow(principal.getName(), username);
        return ResponseEntity.ok("Followed user successfully");
    }

    @DeleteMapping("/{username}/follow")
    public ResponseEntity<String> unfollowUser(@PathVariable String username, Principal principal) {
        followService.unfollow(principal.getName(), username);
        return ResponseEntity.ok("Unfollowed user successfully");
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<Page<UserProfileDTO>> getFollowers(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(followService.getFollowerProfiles(username, page, size));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<Page<UserProfileDTO>> getFollowing(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(followService.getFollowingProfiles(username, page, size));
    }

    @GetMapping("/{username}/is-following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(@PathVariable String username, Principal principal) {
        boolean isFollowing = followService.isFollowing(principal.getName(), username);
        return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
    }
}
