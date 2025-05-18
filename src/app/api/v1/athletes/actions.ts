'use server';
import {
  Athlete,
  CreateAthlete,
  athleteSchema,
  athletesSchema,
} from '@/schemas/athlete.schema';
import athletes from './athletes.json';

const athletesParsed = athletesSchema.parse(athletes);

export const getAthletes = async () => {
  return {
    data: athletesParsed,
  };
};

export async function getAthleteById(id: number): Promise<Athlete | null> {
  const athlete = athletesParsed.find((athlete) => athlete.id === id);
  return athlete ?? null;
}

export const createAthlete = async (data: CreateAthlete): Promise<Athlete> => {
  const athlete = athleteSchema.parse({
    id: athletesParsed.length + 1,
    ...data,
  });
  athletesParsed.push(athlete);
  return athlete;
};

export const updateAthlete = async (data: Athlete): Promise<Athlete> => {
  const athleteIndex = athletesParsed.findIndex(
    (athlete) => athlete.id === data.id,
  );
  if (athleteIndex === -1) {
    throw new Error('Athlete not found');
  }
  const updatedAthlete = athleteSchema.parse({
    ...athletesParsed[athleteIndex],
    ...data,
  });
  athletesParsed[athleteIndex] = updatedAthlete;
  return updatedAthlete;
};
