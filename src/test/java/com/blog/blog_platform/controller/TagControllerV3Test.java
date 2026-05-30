package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.TagDTO;
import com.blog.blog_platform.service.TagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TagControllerV3Test {

    @Mock
    private TagService tagService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        TagController controller = new TagController();
        ReflectionTestUtils.setField(controller, "tagService", tagService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void trendingTagsReturnDtos() throws Exception {
        TagDTO java = tag("java", "java", 3);
        when(tagService.getTrendingTags()).thenReturn(List.of(java));

        mockMvc.perform(get("/api/tags/trending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("java"))
                .andExpect(jsonPath("$[0].slug").value("java"))
                .andExpect(jsonPath("$[0].postCount").value(3));
    }

    @Test
    void tagPostsPassSortAndPaginationToService() throws Exception {
        Page<PostSummaryDTO> emptyPage = new PageImpl<>(List.of(), PageRequest.of(1, 5), 0);
        when(tagService.getPostSummariesByTagSlug("java", "trending", 1, 5))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/tags/java/posts")
                        .param("sort", "trending")
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(1))
                .andExpect(jsonPath("$.size").value(5));

        verify(tagService).getPostSummariesByTagSlug("java", "trending", 1, 5);
    }

    private static TagDTO tag(String name, String slug, int postCount) {
        TagDTO dto = new TagDTO();
        dto.setName(name);
        dto.setSlug(slug);
        dto.setPostCount(postCount);
        return dto;
    }
}
