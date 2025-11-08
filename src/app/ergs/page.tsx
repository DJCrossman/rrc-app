import { ErgListScene } from '@/scenes/ergs';
import { getErgs } from '../api/v1/ergs/actions';

export default async function ErgsPage() {
  const { data } = await getErgs();
  return <ErgListScene data={data} />;
}