import { MeetingRoom } from "@/components/meeting/MeetingRoom";

interface MeetingPageProps {
  params: Promise<{ meetingId: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { meetingId } = await params;
  return <MeetingRoom meetingId={meetingId} />;
}
