export async function uploadReceipt(file: Blob): Promise<string> {
  const res = await fetch('/api/upload-receipt', {
    method: 'POST',
    body: file,
    headers: { 'Content-Type': 'image/jpeg' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Upload thất bại.' })) as { error?: string };
    throw new Error(body.error ?? 'Upload thất bại.');
  }

  const { path } = await res.json() as { path: string };
  return path;
}
