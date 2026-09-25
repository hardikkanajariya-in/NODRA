export type UploadedAsset = {
  id: string;
  url: string;
};

export async function uploadAssetFile(
  file: File,
  pageId: string,
): Promise<UploadedAsset | null> {
  const form = new FormData();
  form.append("file", file);
  form.append("pageId", pageId);

  const res = await fetch("/api/assets", { method: "POST", body: form });
  if (!res.ok) return null;
  return (await res.json()) as UploadedAsset;
}
