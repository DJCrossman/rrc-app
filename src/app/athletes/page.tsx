import { AthleteListScene } from '@/scenes/athletes';
import { getAthletes } from '../api/v1/athletes/actions';

export default async function AthletesPage() {
  const { data } = await getAthletes();
  return <AthleteListScene data={data} />;
}
