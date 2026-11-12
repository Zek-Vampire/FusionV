/** Canonical application paths. Route strings live here only. */
export const paths = {
  home: '/',
  login: '/login',
  signup: '/signup',
  designSystem: '/design-system',

  hackathons: '/hackathons',
  hackathon: (id) => `/hackathons/${id}`,

  resources: '/resources',
  resource: (id) => `/resources/${id}`,
  myResources: '/resources/mine',

  search: '/search',

  dashboard: '/dashboard',
  teams: '/teams',
  team: (id) => `/teams/${id}`,
  community: '/community',
  students: '/students',
  student: (id) => `/students/${id}`,
  messages: '/messages',
  notifications: '/notifications',
  profile: '/profile',
  settings: '/settings',
};
