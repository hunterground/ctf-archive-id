import DraftsClient from './DraftsClient';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { validateJWT } from '@/lib/jwt';
import { redirect } from 'next/navigation';

export default async function DraftsPage() {
  const cookie = await cookies();
    const token = cookie.get('token')?.value;
    const verifyResult = validateJWT(token);
    if (!verifyResult.isValid) {
      redirect('/login')
    }
    if (verifyResult.role != 'admin') {
      redirect('/announcements')
    }
  return (
    <Suspense fallback={<div>Loading drafts...</div>}>
      <DraftsClient />
    </Suspense>
  )
}