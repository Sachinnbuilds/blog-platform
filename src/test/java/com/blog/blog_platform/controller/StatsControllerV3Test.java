package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.AuthorStatsDTO;
import com.blog.blog_platform.dto.PlatformStatsDTO;
import com.blog.blog_platform.service.StatsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatsControllerV3Test {

    @Mock
    private StatsService statsService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        StatsController controller = new StatsController();
        ReflectionTestUtils.setField(controller, "statsService", statsService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void platformStatsReturnsPublicTotals() throws Exception {
        when(statsService.getPlatformStats()).thenReturn(new PlatformStatsDTO(9, 14, 6));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(9))
                .andExpect(jsonPath("$.totalPosts").value(14))
                .andExpect(jsonPath("$.totalTags").value(6));
    }

    @Test
    void myStatsUseAuthenticatedPrincipal() throws Exception {
        Principal principal = () -> "writer";
        when(statsService.getAuthorStats("writer"))
                .thenReturn(new AuthorStatsDTO(4, 2, 31, 220, 12));

        mockMvc.perform(get("/api/stats/me").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publishedCount").value(4))
                .andExpect(jsonPath("$.draftCount").value(2))
                .andExpect(jsonPath("$.totalLikes").value(31))
                .andExpect(jsonPath("$.totalViews").value(220))
                .andExpect(jsonPath("$.followerCount").value(12));
    }
}
