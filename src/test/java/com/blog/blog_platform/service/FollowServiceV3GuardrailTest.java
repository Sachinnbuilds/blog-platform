package com.blog.blog_platform.service;

import com.blog.blog_platform.entity.Follow;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.FollowRepository;
import com.blog.blog_platform.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FollowServiceV3GuardrailTest {

    @Mock
    private FollowRepository followRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private FollowService followService;

    @Test
    void followRejectsSelfFollow() {
        User writer = user(1L, "writer", 0, 0);
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(writer));

        assertThatThrownBy(() -> followService.follow("writer", "writer"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Cannot follow yourself");

        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    void followUpdatesBothUserCounts() {
        User follower = user(1L, "reader", 0, 2);
        User following = user(2L, "writer", 5, 0);
        when(userRepository.findByUsername("reader")).thenReturn(Optional.of(follower));
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(following));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);

        followService.follow("reader", "writer");

        assertThat(follower.getFollowingCount()).isEqualTo(3);
        assertThat(following.getFollowerCount()).isEqualTo(6);
        verify(userRepository).save(follower);
        verify(userRepository).save(following);
    }

    @Test
    void unfollowUpdatesBothUserCounts() {
        User follower = user(1L, "reader", 0, 3);
        User following = user(2L, "writer", 6, 0);
        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        when(userRepository.findByUsername("reader")).thenReturn(Optional.of(follower));
        when(userRepository.findByUsername("writer")).thenReturn(Optional.of(following));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(follow));

        followService.unfollow("reader", "writer");

        assertThat(follower.getFollowingCount()).isEqualTo(2);
        assertThat(following.getFollowerCount()).isEqualTo(5);
        verify(followRepository).delete(follow);
        verify(userRepository).save(follower);
        verify(userRepository).save(following);
    }

    private static User user(Long id, String username, int followers, int following) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setFollowerCount(followers);
        user.setFollowingCount(following);
        return user;
    }
}
