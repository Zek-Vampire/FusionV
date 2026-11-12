package com.fusionv.service;

import com.fusionv.TestData;
import com.fusionv.dto.PostRequest;
import com.fusionv.dto.PostResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.DuplicateEntryException;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.model.Post;
import com.fusionv.model.PostLike;
import com.fusionv.model.PostType;
import com.fusionv.model.User;
import com.fusionv.repository.CommentRepository;
import com.fusionv.repository.PostLikeRepository;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock PostLikeRepository likeRepository;
    @Mock CommentRepository commentRepository;
    @Mock UserRepository userRepository;
    PostService postService;
    User author;
    User other;
    Post post;

    @BeforeEach
    void setUp() {
        postService = new PostService(postRepository, likeRepository, commentRepository, userRepository);
        author = TestData.user(1L, "Author");
        other = TestData.user(2L, "Other");
        post = new Post(author, "Hello", PostType.UPDATE, LocalDateTime.now());
        post.setId(10L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(userRepository.findById(2L)).thenReturn(Optional.of(other));
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void createPostDefaultsToUpdateType() {
        PostResponse response = postService.createPost(1L, new PostRequest("  My first post  ", null));
        assertEquals("UPDATE", response.type());
        assertEquals("My first post", response.content());
        assertEquals("Author", response.authorName());
    }

    @Test
    void structuredProjectFieldsAreSaved() {
        PostRequest request = new PostRequest("A campus marketplace", PostType.PROJECT, "CampusCart",
                List.of("Java", "Spring Boot"), "https://github.com/student/campuscart",
                "https://campuscart.example.com", null, null, LocalDate.of(2026, 9, 1));

        PostResponse response = postService.createPost(1L, request);

        assertEquals("CampusCart", response.title());
        assertEquals(List.of("Java", "Spring Boot"), response.technologies());
        assertEquals("PROJECT", response.type());
        assertEquals(LocalDate.of(2026, 9, 1), response.eventDate());
    }

    @Test
    void structuredPostRejectsUnsafeUrl() {
        PostRequest request = new PostRequest("Project", PostType.PROJECT, "Demo", List.of(),
                "javascript:alert(1)", null, null, null, null);
        assertThrows(BadRequestException.class, () -> postService.createPost(1L, request));
    }

    @Test
    void likeSavesOnce() {
        postService.likePost(2L, 10L);
        verify(likeRepository).save(any(PostLike.class));
    }

    @Test
    void duplicateLikeIsRejected() {
        when(likeRepository.existsByPostIdAndUserId(10L, 2L)).thenReturn(true);
        assertThrows(DuplicateEntryException.class, () -> postService.likePost(2L, 10L));
        verify(likeRepository, never()).save(any());
    }

    @Test
    void cannotEditSomebodyElsesPost() {
        assertThrows(NotAllowedException.class, () -> postService.editPost(2L, 10L, new PostRequest("hack", null)));
    }

    @Test
    void authorCanEditAndUpdatedAtIsSet() {
        postService.editPost(1L, 10L, new PostRequest("Edited", PostType.ACHIEVEMENT));
        assertEquals("Edited", post.getContent());
        assertEquals(PostType.ACHIEVEMENT, post.getType());
        assertEquals(true, post.getUpdatedAt() != null);
    }

    @Test
    void cannotDeleteSomebodyElsesPostButAdminCan() {
        assertThrows(NotAllowedException.class, () -> postService.deletePost(2L, false, 10L));
        postService.deletePost(2L, true, 10L);
        verify(postRepository).delete(post);
    }
}
