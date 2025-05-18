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
};
