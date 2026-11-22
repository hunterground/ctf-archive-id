import DraftEditor from './DraftEditor';
import { cookies } from 'next/headers';
import { validateJWT } from '@/lib/jwt';
import { redirect } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function DraftPage({ params }: PageProps) {
  const cookie = await cookies();
  const token = cookie.get('token')?.value;
  const verifyResult = validateJWT(token);
  if (!verifyResult.isValid) {
    redirect('/login')
  }
  if (verifyResult.role != 'admin') {
    redirect('/announcements')
  }
  
  const resolvedParams = await params;
  return <DraftEditor id={resolvedParams.id} />;
}
