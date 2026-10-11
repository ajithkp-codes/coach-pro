import { NextResponse } from "next/server";
import { getDownloadUrl } from "@/lib/data/share-public";

/** Public download: validate the token, bump the counter, redirect to a signed URL. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await getDownloadUrl(token);
  const { origin } = new URL(request.url);

  if ("url" in result) {
    return NextResponse.redirect(result.url);
  }
  return NextResponse.redirect(`${origin}/share/${token}`);
}
