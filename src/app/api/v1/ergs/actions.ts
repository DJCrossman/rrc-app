'use server';
import { Erg, CreateErg, ergSchema, ergsSchema } from '@/schemas';
import ergs from './ergs.json';

const ergsParsed = ergsSchema.parse(ergs);

export const getErgs = async () => {
  return {
    data: ergsParsed,
  };
};

export async function getErgById(id: number): Promise<Erg | null> {
  const erg = ergsParsed.find((erg) => erg.id === id);
  return erg ?? null;
}

export const createErg = async (data: CreateErg): Promise<Erg> => {
  const erg = ergSchema.parse({
    id: ergsParsed.length + 1,
    ...data,
    meters: 0,
  });
  ergsParsed.push(erg);
  return erg;
};

export const updateErg = async (data: Erg): Promise<Erg> => {
  const ergIndex = ergsParsed.findIndex((erg) => erg.id === data.id);
  if (ergIndex === -1) {
    throw new Error('Erg not found');
  }
  const updatedErg = ergSchema.parse({
    ...ergsParsed[ergIndex],
    ...data,
  });
  ergsParsed[ergIndex] = updatedErg;
  return updatedErg;
};

export const deleteErg = async (id: number): Promise<boolean> => {
  const ergIndex = ergsParsed.findIndex((erg) => erg.id === id);
  if (ergIndex === -1) {
    throw new Error('Erg not found');
  }
  ergsParsed.splice(ergIndex, 1);
  return true;
};