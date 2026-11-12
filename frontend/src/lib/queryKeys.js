/** Central query keys so refetches and invalidations stay predictable. */
export const queryKeys = {
  public: {
    stats: ['public', 'stats'],
  },
  hackathons: {
    all: ['hackathons'],
    list: (params) => ['hackathons', 'list', params ?? {}],
    detail: (id) => ['hackathons', 'detail', String(id)],
  },
  resources: {
    all: ['resources'],
    list: (params) => ['resources', 'list', params ?? {}],
    mine: ['resources', 'mine'],
    detail: (id) => ['resources', 'detail', String(id)],
  },
  users: {
    me: ['users', 'me'],
    stats: ['users', 'me', 'stats'],
    detail: (id) => ['users', 'detail', String(id)],
    search: (params) => ['users', 'search', params ?? {}],
  },
  teams: {
    all: ['teams'],
    list: (params) => ['teams', 'list', params ?? {}],
    mine: ['teams', 'list', { mine: true }],
    detail: (id) => ['teams', 'detail', String(id)],
    requests: (id) => ['teams', 'requests', String(id)],
    invitations: ['teams', 'invitations'],
  },
  posts: {
    all: ['posts'],
    feed: (params) => ['posts', 'feed', params ?? {}],
    mine: ['posts', 'mine'],
    detail: (id) => ['posts', 'detail', String(id)],
    comments: (id) => ['posts', 'comments', String(id)],
  },
  notifications: {
    all: ['notifications'],
    list: ['notifications', 'list'],
    unread: ['notifications', 'unread'],
  },
  messages: {
    all: ['messages'],
    history: (teamId) => ['messages', 'history', String(teamId)],
  },
  skills: {
    all: ['skills'],
  },
  search: {
    teams: (q) => ['teams', 'search', q],
    students: (q) => ['users', 'search', q],
  },
};
