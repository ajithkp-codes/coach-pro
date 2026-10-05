import { listSharedFiles } from "@/lib/data/sharedFiles";
import { FilesPanel } from "@/components/files/files-panel";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const files = await listSharedFiles(id);
  return <FilesPanel clientId={id} files={files} />;
}
