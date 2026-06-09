package com.blog.blog_platform.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostLike;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.Tag;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.exception.BadRequestException;
import com.blog.blog_platform.exception.ForbiddenException;
import com.blog.blog_platform.exception.NotFoundException;
import com.blog.blog_platform.dto.PostDetailDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.TagDTO;
import com.blog.blog_platform.repository.PostLikeRepository;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.FollowRepository;
import com.blog.blog_platform.repository.TagRepository;
import com.blog.blog_platform.repository.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PostService {

    private static final Logger log = LoggerFactory.getLogger(PostService.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private FollowRepository followRepository;

    @Transactional
    public Post createPost(String title, String content, String username, List<String> tagNames, String thumbnail, String summary, PostStatus status) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setSlug(generateSlug(title));
        post.setAuthor(user);
        post.setLikes(0);
        post.setThumbnail(thumbnail);
        post.setSummary(summary);
        post.setStatus(status == null ? PostStatus.PUBLISHED : status);
        post.setReadTime(estimateReadTime(content));
        post.setTags(resolveTags(tagNames));

        if (post.getStatus() == PostStatus.PUBLISHED) {
            adjustTagCounts(Set.of(), post.getTags());
        }

        Post saved = postRepository.save(post);
        log.info("Post created: id={} slug={} author={} status={}", saved.getId(), saved.getSlug(), username, saved.getStatus());
        return saved;
    }

    public Page<Post> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByStatus(PostStatus.PUBLISHED, pageable);
    }

    public Page<PostSummaryDTO> getAllPostSummaries(int page, int size) {
        return getAllPosts(page, size).map(this::toPostSummaryDTO);
    }

    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }

    public Post getPublishedPostById(Long id) {
        Post post = getPostById(id);
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw new NotFoundException("Post not found");
        }
        return post;
    }

    @Transactional
    public Post getPostBySlug(String slug) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        if (post.getStatus() == PostStatus.DRAFT) {
            throw new NotFoundException("Post not found");
        }
        postRepository.incrementViewCount(slug);
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }

    @Transactional
    public PostDetailDTO getPostDetailBySlug(String slug) {
        return getPostDetailBySlug(slug, null);
    }

    @Transactional
    public PostDetailDTO getPostDetailBySlug(String slug, String viewerUsername) {
        return toPostDetailDTO(getPostBySlug(slug), viewerUsername);
    }

    public PostDetailDTO getEditablePostDetailBySlug(String slug, String username) {
        Post post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!post.getAuthor().getUsername().equals(username) && !user.isAdmin()) {
            throw new ForbiddenException("You are not allowed to do this");
        }

        return toPostDetailDTO(post);
    }

    public Page<Post> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByStatusAndTitleContainingIgnoreCaseOrStatusAndContentContainingIgnoreCase(
                PostStatus.PUBLISHED, keyword, PostStatus.PUBLISHED, keyword, pageable);
    }

    public Page<Post> searchPosts(String query, List<String> tags, String author, String sort, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, sortForSearch(sort));
        Specification<Post> spec = (root, criteriaQuery, criteriaBuilder) -> {
            criteriaQuery.distinct(true);
            var predicate = criteriaBuilder.equal(root.get("status"), PostStatus.PUBLISHED);

            if (query != null && !query.isBlank()) {
                String likeQuery = "%" + query.trim().toLowerCase() + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likeQuery),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), likeQuery),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), likeQuery)
                ));
            }

            if (author != null && !author.isBlank()) {
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.equal(criteriaBuilder.lower(root.get("author").get("username")), author.trim().toLowerCase())
                );
            }

            if (tags != null && !tags.isEmpty()) {
                List<String> normalizedTags = tags.stream()
                        .filter(tag -> tag != null && !tag.isBlank())
                        .map(tag -> tag.trim().toLowerCase())
                        .toList();
                if (!normalizedTags.isEmpty()) {
                    var tagJoin = root.join("tags");
                    predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                            tagJoin.get("name").in(normalizedTags),
                            tagJoin.get("slug").in(normalizedTags)
                    ));
                }
            }

            return predicate;
        };
        return postRepository.findAll(spec, pageable);
    }

    public Page<PostSummaryDTO> searchPostSummaries(String query, List<String> tags, String author, String sort, int page, int size) {
        return searchPosts(query, tags, author, sort, page, size).map(this::toPostSummaryDTO);
    }

    public Page<Post> getPostsByTag(String tagSlug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByStatusAndTagsSlug(PostStatus.PUBLISHED, tagSlug, pageable);
    }

    public Page<Post> getPostsByTag(String tagSlug, String sort, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, sortForSearch(sort));
        return postRepository.findByStatusAndTagsSlug(PostStatus.PUBLISHED, tagSlug, pageable);
    }

    public Page<PostSummaryDTO> getPostSummariesByTag(String tagSlug, int page, int size) {
        return getPostsByTag(tagSlug, page, size).map(this::toPostSummaryDTO);
    }

    public Page<PostSummaryDTO> getPostSummariesByTag(String tagSlug, String sort, int page, int size) {
        return getPostsByTag(tagSlug, sort, page, size).map(this::toPostSummaryDTO);
    }

    public Page<Post> getPostsByAuthor(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByAuthorIdAndStatus(user.getId(), PostStatus.PUBLISHED, pageable);
    }

    public Page<PostSummaryDTO> getPostSummariesByAuthor(String username, int page, int size) {
        return getPostsByAuthor(username, page, size).map(this::toPostSummaryDTO);
    }

    public Page<Post> getTrendingPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(
                Sort.Order.desc("likes"),
                Sort.Order.desc("commentCount"),
                Sort.Order.desc("viewCount"),
                Sort.Order.desc("createdAt")
        ));
        return postRepository.findByStatus(PostStatus.PUBLISHED, pageable);
    }

    public Page<PostSummaryDTO> getTrendingPostSummaries(int page, int size) {
        return getTrendingPosts(page, size).map(this::toPostSummaryDTO);
    }

    public Page<Post> getFeed(String username, String type, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        String feedType = type == null ? "for_you" : type.trim().toLowerCase();

        if ("latest".equals(feedType)) {
            return getAllPosts(page, size);
        }

        if ("following".equals(feedType)) {
            return getFollowingFeed(user, page, size);
        }

        Page<Post> forYou = getForYouFeed(user, page, size);
        if (forYou.hasContent()) {
            return forYou;
        }
        return getFollowingFeed(user, page, size);
    }

    public Page<PostSummaryDTO> getFeedSummaries(String username, String type, int page, int size) {
        return getFeed(username, type, page, size).map(this::toPostSummaryDTO);
    }

    public Page<Post> getDraftsByAuthor(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return postRepository.findByAuthorIdAndStatus(user.getId(), PostStatus.DRAFT, pageable);
    }

    public Page<PostSummaryDTO> getDraftSummariesByAuthor(String username, int page, int size) {
        return getDraftsByAuthor(username, page, size).map(this::toPostSummaryDTO);
    }

    @Transactional
    public Post updatePost(Long id, String title, String content, List<String> tagNames, String thumbnail, String summary, PostStatus status, String username) {
        Post post = getPostById(id);
        Set<Tag> previousTags = new HashSet<>(post.getTags());
        PostStatus previousStatus = post.getStatus();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!post.getAuthor().getUsername().equals(username) && !user.isAdmin()) {
            throw new ForbiddenException("You are not allowed to do this");
        }

        // Only regenerate slug if title changed to avoid breaking existing links
        if (!post.getTitle().equals(title)) {
            post.setSlug(generateSlug(title));
        }

        post.setTitle(title);
        post.setContent(content);
        post.setReadTime(estimateReadTime(content));
        post.setSummary(summary);
        post.setStatus(status == null ? post.getStatus() : status);
        Set<Tag> nextTags = resolveTags(tagNames);
        post.setTags(nextTags);

        if (thumbnail != null && !thumbnail.isEmpty()) {
            post.setThumbnail(thumbnail);
        }

        syncTagCounts(previousTags, nextTags, previousStatus, post.getStatus());
        return postRepository.save(post);
    }

    @Transactional
    public void deletePost(Long id, String username) {
        Post post = getPostById(id);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!post.getAuthor().getUsername().equals(username) && !user.isAdmin()) {
            throw new ForbiddenException("You are not allowed to do this");
        }

        if (post.getStatus() == PostStatus.PUBLISHED) {
            adjustTagCounts(post.getTags(), Set.of());
        }
        log.info("Post deleted: id={} by={}", id, username);
        postRepository.delete(post);
    }

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Transactional
    public Post likePost(Long id, String username) {
        Post post = getPublishedPostById(id);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), id)) {
            postLikeRepository.deleteByUserIdAndPostId(user.getId(), id);
            post.setLikes(post.getLikes() - 1);
        } else {
            PostLike like = new PostLike();
            like.setUser(user);
            like.setPost(post);
            postLikeRepository.save(like);
            post.setLikes(post.getLikes() + 1);
        }
        return postRepository.save(post);
    }

    @Transactional
    public PostDetailDTO likePostDetail(Long id, String username) {
        return toPostDetailDTO(likePost(id, username), username);
    }

    public PostSummaryDTO toPostSummaryDTO(Post post) {
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
        dto.setStatus(post.getStatus());

        User author = post.getAuthor();
        if (author != null) {
            dto.setAuthorUsername(author.getUsername());
            dto.setAuthorDisplayName(author.getDisplayName());
        }

        dto.setTags(post.getTags().stream().map(this::toTagDTO).toList());
        return dto;
    }

    public PostDetailDTO toPostDetailDTO(Post post) {
        PostDetailDTO dto = new PostDetailDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setSlug(post.getSlug());
        dto.setContent(post.getContent());
        dto.setSummary(post.getSummary());
        dto.setThumbnail(post.getThumbnail());
        dto.setReadTime(post.getReadTime());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        dto.setLikes(post.getLikes());
        dto.setViewCount(post.getViewCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setStatus(post.getStatus());

        User author = post.getAuthor();
        if (author != null) {
            dto.setAuthorUsername(author.getUsername());
            dto.setAuthorDisplayName(author.getDisplayName());
        }

        dto.setTags(post.getTags().stream().map(this::toTagDTO).toList());
        return dto;
    }

    public PostDetailDTO toPostDetailDTO(Post post, String viewerUsername) {
        PostDetailDTO dto = toPostDetailDTO(post);
        if (viewerUsername == null || viewerUsername.isBlank()) {
            return dto;
        }
        userRepository.findByUsername(viewerUsername).ifPresent(viewer ->
                dto.setLikedByCurrentUser(postLikeRepository.existsByUserIdAndPostId(viewer.getId(), post.getId()))
        );
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

    private String generateSlug(String title) {
        String baseSlug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .trim();
        String slug = baseSlug;
        int count = 1;
        while (postRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        if (tagNames == null) {
            return tags;
        }
        for (String rawName : tagNames) {
            if (rawName == null || rawName.isBlank()) {
                continue;
            }
            String normalized = rawName.trim().toLowerCase();
            Tag tag = tagRepository.findByNameIgnoreCase(normalized)
                    .orElseGet(() -> {
                        Tag created = new Tag();
                        created.setName(normalized);
                        created.setSlug(generateTagSlug(normalized));
                        created.setPostCount(0);
                        return tagRepository.save(created);
                    });
            tags.add(tag);
        }
        return tags;
    }

    private void syncTagCounts(Set<Tag> previousTags, Set<Tag> nextTags, PostStatus previousStatus, PostStatus nextStatus) {
        Set<Tag> countedBefore = previousStatus == PostStatus.PUBLISHED ? previousTags : Set.of();
        Set<Tag> countedAfter = nextStatus == PostStatus.PUBLISHED ? nextTags : Set.of();
        adjustTagCounts(countedBefore, countedAfter);
    }

    private void adjustTagCounts(Set<Tag> previousTags, Set<Tag> nextTags) {
        Map<String, Tag> previousBySlug = previousTags.stream()
                .filter(tag -> tag.getSlug() != null)
                .collect(Collectors.toMap(Tag::getSlug, Function.identity(), (left, right) -> left));
        Map<String, Tag> nextBySlug = nextTags.stream()
                .filter(tag -> tag.getSlug() != null)
                .collect(Collectors.toMap(Tag::getSlug, Function.identity(), (left, right) -> left));

        previousBySlug.forEach((slug, tag) -> {
            if (!nextBySlug.containsKey(slug)) {
                tag.setPostCount(Math.max(0, tag.getPostCount() - 1));
                tagRepository.save(tag);
            }
        });

        nextBySlug.forEach((slug, tag) -> {
            if (!previousBySlug.containsKey(slug)) {
                tag.setPostCount(Math.max(0, tag.getPostCount()) + 1);
                tagRepository.save(tag);
            }
        });
    }

    private String generateTagSlug(String name) {
        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-")
                .trim();
        String slug = baseSlug;
        int count = 1;
        while (tagRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }

    private String estimateReadTime(String content) {
        if (content == null || content.isBlank()) {
            return "1 min read";
        }
        int words = content.trim().split("\\s+").length;
        int minutes = Math.max(1, (int) Math.ceil(words / 200.0));
        return minutes + " min read";
    }

    private Sort sortForSearch(String sort) {
        String normalized = sort == null ? "latest" : sort.trim().toLowerCase();
        return switch (normalized) {
            case "oldest" -> Sort.by("createdAt").ascending();
            case "trending" -> Sort.by(
                    Sort.Order.desc("likes"),
                    Sort.Order.desc("commentCount"),
                    Sort.Order.desc("viewCount"),
                    Sort.Order.desc("createdAt")
            );
            default -> Sort.by("createdAt").descending();
        };
    }

    private Page<Post> getFollowingFeed(User user, int page, int size) {
        List<Long> followingIds = followRepository.findFollowingIdsByFollowerId(user.getId());
        if (followingIds.isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findByStatusAndAuthorIdIn(PostStatus.PUBLISHED, followingIds, pageable);
    }

    private Page<Post> getForYouFeed(User user, int page, int size) {
        Set<String> interests = user.getInterests();
        if (interests == null || interests.isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return postRepository.findDistinctByStatusAndTagsNameIn(
                PostStatus.PUBLISHED,
                interests.stream().toList(),
                pageable
        );
    }
}
