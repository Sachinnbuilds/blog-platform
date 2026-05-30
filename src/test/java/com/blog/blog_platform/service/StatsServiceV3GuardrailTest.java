package com.blog.blog_platform.service;

import com.blog.blog_platform.dto.AuthorStatsDTO;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.PostRepository;
import com.blog.blog_platform.repository.TagRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceV3GuardrailTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private StatsService statsService;

    @Test
    void authorStatsUsePublishedEngagementAndDraftCount() {
        User writer = new User();
        writer.setId(7L);
        writer.setUsername("writer");
        writer.setFollowerCount(12);
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(writer));
        when(postRepository.countByAuthorIdAndStatus(7L, PostStatus.PUBLISHED)).thenReturn(4L);
        when(postRepository.countByAuthorIdAndStatus(7L, PostStatus.DRAFT)).thenReturn(2L);
        when(postRepository.sumLikesByAuthorIdAndStatus(7L, PostStatus.PUBLISHED)).thenReturn(31L);
        when(postRepository.sumViewsByAuthorIdAndStatus(7L, PostStatus.PUBLISHED)).thenReturn(220L);

        AuthorStatsDTO stats = statsService.getAuthorStats("writer");

        assertThat(stats.getPublishedCount()).isEqualTo(4);
        assertThat(stats.getDraftCount()).isEqualTo(2);
        assertThat(stats.getTotalLikes()).isEqualTo(31);
        assertThat(stats.getTotalViews()).isEqualTo(220);
        assertThat(stats.getFollowerCount()).isEqualTo(12);
    }
}
