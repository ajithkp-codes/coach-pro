import { listPhotos } from "@/lib/data/photos";
import { listSharedFiles } from "@/lib/data/sharedFiles";
import { listReports } from "@/lib/data/reports";
import { ShareArea } from "@/components/clients/share-area";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [photos, files, reports] = await Promise.all([
    listPhotos(id),
    listSharedFiles(id),
    listReports(id),
  ]);
  return <ShareArea clientId={id} photos={photos} files={files} reports={reports} />;
}
