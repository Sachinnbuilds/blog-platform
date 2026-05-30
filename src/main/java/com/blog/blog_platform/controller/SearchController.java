package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.UnifiedSearchResultDTO;
import com.blog.blog_platform.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping("/unified")
    public ResponseEntity<UnifiedSearchResultDTO> unifiedSearch(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(searchService.unifiedSearch(q));
    }
}
