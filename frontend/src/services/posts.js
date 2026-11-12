import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

function buildFeedParams(params = {}) {
  const search = new URLSearchParams();
  if (params.authorId) search.set('authorId', String(params.authorId));
  if (params.type) search.set('type', params.type);
  if (params.mine) search.set('mine', 'true');
  if (params.page !== undefined && params.page !== null) search.set('page', String(params.page));
  if (params.size) search.set('size', String(params.size));
  return search;
}

/** GET /posts */
export function listPosts(params = {}) {
  return apiClient.get(endpoints.posts.list, { params: buildFeedParams(params) });
}

/** POST /posts */
export function createPost(post) {
  return apiClient.post(endpoints.posts.create, post);
}

/** PUT /posts/{id} — author only. */
export function updatePost(id, post) {
  return apiClient.put(endpoints.posts.byId(id), post);
}

/** DELETE /posts/{id} — author or admin. */
export function deletePost(id) {
  return apiClient.delete(endpoints.posts.byId(id));
}

/** POST /posts/{id}/like */
export function likePost(id) {
  return apiClient.post(endpoints.posts.like(id));
}

/** DELETE /posts/{id}/like */
export function unlikePost(id) {
  return apiClient.delete(endpoints.posts.like(id));
}

/** GET /posts/{id}/comments */
export function listComments(postId) {
  return apiClient.get(endpoints.posts.comments(postId));
}

/** POST /posts/{id}/comments */
export function addComment(postId, content) {
  return apiClient.post(endpoints.posts.comments(postId), { content });
}

/** DELETE /posts/comments/{commentId} */
export function deleteComment(commentId) {
  return apiClient.delete(endpoints.posts.deleteComment(commentId));
}
