import NoteEditor from './NoteEditor';
import { cookies } from 'next/headers';
import { validateJWT } from '@/lib/jwt';
import { redirect } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function NotePage({ params }: PageProps) {
  const cookie = await cookies();
  const token = cookie.get('token')?.value;
  const verifyResult = validateJWT(token);
  if (!verifyResult.isValid) {
    redirect('/login')
  }

  const resolvedParams = await params;
  return <NoteEditor id={resolvedParams.id} />;
}
