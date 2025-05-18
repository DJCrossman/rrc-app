import { Athlete } from '@/schemas';

export const formatProgram = (program: Athlete['program']) => {
  return program.charAt(0).toUpperCase() + program.slice(1);
};
