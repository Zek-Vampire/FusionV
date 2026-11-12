import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { getStudent } from '@/services/users';
import { listPosts } from '@/services/posts';
import StudentProfilePage from './StudentProfilePage';

vi.mock('@/services/users', () => ({ getStudent: vi.fn() }));
vi.mock('@/services/posts', () => ({ listPosts: vi.fn() }));

const STUDENT = {
  id: 7,
  fullName: 'Priya Nair',
  yearBranch: '3rd year · Computer Engineering',
  college: 'VJTI',
  about: 'Backend developer who likes databases.',
  location: 'Mumbai',
  linkUrl: 'https://example.com/priya',
  skills: ['Java', 'SQL'],
  interests: ['Open Source'],
  createdAt: '2026-01-15T10:00:00',
};

function renderProfile() {
  return renderWithProviders(
    <Routes>
      <Route path="/students/:studentId" element={<StudentProfilePage />} />
    </Routes>,
    { initialEntries: ['/students/7'], auth: { user: { id: 1 }, isAuthenticated: true } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getStudent.mockResolvedValue(STUDENT);
  listPosts.mockResolvedValue([
    {
      id: 3,
      authorId: 7,
      authorName: 'Priya Nair',
      content: 'Won the campus DBMS quiz.',
      type: 'ACHIEVEMENT',
      title: 'DBMS quiz winner',
      likeCount: 1,
      commentCount: 0,
      likedByMe: false,
      createdAt: '2026-11-01T10:00:00',
    },
  ]);
});

describe('StudentProfilePage', () => {
  it('renders public-safe profile information and the student posts', async () => {
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Priya Nair' })).toBeInTheDocument();
    expect(screen.getByText('Backend developer who likes databases.')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('Open Source')).toBeInTheDocument();
    expect(screen.getByText('DBMS quiz winner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /External profile/i })).toHaveAttribute(
      'href',
      'https://example.com/priya',
    );
    expect(screen.queryByText('priya@college.edu')).not.toBeInTheDocument();
  });

  it('shows a not-found state for an unknown student', async () => {
    const error = new Error('Student not found');
    error.status = 404;
    getStudent.mockRejectedValue(error);
    renderProfile();

    expect(await screen.findByText('Student not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to directory' })).toHaveAttribute(
      'href',
      '/students',
    );
  });
});
