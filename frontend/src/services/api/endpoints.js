/**
 * Path builders for the existing /api/v1 contract.
 * No request logic lives here, so paths can be reused by queries, mutations,
 * downloads and tests without duplicating strings.
 */

const encode = (value) => encodeURIComponent(String(value));

export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
  },
  users: {
    me: '/users/me',
    password: '/users/me/password',
    skills: '/users/me/skills',
    interests: '/users/me/interests',
    stats: '/users/me/stats',
    export: '/users/me/export',
    resume: '/users/me/resume',
    search: '/users/search',
    byId: (id) => `/users/${encode(id)}`,
  },
  hackathons: {
    list: '/hackathons',
    create: '/hackathons',
    byId: (id) => `/hackathons/${encode(id)}`,
    importJson: '/hackathons/import',
    importCsv: '/hackathons/import/csv',
    sync: '/hackathons/sync',
  },
  teams: {
    list: '/teams',
    create: '/teams',
    byId: (id) => `/teams/${encode(id)}`,
    joinRequests: (id) => `/teams/${encode(id)}/join-requests`,
    myJoinRequest: (id) => `/teams/${encode(id)}/join-requests/me`,
    acceptRequest: (requestId) => `/teams/join-requests/${encode(requestId)}/accept`,
    rejectRequest: (requestId) => `/teams/join-requests/${encode(requestId)}/reject`,
    invitations: (id) => `/teams/${encode(id)}/invitations`,
    myInvitations: '/invitations',
    acceptInvitation: (id) => `/invitations/${encode(id)}/accept`,
    declineInvitation: (id) => `/invitations/${encode(id)}/decline`,
    leave: (id) => `/teams/${encode(id)}/members/me`,
  },
  resources: {
    list: '/resources',
    upload: '/resources',
    mine: '/resources/mine',
    byId: (id) => `/resources/${encode(id)}`,
    download: (id) => `/resources/${encode(id)}/download`,
  },
  posts: {
    list: '/posts',
    create: '/posts',
    byId: (id) => `/posts/${encode(id)}`,
    like: (id) => `/posts/${encode(id)}/like`,
    comments: (id) => `/posts/${encode(id)}/comments`,
    deleteComment: (commentId) => `/posts/comments/${encode(commentId)}`,
  },
  messages: {
    list: (teamId) => `/teams/${encode(teamId)}/messages`,
    send: (teamId) => `/teams/${encode(teamId)}/messages`,
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    read: (id) => `/notifications/${encode(id)}/read`,
    readAll: '/notifications/read-all',
  },
  public: {
    stats: '/public/stats',
  },
  skills: '/skills',
  admin: {
    stats: '/admin/stats',
  },
};
