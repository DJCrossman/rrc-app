import { createBoat } from '@/app/api/v1/boats/actions';
import { routes } from '@/lib/routes';
import { BoatCreateScene } from '@/scenes/boats';
import { Boat, CreateBoat } from '@/schemas';
import { RedirectType, redirect } from 'next/navigation';

export default function CreateBoatPage() {
  const handleSubmit = async (boat: CreateBoat) => {
    'use server';
    await createBoat(boat);
    redirect(routes.boats.list(), RedirectType.push);
  };

  return <BoatCreateScene onSubmit={handleSubmit} />;
}
