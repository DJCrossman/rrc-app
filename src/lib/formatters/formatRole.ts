import { Athlete } from '@/schemas';

export const formatRole = (role: Athlete['roles'][number]) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
