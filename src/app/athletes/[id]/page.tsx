import { getActivities } from '@/app/api/v1/activities/actions';
import { getAthleteById, updateAthlete } from '@/app/api/v1/athletes/actions';
import { AthleteDetailsScene } from '@/scenes/athletes';
import { Athlete } from '@/schemas/athlete.schema';
import { notFound } from 'next/navigation';

interface AthleteDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AthleteDetailsPage({
  params,
}: AthleteDetailsPageProps) {
  const { id } = await params;
  const athlete = await getAthleteById(Number(id));
  const { data: activities } = await getActivities({ athleteId: Number(id) });

  const handleSubmit = async (athlete: Athlete) => {
    'use server';
    await updateAthlete(athlete);
  };

  if (!athlete) {
    notFound();
  }

  return (
    <AthleteDetailsScene
      athlete={athlete}
      activities={activities}
      onSubmit={handleSubmit}
    />
  );
}
