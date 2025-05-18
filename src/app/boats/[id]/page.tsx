import { getActivities } from '@/app/api/v1/activities/actions';
import { getBoatById, updateBoat } from '@/app/api/v1/boats/actions';
import { BoatDetailsScene } from '@/scenes/boats';
import { Boat } from '@/schemas';
import { notFound } from 'next/navigation';

interface BoatDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoatDetailsPage({
  params,
}: BoatDetailsPageProps) {
  const { id } = await params;
  const boat = await getBoatById(Number(id));
  const { data: activities } = await getActivities({ boatId: Number(id) });

  const handleSubmit = async (boat: Boat) => {
    'use server';
    await updateBoat(boat);
  };

  if (!boat) {
    notFound();
  }

  return (
    <BoatDetailsScene
      boat={boat}
      activities={activities}
      onSubmit={handleSubmit}
    />
  );
}
