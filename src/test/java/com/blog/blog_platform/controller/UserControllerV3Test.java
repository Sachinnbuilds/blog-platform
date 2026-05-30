package com.blog.blog_platform.controller;

import com.blog.blog_platform.dto.OnboardingStateDTO;
import com.blog.blog_platform.dto.PostSummaryDTO;
import com.blog.blog_platform.dto.UserProfileDTO;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.service.PostService;
import com.blog.blog_platform.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerV3Test {

    @Mock
    private UserService userService;

    @Mock
    private PostService postService;

    private MockMvc mockMvc;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Principal principal = () -> "reader";

    @BeforeEach
    void setUp() {
        UserController controller = new UserController();
        ReflectionTestUtils.setField(controller, "userService", userService);
        ReflectionTestUtils.setField(controller, "postService", postService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void currentUserReturnsProfileDto() throws Exception {
        User user = new User();
        user.setUsername("reader");
        UserProfileDTO profile = profile("reader", "Reader Demo");
        when(userService.getUserByUsername("reader")).thenReturn(user);
        when(userService.toProfileDTO(user)).thenReturn(profile);

        mockMvc.perform(get("/api/users/me").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("reader"))
                .andExpect(jsonPath("$.displayName").value("Reader Demo"));
    }

    @Test
    void publicProfileReturnsProfileDto() throws Exception {
        when(userService.getPublicProfile("maya")).thenReturn(profile("maya", "Maya Rao"));

        mockMvc.perform(get("/api/users/maya"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("maya"))
                .andExpect(jsonPath("$.displayName").value("Maya Rao"));
    }

    @Test
    void publicUserPostsReturnPublishedSummaries() throws Exception {
        PostSummaryDTO post = new PostSummaryDTO();
        post.setTitle("Published Story");
        post.setSlug("published-story");
        when(postService.getPostSummariesByAuthor("maya", 1, 5))
                .thenReturn(new PageImpl<>(List.of(post), PageRequest.of(1, 5), 1));

        mockMvc.perform(get("/api/users/maya/posts").param("page", "1").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("published-story"));
    }

    @Test
    void updateProfileUsesAuthenticatedUsernameAndJsonBody() throws Exception {
        User updated = new User();
        updated.setUsername("reader");
        when(userService.updateMyProfile(any(), any())).thenReturn(updated);
        when(userService.toProfileDTO(updated)).thenReturn(profile("reader", "Reader Updated"));

        mockMvc.perform(put("/api/users/me/profile")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new ProfileBody("Reader Updated", "Bio", "example.com", "Localhost"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Reader Updated"));

        verify(userService).updateMyProfile(org.mockito.Mockito.eq("reader"), any());
    }

    @Test
    void saveInterestsUsesAuthenticatedUsername() throws Exception {
        User updated = new User();
        updated.setUsername("reader");
        ArgumentCaptor<com.blog.blog_platform.dto.InterestsRequest> requestCaptor =
                ArgumentCaptor.forClass(com.blog.blog_platform.dto.InterestsRequest.class);
        when(userService.saveInterests(org.mockito.Mockito.eq("reader"), requestCaptor.capture())).thenReturn(updated);
        when(userService.toProfileDTO(updated)).thenReturn(profile("reader", "Reader Demo"));

        mockMvc.perform(post("/api/users/me/interests")
                        .principal(principal)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"interests\":[\"publishing\",\"backend\",\"search\"]}"))
                .andExpect(status().isOk());

        assertThat(requestCaptor.getValue().getInterests()).contains("publishing", "backend", "search");
    }

    @Test
    void onboardingStateReturnsCompletionContract() throws Exception {
        when(userService.getOnboardingState("reader")).thenReturn(new OnboardingStateDTO(true, 3));

        mockMvc.perform(get("/api/users/me/onboarding-state").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.selectedInterestCount").value(3));
    }

    private static UserProfileDTO profile(String username, String displayName) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUsername(username);
        dto.setDisplayName(displayName);
        return dto;
    }

    private record ProfileBody(String displayName, String bio, String website, String location) {}
}
