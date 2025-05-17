'use server';
import { activitiesDBSchema, activitySchema, boatsSchema } from '@/schemas';
import { athletesSchema } from '@/schemas/athlete.schema';
import athletes from '../athletes/athletes.json';
import boats from '../boats/boats.json';
import activities from './activities.json';

const activitiesParsed = activitiesDBSchema.parse(activities);
const atheletesParsed = athletesSchema.parse(athletes);
const boatsParsed = boatsSchema.parse(boats);

export const getActivities = async ({ boatId }: { boatId?: number }) => {
  const activities = activitiesParsed.map((activity) => {
    const boat =
      boatsParsed.find((boat) => boat.id === activity.boatId) ?? null;
    return activitySchema.parse({
      id: activity.id,
      athlete:
        atheletesParsed.find((athlete) => athlete.id === activity.athleteId) ??
        null,
      boat,
      workout: null,
      isStrava: activity.stravaId !== null,
      name: activity.name,
      type: !!boat ? 'water' : 'erg',
      startDate: activity.startDate,
      timezone: activity.timezone,
      elaspedTime: activity.elaspedTime,
      distance: activity.distance,
    });
  });

  const filteredActivities = activities
    .filter((activity) => {
      if (boatId) {
        return activity.boat?.id === boatId;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  return {
    data: filteredActivities,
  };
};
