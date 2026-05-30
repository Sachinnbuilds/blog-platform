package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.TagDTO;
import com.blog.blog_platform.dto.UnifiedSearchResultDTO;
import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.Tag;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.TagRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserService userService;

    public UnifiedSearchResultDTO unifiedSearch(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isBlank()) {
            return new UnifiedSearchResultDTO(List.of(), List.of(), List.of());
        }

        List<PostSummaryDTO> posts = postRepository
                .findTop5ByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCase(
                        PostStatus.PUBLISHED, normalized, PostStatus.PUBLISHED, normalized)
                .stream()
                .map(this::toPostSummaryDTO)
                .toList();

        List<UserProfileDTO> users = userRepository
                .findTop5ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(normalized, normalized)
                .stream()
                .map(userService::toProfileDTO)
                .toList();

        List<TagDTO> tags = tagRepository
                .findTop5ByNameContainingIgnoreCaseOrderByPostCountDesc(normalized)
                .stream()
                .map(this::toTagDTO)
                .toList();

        return new UnifiedSearchResultDTO(posts, users, tags);
    }

    private PostSummaryDTO toPostSummaryDTO(Post post) {
        PostSummaryDTO dto = new PostSummaryDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setSlug(post.getSlug());
        dto.setSummary(post.getSummary());
        dto.setThumbnail(post.getThumbnail());
        dto.setReadTime(post.getReadTime());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setLikes(post.getLikes());
        dto.setViewCount(post.getViewCount());
        dto.setCommentCount(post.getCommentCount());

        User author = post.getAuthor();
        if (author != null) {
            dto.setAuthorUsername(author.getUsername());
            dto.setAuthorDisplayName(author.getDisplayName());
        }

        dto.setTags(post.getTags().stream().map(this::toTagDTO).toList());
        return dto;
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
