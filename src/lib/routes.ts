export const routes = {
  dashboard: {
    home: () => '/',
  },
  boats: {
    list: () => '/boats',
    create: () => '/boats/create',
    view: (id: string) => `/boats/${id}`,
  },
  athletes: {
    list: () => '/athletes',
    create: () => '/athletes/create',
    view: (id: string) => `/athletes/${id}`,
  },
  ergs: {
    list: () => '/ergs',
    create: () => '/ergs/create',
    view: (id: string) => `/ergs/${id}`,
  },
  workouts: {
    list: () => '/workouts',
    create: () => '/workouts/create',
    view: (id: string) => `/workouts/${id}`,
  },
};
