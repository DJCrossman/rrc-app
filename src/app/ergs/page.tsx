import { getActivities } from '@/app/api/v1/activities/actions';
import { createErg, getErgById, getErgs, updateErg } from '@/app/api/v1/ergs/actions';
import { routes } from '@/lib/routes';
import { ErgListScene } from '@/scenes/ergs';
import { CreateErg, Erg } from '@/schemas';
import { RedirectType, redirect } from 'next/navigation';
import { z } from 'zod';

const querySchema = z.object({
  ergId: z.coerce.number().optional(),
  action: z.literal('create').optional(),
});

export default async function ErgsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { ergId, action } = querySchema.parse(await searchParams);

  const { data } = await getErgs();
  const { data: activities } = ergId
    ? await getActivities({ ergId })
    : { data: [] };
  const selectedErg = ergId ? await getErgById(ergId) : null;

  return (
    <ErgListScene
      data={data}
      selectedErg={selectedErg}
      activities={activities}
      isCreateDrawerOpen={action === 'create'}
      onCreateErg={async (erg: CreateErg) => {
        'use server';
        await createErg(erg);
        redirect(routes.ergs.list(), RedirectType.push);
      }}
      onUpdateErg={async (erg: Erg) => {
        'use server';
        await updateErg(erg);
      }}
    />
  );
}
