'use server';
import { Boat, CreateBoat, boatSchema, boatsSchema } from '@/schemas';
import boats from './boats.json';

const boatsParsed = boatsSchema.parse(boats);

export const getBoats = async () => {
  return {
    data: boatsParsed,
  };
};

export async function getBoatById(id: number): Promise<Boat | null> {
  const boat = boatsParsed.find((boat) => boat.id === id);
  return boat ?? null;
}

export const createBoat = async (data: CreateBoat): Promise<Boat> => {
  const boat = boatSchema.parse({
    id: boatsParsed.length + 1,
    ...data,
    meters: 0,
  });
  boatsParsed.push(boat);
  return boat;
};

export const updateBoat = async (data: Boat): Promise<Boat> => {
  const boatIndex = boatsParsed.findIndex((boat) => boat.id === data.id);
  if (boatIndex === -1) {
    throw new Error('Boat not found');
  }
  const updatedBoat = boatSchema.parse({
    ...boatsParsed[boatIndex],
    ...data,
  });
  boatsParsed[boatIndex] = updatedBoat;
  return updatedBoat;
};
