package com.fusionv.service;

import com.fusionv.dto.CommentResponse;
import com.fusionv.dto.PostRequest;
import com.fusionv.dto.PostResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.DuplicateEntryException;
import com.fusionv.exception.NotAllowedException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.Comment;
import com.fusionv.model.Post;
import com.fusionv.model.PostLike;
import com.fusionv.model.PostType;
import com.fusionv.model.User;
import com.fusionv.repository.CommentRepository;
import com.fusionv.repository.PostLikeRepository;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.PostSpecs;
import com.fusionv.repository.UserRepository;
import com.fusionv.util.ValidationUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Posts, achievements, likes and comments. */
@Service
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, PostLikeRepository likeRepository,
                       CommentRepository commentRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PostResponse createPost(Long userId, PostRequest request) {
        User author = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        PostType type = request.type() == null ? PostType.UPDATE : request.type();
        Post post = new Post(author, request.content().trim(), type, LocalDateTime.now());
        applyStructuredFields(post, request);
        post = postRepository.save(post);
        return toResponse(post, userId);
    }

    /** The feed: newest first, optionally only one author and/or one post type. */
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(Long userId, Long authorId, PostType type, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<PostResponse> result = new ArrayList<>();
        for (Post post : postRepository.findAll(PostSpecs.filter(authorId, type), pageable).getContent()) {
            result.add(toResponse(post, userId));
        }
        return result;
    }

    @Transactional
    public PostResponse editPost(Long userId, Long postId, PostRequest request) {
        Post post = loadPost(postId);
        if (!post.getAuthor().getId().equals(userId)) {
            throw new NotAllowedException("You can only edit your own posts");
        }
        post.setContent(request.content().trim());
        if (request.type() != null) {
            post.setType(request.type());
        }
        applyStructuredFields(post, request);
        post.setUpdatedAt(LocalDateTime.now());
        return toResponse(post, userId);
    }

    @Transactional
    public void deletePost(Long userId, boolean isAdmin, Long postId) {
        Post post = loadPost(postId);
        if (!isAdmin && !post.getAuthor().getId().equals(userId)) {
            throw new NotAllowedException("You can only delete your own posts");
        }
        likeRepository.deleteByPostId(postId);
        commentRepository.deleteByPostId(postId);
        postRepository.delete(post);
    }

    @Transactional
    public PostResponse likePost(Long userId, Long postId) {
        Post post = loadPost(postId);
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        if (likeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new DuplicateEntryException("You already liked this post");
        }
        likeRepository.save(new PostLike(post, user, LocalDateTime.now()));   // DB unique key is the 2nd safety net
        return toResponse(post, userId);
    }

    @Transactional
    public PostResponse unlikePost(Long userId, Long postId) {
        Post post = loadPost(postId);
        long removed = likeRepository.deleteByPostIdAndUserId(postId, userId);
        if (removed == 0) {
            throw new ResourceNotFoundException("You have not liked this post");
        }
        return toResponse(post, userId);
    }

    @Transactional
    public CommentResponse addComment(Long userId, Long postId, String content) {
        Post post = loadPost(postId);
        User author = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        Comment comment = commentRepository.save(new Comment(post, author, content.trim(), LocalDateTime.now()));
        return DtoMapper.toCommentResponse(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long postId) {
        loadPost(postId);
        List<CommentResponse> result = new ArrayList<>();
        for (Comment comment : commentRepository.findByPostIdOrderByCreatedAtAsc(postId)) {
            result.add(DtoMapper.toCommentResponse(comment));
        }
        return result;
    }

    @Transactional
    public void deleteComment(Long userId, boolean isAdmin, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));
        if (!isAdmin && !comment.getAuthor().getId().equals(userId)) {
            throw new NotAllowedException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }

    // ---------------------------------------------------------------- helpers

    private Post loadPost(Long postId) {
        return postRepository.findById(postId).orElseThrow(() -> new ResourceNotFoundException("Post", postId));
    }

    /** Applies the optional structured metadata; every field may be blank for an UPDATE. */
    private void applyStructuredFields(Post post, PostRequest request) {
        String title = cleanText(request.title());
        if (title != null && title.length() > 150) {
            throw new BadRequestException("Project or achievement title is too long (maximum 150 characters)");
        }
        post.setTitle(title);

        List<String> technologies = ValidationUtil.cleanNames(request.technologies());
        if (technologies.size() > 15) {
            throw new BadRequestException("A project can list at most 15 technologies");
        }
        for (String technology : technologies) {
            if (!ValidationUtil.isValidSkillName(technology)) {
                throw new BadRequestException("Invalid technology name '" + technology + "'");
            }
        }
        post.getTechnologies().clear();
        post.getTechnologies().addAll(technologies);

        post.setRepoUrl(validUrl(request.repoUrl(), "Repository URL"));
        post.setProjectUrl(validUrl(request.projectUrl(), "Live demo URL"));
        post.setAchievementUrl(validUrl(request.achievementUrl(), "Certificate or proof URL"));
        post.setOrganization(cleanText(request.organization()));
        post.setEventDate(request.eventDate());
    }

    private String validUrl(String value, String label) {
        String url = cleanText(value);
        if (url != null && !ValidationUtil.isValidUrl(url)) {
            throw new BadRequestException(label + " must start with http:// or https://");
        }
        return url;
    }

    private String cleanText(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private PostResponse toResponse(Post post, Long userId) {
        return new PostResponse(post.getId(), post.getAuthor().getId(), post.getAuthor().getFullName(),
                post.getContent(), post.getType().name(), post.getCreatedAt(), post.getUpdatedAt(),
                likeRepository.countByPostId(post.getId()), commentRepository.countByPostId(post.getId()),
                likeRepository.existsByPostIdAndUserId(post.getId(), userId),
                post.getTitle(), List.copyOf(post.getTechnologies()), post.getRepoUrl(), post.getProjectUrl(),
                post.getOrganization(), post.getAchievementUrl(), post.getEventDate());
    }
}
