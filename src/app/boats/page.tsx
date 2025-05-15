import { BoatListScene } from '@/scenes/boats';
import { Suspense, use } from 'react';
import { getBoats } from '../api/v1/boats/actions';

export default function BoatsPage() {
  const { data } = use(getBoats());
  return (
    <Suspense>
      <BoatListScene data={data} />
    </Suspense>
  );
}
