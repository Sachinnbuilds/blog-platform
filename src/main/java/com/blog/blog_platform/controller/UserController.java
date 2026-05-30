package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.InterestsRequest;
import com.blog.blog_platform.dto.OnboardingStateDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.UpdateProfileRequest;
import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.service.PostService;
import com.blog.blog_platform.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PostService postService;

    @PostMapping("/logout-all")
    public ResponseEntity<String> logoutFromAllDevices(Principal principal) {
        userService.incrementTokenVersion(principal.getName());
        return ResponseEntity.ok("Logged out from all devices successfully. Please log in again.");
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getCurrentUser(Principal principal) {
        User user = userService.getUserByUsername(principal.getName());
        return ResponseEntity.ok(userService.toProfileDTO(user));
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDTO> getPublicProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getPublicProfile(username));
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<Page<PostSummaryDTO>> getUserPublishedPosts(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostSummariesByAuthor(username, page, size));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<UserProfileDTO> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Principal principal) {
        User updated = userService.updateMyProfile(principal.getName(), request);
        return ResponseEntity.ok(userService.toProfileDTO(updated));
    }

    @PostMapping("/me/interests")
    public ResponseEntity<UserProfileDTO> saveInterests(
            @RequestBody InterestsRequest request,
            Principal principal) {
        User updated = userService.saveInterests(principal.getName(), request);
        return ResponseEntity.ok(userService.toProfileDTO(updated));
    }

    @GetMapping("/me/onboarding-state")
    public ResponseEntity<OnboardingStateDTO> getOnboardingState(Principal principal) {
        return ResponseEntity.ok(userService.getOnboardingState(principal.getName()));
    }
}
