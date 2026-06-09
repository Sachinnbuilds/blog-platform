package com.blog.blog_platform.service;

import com.blog.blog_platform.entity.Comment;
import com.blog.blog_platform.entity.Post;
import com.blog.blog_platform.entity.PostStatus;
import com.blog.blog_platform.entity.User;
import com.blog.blog_platform.repository.CommentRepository;
import com.blog.blog_platform.repository.PostRepository;
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
class CommentServiceV3GuardrailTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    @Test
    void addCommentRejectsDraftPosts() {
        Post draft = post(10L, PostStatus.DRAFT, 0);
        when(postRepository.findById(10L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> commentService.addComment(10L, "Looks good", "reader"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Post not found");

        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void addCommentIncrementsPostCommentCount() {
        User reader = user("reader", false);
        Post published = post(10L, PostStatus.PUBLISHED, 2);
        when(postRepository.findById(10L)).thenReturn(Optional.of(published));
        when(userRepository.findByUsername("reader")).thenReturn(Optional.of(reader));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Comment saved = commentService.addComment(10L, " Looks good ", "reader");

        assertThat(saved.getContent()).isEqualTo("Looks good");
        verify(postRepository).incrementCommentCount(10L);
    }

    @Test
    void deleteCommentDecrementsPostCommentCount() {
        User reader = user("reader", false);
        Post published = post(10L, PostStatus.PUBLISHED, 2);
        Comment comment = new Comment();
        comment.setId(50L);
        comment.setUser(reader);
        comment.setPost(published);
        when(commentRepository.findById(50L)).thenReturn(Optional.of(comment));
        when(userRepository.findByUsername("reader")).thenReturn(Optional.of(reader));

        commentService.deleteComment(50L, "reader");

        verify(commentRepository).delete(comment);
        verify(postRepository).decrementCommentCount(10L);
    }

    private static User user(String username, boolean admin) {
        User user = new User();
        user.setUsername(username);
        user.setAdmin(admin);
        return user;
    }

    private static Post post(Long id, PostStatus status, int commentCount) {
        Post post = new Post();
        post.setId(id);
        post.setStatus(status);
        post.setCommentCount(commentCount);
        return post;
    }
}
