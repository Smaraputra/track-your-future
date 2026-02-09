interface FileKeyParams {
  userId: string;
  roleCategoryId?: string;
  documentType: string;
  documentId: string;
  version: number;
  fileName: string;
}

export function buildFileKey({
  userId,
  roleCategoryId,
  documentType,
  documentId,
  version,
  fileName,
}: FileKeyParams): string {
  const roleSegment = roleCategoryId ?? 'unassigned';
  return `${userId}/${roleSegment}/${documentType}/${documentId}/v${version}/${fileName}`;
}
