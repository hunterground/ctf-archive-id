import NotesClient from './NotesClient';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { validateJWT } from '@/lib/jwt';
import { redirect } from 'next/navigation';

export default async function AnnouncementsPage() {
  const cookie = await cookies();
  const token = cookie.get('token')?.value;
  const verifyResult = validateJWT(token);
  if (!verifyResult.isValid) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<div>Loading drafts...</div>}>
      <NotesClient />
    </Suspense>
  )
}