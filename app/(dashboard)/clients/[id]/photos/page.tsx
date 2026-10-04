import { listPhotos } from "@/lib/data/photos";
import { PhotosPanel } from "@/components/photos/photos-panel";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photos = await listPhotos(id);
  return <PhotosPanel clientId={id} photos={photos} />;
}
