import { AnnouncementForm } from './AnnouncementForm';
import { cookies } from 'next/headers';
import { validateJWT } from '@/lib/jwt';
import { redirect } from 'next/navigation';

export default async function CreateAnnouncementPage() {
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Create Announcement</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        <AnnouncementForm />
      </div>
    </div>
  );
}