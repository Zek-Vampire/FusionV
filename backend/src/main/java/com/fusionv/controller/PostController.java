package com.fusionv.controller;

import com.fusionv.dto.CommentRequest;
import com.fusionv.dto.CommentResponse;
import com.fusionv.dto.PostRequest;
import com.fusionv.dto.PostResponse;
import com.fusionv.model.PostType;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(me.getId(), request));
    }

    /** The feed. Use mine=true for your own posts, or authorId / type to filter. */
    @GetMapping
    public List<PostResponse> feed(@AuthenticationPrincipal UserPrincipal me,
                                   @RequestParam(required = false) Long authorId,
                                   @RequestParam(required = false) PostType type,
                                   @RequestParam(defaultValue = "false") boolean mine,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Long author = mine ? me.getId() : authorId;
        return postService.getFeed(me.getId(), author, type, page, size);
    }

    @PutMapping("/{id}")
    public PostResponse edit(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id,
                             @Valid @RequestBody PostRequest request) {
        return postService.editPost(me.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        postService.deletePost(me.getId(), me.isAdmin(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public PostResponse like(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return postService.likePost(me.getId(), id);
    }

    @DeleteMapping("/{id}/like")
    public PostResponse unlike(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id) {
        return postService.unlikePost(me.getId(), id);
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponse> comments(@PathVariable Long id) {
        return postService.listComments(id);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long id,
                                                      @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.addComment(me.getId(), id, request.content()));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal UserPrincipal me, @PathVariable Long commentId) {
        postService.deleteComment(me.getId(), me.isAdmin(), commentId);
        return ResponseEntity.noContent().build();
    }
}
