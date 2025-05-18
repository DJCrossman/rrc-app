import { BoatListScene } from '@/scenes/boats';
import { getBoats } from '../api/v1/boats/actions';

export default async function BoatsPage() {
  const { data } = await getBoats();
  return <BoatListScene data={data} />;
}
