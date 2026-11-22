import AnnouncementsClient from './AnnouncementsClient';
import { Suspense } from 'react';

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<div>Loading drafts...</div>}>
      <AnnouncementsClient />
    </Suspense>
  )
}