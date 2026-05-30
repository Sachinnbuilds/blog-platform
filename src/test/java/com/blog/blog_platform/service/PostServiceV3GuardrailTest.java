package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.PostDetailDTO;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostLike;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.Tag;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.FollowRepository;
import com.blog.blog_platform.repository.PostLikeRepository;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.TagRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceV3GuardrailTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @InjectMocks
    private PostService postService;

    @Test
    void publicIdFetchRejectsDrafts() {
        Post draft = post(10L, "Draft", "draft", PostStatus.DRAFT, author("writer", 1L));
        when(postRepository.findById(10L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> postService.getPublishedPostById(10L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Post not found");
    }

    @Test
    void likeRejectsDraftsBeforeWritingLikeRows() {
        Post draft = post(10L, "Draft", "draft", PostStatus.DRAFT, author("writer", 1L));
        when(postRepository.findById(10L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> postService.likePost(10L, "reader"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Post not found");

        verify(postLikeRepository, never()).save(any(PostLike.class));
    }

    @Test
    void editorEndpointAllowsAuthorToLoadOwnDraft() {
        User writer = author("writer", 1L);
        Post draft = post(10L, "Draft", "draft", PostStatus.DRAFT, writer);
        when(postRepository.findBySlug("draft")).thenReturn(Optional.of(draft));
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(writer));

        PostDetailDTO dto = postService.getEditablePostDetailBySlug("draft", "writer");

        assertThat(dto.getStatus()).isEqualTo(PostStatus.DRAFT);
        assertThat(dto.getSlug()).isEqualTo("draft");
    }

    @Test
    void publicPostQueriesUsePublishedStatus() {
        postService.getAllPosts(0, 10);

        verify(postRepository).findByStatus(PostStatus.PUBLISHED, PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending()));
    }

    @Test
    void creatingPublishedPostIncrementsTagPostCount() {
        User writer = author("writer", 1L);
        Tag java = tag("java", "java", 0);
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(writer));
        when(postRepository.existsBySlug("hello-world")).thenReturn(false);
        when(tagRepository.findByNameIgnoreCase("java")).thenReturn(Optional.of(java));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Post created = postService.createPost(
                "Hello World",
                "A short post body",
                "writer",
                List.of("java"),
                null,
                "Summary",
                PostStatus.PUBLISHED
        );

        assertThat(created.getTags()).containsExactly(java);
        assertThat(java.getPostCount()).isEqualTo(1);
        verify(tagRepository).save(java);
    }

    @Test
    void movingPublishedPostToDraftDecrementsTagPostCount() {
        User writer = author("writer", 1L);
        Tag java = tag("java", "java", 1);
        Post existing = post(10L, "Hello World", "hello-world", PostStatus.PUBLISHED, writer);
        existing.setTags(new HashSet<>(Set.of(java)));
        when(postRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(writer));
        when(tagRepository.findByNameIgnoreCase("java")).thenReturn(Optional.of(java));
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        postService.updatePost(
                10L,
                "Hello World",
                "Updated body",
                List.of("java"),
                null,
                "Summary",
                PostStatus.DRAFT,
                "writer"
        );

        assertThat(java.getPostCount()).isZero();
        verify(tagRepository).save(java);
    }

    private static User author(String username, Long id) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setDisplayName(username);
        return user;
    }

    private static Post post(Long id, String title, String slug, PostStatus status, User author) {
        Post post = new Post();
        post.setId(id);
        post.setTitle(title);
        post.setSlug(slug);
        post.setContent("content");
        post.setStatus(status);
        post.setAuthor(author);
        post.setTags(new HashSet<>());
        return post;
    }

    private static Tag tag(String name, String slug, int postCount) {
        Tag tag = new Tag();
        tag.setName(name);
        tag.setSlug(slug);
        tag.setPostCount(postCount);
        return tag;
    }
}
