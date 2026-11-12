import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  createPost,
  deleteComment,
  deletePost,
  likePost,
  listComments,
  listPosts,
  unlikePost,
  updatePost,
  addComment,
} from '@/services/posts';
import CommunityPage from './CommunityPage';

vi.mock('@/services/posts', () => ({
  listPosts: vi.fn(),
  listComments: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
}));

const USER = { id: 1, fullName: 'Aarav Shah' };
const POST = {
  id: 9,
  authorId: 2,
  authorName: 'Priya Nair',
  content: 'We built a campus navigation app.',
  type: 'PROJECT',
  title: 'CampusNav',
  technologies: ['Java', 'React'],
  repoUrl: 'https://github.com/example/campusnav',
  likeCount: 3,
  commentCount: 1,
  likedByMe: false,
  createdAt: '2026-11-10T09:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  listPosts.mockResolvedValue([POST]);
  listComments.mockResolvedValue([]);
  createPost.mockResolvedValue({ ...POST, id: 10 });
  updatePost.mockResolvedValue(POST);
  deletePost.mockResolvedValue(null);
  likePost.mockResolvedValue({ ...POST, likeCount: 4, likedByMe: true });
  unlikePost.mockResolvedValue(POST);
  addComment.mockResolvedValue({ id: 3 });
  deleteComment.mockResolvedValue(null);
});

describe('CommunityPage', () => {
  it('renders the feed with technologies and external project links', async () => {
    renderWithProviders(<CommunityPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(await screen.findByText('CampusNav')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Priya Nair' })).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Repository' })).toHaveAttribute(
      'href',
      'https://github.com/example/campusnav',
    );
  });

  it('likes a post through the API and updates the count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityPage />, { auth: { user: USER, isAuthenticated: true } });

    await screen.findByText('CampusNav');
    await user.click(screen.getByRole('button', { name: 'Like post' }));

    await waitFor(() => expect(likePost).toHaveBeenCalledWith(9));
    expect(await screen.findByRole('button', { name: 'Unlike post' })).toBeInTheDocument();
  });

  it('validates the composer and shows backend field errors', async () => {
    const user = userEvent.setup();
    createPost.mockRejectedValue({ message: 'Please correct the highlighted fields', fieldErrors: { content: 'content is required' } });
    renderWithProviders(<CommunityPage />, { auth: { user: USER, isAuthenticated: true } });

    await screen.findByText('CampusNav');
    await user.click(screen.getByRole('button', { name: 'Create post' }));
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByText('Write a description for the post.')).toBeInTheDocument();
    expect(createPost).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Description'), 'A valid update');
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByText('Please correct the highlighted fields')).toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    listPosts.mockResolvedValueOnce([]);
    renderWithProviders(<CommunityPage />, { auth: { user: USER, isAuthenticated: true } });
    expect(await screen.findByText('No posts yet')).toBeInTheDocument();

    listPosts.mockRejectedValueOnce(new Error('Feed unavailable'));
    renderWithProviders(<CommunityPage />, { auth: { user: USER, isAuthenticated: true } });
    expect(await screen.findByText('Feed unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload feed' })).toBeInTheDocument();
  });
});
