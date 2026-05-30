package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.service.FollowService;
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

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FollowControllerV3Test {

    @Mock
    private FollowService followService;

    private MockMvc mockMvc;
    private final Principal principal = () -> "reader";

    @BeforeEach
    void setUp() {
        FollowController controller = new FollowController();
        ReflectionTestUtils.setField(controller, "followService", followService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void followUsesAuthenticatedUserAndTargetUsername() throws Exception {
        mockMvc.perform(post("/api/users/maya/follow").principal(principal))
                .andExpect(status().isOk());

        verify(followService).follow("reader", "maya");
    }

    @Test
    void unfollowUsesAuthenticatedUserAndTargetUsername() throws Exception {
        mockMvc.perform(delete("/api/users/maya/follow").principal(principal))
                .andExpect(status().isOk());

        verify(followService).unfollow("reader", "maya");
    }

    @Test
    void isFollowingReturnsBooleanContract() throws Exception {
        when(followService.isFollowing("reader", "maya")).thenReturn(true);

        mockMvc.perform(get("/api/users/maya/is-following").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFollowing").value(true));
    }

    @Test
    void followersReturnProfileDtos() throws Exception {
        UserProfileDTO follower = profile("reader", "Reader Demo");
        when(followService.getFollowerProfiles("maya", 0, 20))
                .thenReturn(new PageImpl<>(List.of(follower), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/users/maya/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("reader"))
                .andExpect(jsonPath("$.content[0].displayName").value("Reader Demo"));
    }

    private static UserProfileDTO profile(String username, String displayName) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUsername(username);
        dto.setDisplayName(displayName);
        return dto;
    }
}
