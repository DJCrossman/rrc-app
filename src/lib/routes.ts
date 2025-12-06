export const routes = {
  dashboard: {
    home: () => '/',
  },
  boats: {
    list: () => '/boats',
    create: () => '/boats/create',
    view: (id: number) => `/boats/${id}`,
  },
  athletes: {
    list: () => '/athletes',
    create: () => '/athletes?action=create',
    view: (id: number) => `/athletes?athleteId=${id}`,
  },
  ergs: {
    list: () => '/ergs',
    create: () => '/ergs/create',
    view: (id: number) => `/ergs/${id}`,
  },
  workouts: {
    list: () => '/workouts',
    create: () => '/workouts/create',
    view: (id: number) => `/workouts/${id}`,
  },
};
