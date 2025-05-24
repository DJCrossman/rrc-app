'use server';
import { activitiesDBSchema, activitySchema, boatsSchema } from '@/schemas';
import { usersSchema } from '@/schemas';
import {
  athleteDBSchema,
  athleteSchema,
  athletesSchema,
} from '@/schemas/athlete.schema';
import athletes from '../athletes/athletes.json';
import boats from '../boats/boats.json';
import users from '../users/users.json';
import activities from './activities.json';

const usersParsed = usersSchema.parse(users);
const activitiesParsed = activitiesDBSchema.parse(activities);
const athletesParsed = athletesSchema.parse(
  athletes.map((athlete) => {
    const athleteEntity = athleteDBSchema.parse(athlete);
    const user = usersParsed.find((user) => user.id === athleteEntity.userId);
    return athleteSchema.parse({
      ...user,
      ...athlete,
      userId: athleteEntity.userId,
      name: user?.nickName || user?.firstName,
    });
  }),
);
const boatsParsed = boatsSchema.parse(boats);

export const getActivities = async ({
  boatId,
  athleteId,
}: { boatId?: number; athleteId?: number }) => {
  const activities = activitiesParsed.map((activity) => {
    const boat =
      boatsParsed.find((boat) => boat.id === activity.boatId) ?? null;
    return activitySchema.parse({
      id: activity.id,
      athlete:
        athletesParsed.find((athlete) => athlete.id === activity.athleteId) ??
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
      if (athleteId) {
        return activity.athlete?.id === athleteId;
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
