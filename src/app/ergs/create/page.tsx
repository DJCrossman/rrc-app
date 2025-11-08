import { createErg } from '@/app/api/v1/ergs/actions';
import { routes } from '@/lib/routes';
import { ErgCreateScene } from '@/scenes/ergs';
import { CreateErg } from '@/schemas';
import { RedirectType, redirect } from 'next/navigation';

export default function CreateErgPage() {
  const handleSubmit = async (erg: CreateErg) => {
    'use server';
    await createErg(erg);
    redirect(routes.ergs.list(), RedirectType.push);
  };

  return <ErgCreateScene onSubmit={handleSubmit} />;
}