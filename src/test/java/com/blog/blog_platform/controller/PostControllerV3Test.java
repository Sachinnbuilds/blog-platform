package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.PostDetailDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.service.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PostControllerV3Test {

    @Mock
    private PostService postService;

    private MockMvc mockMvc;
    private final Principal principal = () -> "maya";

    @BeforeEach
    void setUp() {
        PostController controller = new PostController();
        ReflectionTestUtils.setField(controller, "postService", postService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void publicIdFetchUsesPublishedOnlyServiceMethod() throws Exception {
        Post post = new Post();
        post.setId(10L);
        post.setTitle("Published");
        post.setSlug("published");
        post.setContent("body");
        when(postService.getPublishedPostById(10L)).thenReturn(post);

        mockMvc.perform(get("/api/posts/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("published"));

        verify(postService).getPublishedPostById(10L);
    }

    @Test
    void draftsEndpointUsesAuthenticatedAuthor() throws Exception {
        PostSummaryDTO draft = summary("Draft Story", "draft-story");
        when(postService.getDraftSummariesByAuthor("maya", 0, 10))
                .thenReturn(new PageImpl<>(List.of(draft), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/posts/drafts").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("draft-story"));
    }

    @Test
    void editorEndpointUsesAuthenticatedAuthorAndReturnsDraftDetail() throws Exception {
        PostDetailDTO detail = new PostDetailDTO();
        detail.setSlug("draft-story");
        detail.setStatus(PostStatus.DRAFT);
        when(postService.getEditablePostDetailBySlug("draft-story", "maya")).thenReturn(detail);

        mockMvc.perform(get("/api/posts/editor/draft-story").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("draft-story"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createPostAcceptsTagsSummaryAndDraftStatus() throws Exception {
        Post created = new Post();
        created.setId(20L);
        created.setTitle("New Draft");
        created.setSlug("new-draft");
        created.setContent("body");
        created.setStatus(PostStatus.DRAFT);
        when(postService.createPost(
                eq("New Draft"),
                eq("body"),
                eq("maya"),
                eq(List.of("publishing", "backend")),
                eq(null),
                eq("summary"),
                eq(PostStatus.DRAFT)
        )).thenReturn(created);

        mockMvc.perform(post("/api/posts")
                        .principal(principal)
                        .param("title", "New Draft")
                        .param("content", "body")
                        .param("tags", "publishing", "backend")
                        .param("summary", "summary")
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("new-draft"))
                .andExpect(jsonPath("$.status").value("DRAFT"));

        verify(postService).createPost(any(), any(), any(), any(), any(), any(), any());
    }

    private static PostSummaryDTO summary(String title, String slug) {
        PostSummaryDTO dto = new PostSummaryDTO();
        dto.setTitle(title);
        dto.setSlug(slug);
        return dto;
    }
}
