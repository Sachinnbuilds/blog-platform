package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.AuthorStatsDTO;
import com.blog.blog_platform.dto.PlatformStatsDTO;
import com.blog.blog_platform.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping
    public ResponseEntity<PlatformStatsDTO> getPlatformStats() {
        return ResponseEntity.ok(statsService.getPlatformStats());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthorStatsDTO> getMyAuthorStats(Principal principal) {
        return ResponseEntity.ok(statsService.getAuthorStats(principal.getName()));
    }
}
