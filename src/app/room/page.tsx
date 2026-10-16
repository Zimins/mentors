import { getMentorById, MENTORS } from '@/data/mentors';
import { MentorStudioView } from '@/components/studio/MentorStudioView';

interface StandaloneRoomPageProps {
  searchParams: Promise<{
    mentor?: string;
  }>;
}

export default async function StandaloneRoomTestPage({
  searchParams,
}: StandaloneRoomPageProps) {
  const query = await searchParams;
  const initialMentor =
    (query.mentor ? getMentorById(query.mentor) : undefined) || MENTORS[0];

  return <MentorStudioView mentor={initialMentor} standaloneTestMode={true} />;
}
