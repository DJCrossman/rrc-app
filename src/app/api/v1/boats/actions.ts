'use server';
import {
  boatsSchema,
} from '@/schemas';
import boats from './boats.json';

export const getBoats = async () => {
  return {
    data: boatsSchema.parse(boats),
  };
};
