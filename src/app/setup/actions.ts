'use server';

import { updateConfig } from '@/lib/config';
import { revalidatePath } from 'next/cache';

export async function completeSetup() {
  await updateConfig({ setupconfig: true });
  revalidatePath('/', 'layout');
}

export async function resetSetup() {
  await updateConfig({ setupconfig: false });
  revalidatePath('/', 'layout');
}
