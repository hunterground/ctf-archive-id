import AnnouncementClient from './AnnouncementClient';

interface PageProps {
  params: { id: string };
}

export default async function AnnouncementPage({ params }: PageProps) {
   const resolvedParams = await params;
  return <AnnouncementClient id={resolvedParams.id} />;
}
