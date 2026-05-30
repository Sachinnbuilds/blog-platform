package com.blog.blog_platform.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.service.AdminService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", adminService.getTotalUsers());
        stats.put("totalPosts", adminService.getTotalPosts());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Principal principal) {
        adminService.deleteUser(id, principal.getName());
        return ResponseEntity.ok("User deleted successfully");
    }

    @PutMapping("/users/{id}/make-admin")
    public ResponseEntity<String> makeAdmin(@PathVariable Long id) {
        adminService.makeAdmin(id);
        return ResponseEntity.ok("User is now an admin");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<String> deletePost(@PathVariable Long id) {
        adminService.deletePost(id);
        return ResponseEntity.ok("Post deleted successfully");
    }

    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanup() {
        long count = adminService.cleanupTestData();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Test data cleaned up successfully");
        response.put("deletedCount", count);
        return ResponseEntity.ok(response);
    }
}