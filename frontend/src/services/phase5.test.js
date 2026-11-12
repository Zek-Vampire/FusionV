import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  uploadFile: vi.fn(),
  downloadAndSave: vi.fn(),
}));

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    delete: mocks.delete,
  },
  uploadFile: mocks.uploadFile,
  downloadAndSave: mocks.downloadAndSave,
}));

import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  likePost,
  listComments,
  listPosts,
  unlikePost,
  updatePost,
} from './posts';
import { getMessageHistory, sendMessage } from './messages';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications';
import {
  deleteResource,
  downloadResource,
  listMyResources,
  listResources,
  updateResource,
  uploadResource,
} from './resources';
import {
  cancelJoinRequest,
  createTeam,
  decideJoinRequest,
  getTeam,
  inviteToTeam,
  leaveTeam,
  listJoinRequests,
  listMyInvitations,
  listTeams,
  requestToJoin,
  respondToInvitation,
  updateTeam,
} from './teams';
import {
  changePassword,
  downloadProfileExport,
  downloadResume,
  getMyProfile,
  getMyStats,
  getStudent,
  replaceInterests,
  replaceSkills,
  searchStudents,
  updateMyProfile,
  uploadResume,
} from './users';
import { listSkills } from './skills';

describe('Phase 5 API services use the documented endpoints', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue([]);
    mocks.put.mockResolvedValue({});
    mocks.post.mockResolvedValue({});
    mocks.delete.mockResolvedValue(null);
    mocks.uploadFile.mockResolvedValue({});
    mocks.downloadAndSave.mockResolvedValue({ filename: 'file' });
  });

  it('users: profile, search, skills, password, export and resume', async () => {
    await getMyProfile();
    expect(mocks.get).toHaveBeenCalledWith('/users/me');

    await updateMyProfile({ fullName: 'Aarav Shah' });
    expect(mocks.put).toHaveBeenCalledWith('/users/me', { fullName: 'Aarav Shah' });

    await searchStudents({ q: 'aarav', skill: 'Java' });
    expect(mocks.get).toHaveBeenCalledWith('/users/search', {
      params: { q: 'aarav', skill: 'Java' },
    });

    await getStudent(7);
    expect(mocks.get).toHaveBeenCalledWith('/users/7');

    await replaceSkills(['Java', 'SQL']);
    expect(mocks.put).toHaveBeenCalledWith('/users/me/skills', { values: ['Java', 'SQL'] });

    await replaceInterests(['Hackathons']);
    expect(mocks.put).toHaveBeenCalledWith('/users/me/interests', {
      values: ['Hackathons'],
    });

    await getMyStats();
    expect(mocks.get).toHaveBeenCalledWith('/users/me/stats');

    await changePassword({ currentPassword: 'old-pass1', newPassword: 'new-pass1' });
    expect(mocks.post).toHaveBeenCalledWith('/users/me/password', {
      currentPassword: 'old-pass1',
      newPassword: 'new-pass1',
    });

    await downloadProfileExport();
    expect(mocks.downloadAndSave).toHaveBeenCalledWith('/users/me/export', 'fusionv-profile.txt');

    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    await uploadResume(file);
    const resumeForm = mocks.uploadFile.mock.calls[0][1];
    expect(mocks.uploadFile.mock.calls[0][0]).toBe('/users/me/resume');
    expect(resumeForm.get('file')).toBe(file);

    await downloadResume('resume.pdf');
    expect(mocks.downloadAndSave).toHaveBeenCalledWith('/users/me/resume', 'resume.pdf');

    await listSkills();
    expect(mocks.get).toHaveBeenCalledWith('/skills');
  });

  it('teams: repeated skill params, membership actions and invitations', async () => {
    await listTeams({
      q: 'code',
      skill: ['Java', 'SQL'],
      hackathonId: 2,
      minSize: 3,
      maxSize: 5,
      openOnly: true,
      sort: 'spots',
    });
    const params = mocks.get.mock.calls[0][1].params;
    expect(mocks.get.mock.calls[0][0]).toBe('/teams');
    expect(params.getAll('skill')).toEqual(['Java', 'SQL']);
    expect(params.get('q')).toBe('code');
    expect(params.get('hackathonId')).toBe('2');
    expect(params.get('minSize')).toBe('3');
    expect(params.get('maxSize')).toBe('5');
    expect(params.get('openOnly')).toBe('true');
    expect(params.get('sort')).toBe('spots');

    await listTeams({ mine: true });
    expect(mocks.get.mock.calls[1][1].params.get('mine')).toBe('true');

    await getTeam(4);
    expect(mocks.get).toHaveBeenCalledWith('/teams/4');

    await createTeam({ name: 'CodeCrafters', maxMembers: 4, skills: [] });
    expect(mocks.post).toHaveBeenCalledWith('/teams', {
      name: 'CodeCrafters',
      maxMembers: 4,
      skills: [],
    });

    await updateTeam(4, { name: 'New name' });
    expect(mocks.put).toHaveBeenCalledWith('/teams/4', { name: 'New name' });

    await requestToJoin(4);
    expect(mocks.post).toHaveBeenCalledWith('/teams/4/join-requests');
    await cancelJoinRequest(4);
    expect(mocks.delete).toHaveBeenCalledWith('/teams/4/join-requests/me');

    await listJoinRequests(4);
    expect(mocks.get).toHaveBeenCalledWith('/teams/4/join-requests');
    await decideJoinRequest(11, true);
    expect(mocks.post).toHaveBeenCalledWith('/teams/join-requests/11/accept');
    await decideJoinRequest(12, false);
    expect(mocks.post).toHaveBeenCalledWith('/teams/join-requests/12/reject');

    await inviteToTeam(4, 'student@college.edu');
    expect(mocks.post).toHaveBeenCalledWith('/teams/4/invitations', {
      email: 'student@college.edu',
    });
    await listMyInvitations();
    expect(mocks.get).toHaveBeenCalledWith('/invitations');
    await respondToInvitation(3, true);
    expect(mocks.post).toHaveBeenCalledWith('/invitations/3/accept');
    await respondToInvitation(3, false);
    expect(mocks.post).toHaveBeenCalledWith('/invitations/3/decline');

    await leaveTeam(4);
    expect(mocks.delete).toHaveBeenCalledWith('/teams/4/members/me');
  });

  it('community: feed, posts, likes and comments', async () => {
    await listPosts({ type: 'PROJECT', mine: true, page: 2, size: 10 });
    const params = mocks.get.mock.calls[0][1].params;
    expect(mocks.get.mock.calls[0][0]).toBe('/posts');
    expect(params.get('type')).toBe('PROJECT');
    expect(params.get('mine')).toBe('true');
    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('10');

    const payload = { content: 'Built a thing', type: 'PROJECT', technologies: ['Java'] };
    await createPost(payload);
    expect(mocks.post).toHaveBeenCalledWith('/posts', payload);
    await updatePost(9, payload);
    expect(mocks.put).toHaveBeenCalledWith('/posts/9', payload);
    await deletePost(9);
    expect(mocks.delete).toHaveBeenCalledWith('/posts/9');

    await likePost(9);
    expect(mocks.post).toHaveBeenCalledWith('/posts/9/like');
    await unlikePost(9);
    expect(mocks.delete).toHaveBeenCalledWith('/posts/9/like');

    await listComments(9);
    expect(mocks.get).toHaveBeenCalledWith('/posts/9/comments');
    await addComment(9, 'Nice work');
    expect(mocks.post).toHaveBeenCalledWith('/posts/9/comments', { content: 'Nice work' });
    await deleteComment(5);
    expect(mocks.delete).toHaveBeenCalledWith('/posts/comments/5');
  });

  it('messages: history and send use the team path', async () => {
    await getMessageHistory(4);
    expect(mocks.get).toHaveBeenCalledWith('/teams/4/messages');
    await sendMessage(4, 'Hello team');
    expect(mocks.post).toHaveBeenCalledWith('/teams/4/messages', { content: 'Hello team' });
  });

  it('notifications: list, unread count and read actions', async () => {
    await listNotifications();
    expect(mocks.get).toHaveBeenCalledWith('/notifications');
    await getUnreadCount();
    expect(mocks.get).toHaveBeenCalledWith('/notifications/unread-count');
    await markNotificationRead(8);
    expect(mocks.post).toHaveBeenCalledWith('/notifications/8/read');
    await markAllNotificationsRead();
    expect(mocks.post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('resources: uploads use multipart fields and owner actions use resource ids', async () => {
    await listResources({ q: 'sql', category: 'NOTES', subject: '', tag: null });
    expect(mocks.get).toHaveBeenCalledWith('/resources', {
      params: { q: 'sql', category: 'NOTES' },
    });

    await listMyResources();
    expect(mocks.get).toHaveBeenCalledWith('/resources/mine');

    const data = new FormData();
    data.append('title', 'Notes');
    data.append('file', new File(['x'], 'notes.pdf'));
    await uploadResource(data);
    expect(mocks.uploadFile).toHaveBeenCalledWith('/resources', data, { onProgress: undefined });

    await updateResource(5, { title: 'Updated' });
    expect(mocks.put).toHaveBeenCalledWith('/resources/5', { title: 'Updated' });
    await deleteResource(5);
    expect(mocks.delete).toHaveBeenCalledWith('/resources/5');

    await downloadResource({
      id: 5,
      title: 'Notes',
      originalFileName: 'notes.pdf',
    });
    expect(mocks.downloadAndSave).toHaveBeenCalledWith(
      '/resources/5/download',
      'notes.pdf',
    );
  });
});
