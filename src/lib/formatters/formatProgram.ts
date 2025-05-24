import { Athlete } from '@/schemas';

export const formatProgram = (program: Athlete['programType']) => {
  if (!program) return '';
  return program.charAt(0).toUpperCase() + program.slice(1);
};
