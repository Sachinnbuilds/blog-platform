package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.TagDTO;
import com.blog.blog_platform.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    @Autowired
    private TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagDTO>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTagsByPopularity());
    }

    @GetMapping("/trending")
    public ResponseEntity<List<TagDTO>> getTrendingTags() {
        return ResponseEntity.ok(tagService.getTrendingTags());
    }

    @GetMapping("/{slug}/posts")
    public ResponseEntity<Page<PostSummaryDTO>> getPostsByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(tagService.getPostSummariesByTagSlug(slug, sort, page, size));
    }
}
