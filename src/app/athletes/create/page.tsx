import { createAthlete } from '@/app/api/v1/athletes/actions';
import { routes } from '@/lib/routes';
import { AthleteCreateScene } from '@/scenes/athletes';
import { CreateAthlete } from '@/schemas/athlete.schema';
import { RedirectType, redirect } from 'next/navigation';

export default function CreateAthletePage() {
  const handleSubmit = async (athlete: CreateAthlete) => {
    'use server';
    await createAthlete(athlete);
    redirect(routes.athletes.list(), RedirectType.push);
  };

  return <AthleteCreateScene onSubmit={handleSubmit} />;
}
