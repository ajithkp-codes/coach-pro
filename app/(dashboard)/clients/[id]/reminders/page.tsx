import { listClientReminders } from "@/lib/data/reminders";
import { RemindersPanel } from "@/components/reminders/reminders-panel";

export default async function ClientRemindersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reminders = await listClientReminders(id);
  return <RemindersPanel clientId={id} reminders={reminders} />;
}
