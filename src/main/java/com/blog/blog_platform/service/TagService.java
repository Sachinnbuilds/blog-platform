package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.TagDTO;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.Tag;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TagService {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostService postService;

    public List<TagDTO> getAllTagsByPopularity() {
        return tagRepository.findAll(Sort.by(Sort.Direction.DESC, "postCount"))
                .stream()
                .map(this::toTagDTO)
                .toList();
    }

    public List<TagDTO> getTrendingTags() {
        return tagRepository.findTop20ByOrderByPostCountDesc()
                .stream()
                .map(this::toTagDTO)
                .toList();
    }

    public Page<Post> getPostsByTagSlug(String slug, String sort, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, sortForTagFeed(sort));
        return postRepository.findByStatusAndTagsSlug(PostStatus.PUBLISHED, slug, pageable);
    }

    public Page<PostSummaryDTO> getPostSummariesByTagSlug(String slug, String sort, int page, int size) {
        return getPostsByTagSlug(slug, sort, page, size).map(postService::toPostSummaryDTO);
    }

    private Sort sortForTagFeed(String sort) {
        String normalized = sort == null ? "latest" : sort.trim().toLowerCase();
        return switch (normalized) {
            case "trending" -> Sort.by(
                    Sort.Order.desc("likes"),
                    Sort.Order.desc("commentCount"),
                    Sort.Order.desc("viewCount"),
                    Sort.Order.desc("createdAt")
            );
            default -> Sort.by("createdAt").descending();
        };
    }

    private TagDTO toTagDTO(Tag tag) {
        TagDTO dto = new TagDTO();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        dto.setSlug(tag.getSlug());
        dto.setPostCount(tag.getPostCount());
        return dto;
    }
}
