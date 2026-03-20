export function buildCsvFilename(prefix: string, from?: string, to?: string): string {
  const sanitize = (value?: string) => (value ? value.replaceAll("-", "") : "all");
  return `${prefix}_${sanitize(from)}_${sanitize(to)}.csv`;
}

export function downloadBlobFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

