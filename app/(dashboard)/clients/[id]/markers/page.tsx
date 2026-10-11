import { listHealthMarkers } from "@/lib/data/healthMarkers";
import { MarkersPanel } from "@/components/markers/markers-panel";

export default async function MarkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const markers = await listHealthMarkers(id);
  return <MarkersPanel clientId={id} markers={markers} />;
}
