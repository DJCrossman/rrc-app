'use server';
import { Boat, CreateBoat, boatSchema, boatsSchema } from '@/schemas';
import boats from './boats.json';

const boatsParsed = boatsSchema.parse(boats);

export const getBoats = async () => {
  return {
    data: boatsParsed,
  };
};

export const createBoat = async (data: CreateBoat): Promise<Boat> => {
  const boat = boatSchema.parse({
    id: boatsParsed.length + 1,
    ...data,
    meters: 0,
  });
  boatsParsed.push(boat);
  return boat;
};
