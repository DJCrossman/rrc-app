import { getErgById, updateErg } from '@/app/api/v1/ergs/actions';
import { ErgDetailsScene } from '@/scenes/ergs';
import { Erg } from '@/schemas';
import { notFound } from 'next/navigation';

interface ErgDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ErgDetailsPage({
  params,
}: ErgDetailsPageProps) {
  const { id } = await params;
  const erg = await getErgById(Number(id));
  // For now, we'll pass an empty activities array since ergId filter may not be implemented
  const activities: any[] = [];

  const handleSubmit = async (erg: Erg) => {
    'use server';
    await updateErg(erg);
  };

  if (!erg) {
    notFound();
  }

  return (
    <ErgDetailsScene
      erg={erg}
      activities={activities}
      onSubmit={handleSubmit}
    />
  );
}