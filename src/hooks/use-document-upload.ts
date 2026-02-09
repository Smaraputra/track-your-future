'use client';

import { useCallback, useRef, useState } from 'react';

export type UploadStatus =
  | 'idle'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'success'
  | 'error';

interface UploadState {
  status: UploadStatus;
  progress: number;
  error: string | null;
}

interface UploadParams {
  file: File;
  documentType: string;
  customTypeName?: string;
  roleCategoryId?: string;
  previousDocumentId?: string;
}

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    error: null,
  });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(
    async (params: UploadParams): Promise<boolean> => {
      const { file, documentType, customTypeName, roleCategoryId, previousDocumentId } = params;

      setState({ status: 'presigning', progress: 0, error: null });

      try {
        // Step 1: Get presigned URL
        const presignRes = await fetch('/api/documents/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
            documentType,
            customTypeName,
            roleCategoryId,
            previousDocumentId,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          setState({ status: 'error', progress: 0, error: err.error ?? 'Failed to get upload URL' });
          return false;
        }

        const presignData = await presignRes.json();

        // Step 2: Upload file via XHR (for progress tracking)
        setState({ status: 'uploading', progress: 0, error: null });

        const uploadSuccess = await new Promise<boolean>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setState((prev) => ({ ...prev, progress: pct }));
            }
          };

          xhr.onload = () => {
            xhrRef.current = null;
            resolve(xhr.status >= 200 && xhr.status < 300);
          };

          xhr.onerror = () => {
            xhrRef.current = null;
            resolve(false);
          };

          xhr.onabort = () => {
            xhrRef.current = null;
            resolve(false);
          };

          xhr.open('PUT', presignData.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        if (!uploadSuccess) {
          setState({ status: 'error', progress: 0, error: 'Upload failed or was cancelled' });
          return false;
        }

        // Step 3: Confirm upload
        setState({ status: 'confirming', progress: 100, error: null });

        const confirmRes = await fetch('/api/documents/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: presignData.documentId,
            fileKey: presignData.fileKey,
            fileName: presignData.fileName,
            mimeType: presignData.mimeType,
            fileSizeBytes: presignData.fileSizeBytes,
            documentType: presignData.documentType,
            customTypeName: presignData.customTypeName,
            roleCategoryId: presignData.roleCategoryId,
            version: presignData.version,
            previousDocumentId: presignData.previousDocumentId,
          }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          setState({ status: 'error', progress: 0, error: err.error ?? 'Failed to confirm upload' });
          return false;
        }

        setState({ status: 'success', progress: 100, error: null });
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload failed';
        setState({ status: 'error', progress: 0, error: message });
        return false;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setState({ status: 'idle', progress: 0, error: null });
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, error: null });
  }, []);

  return {
    ...state,
    upload,
    cancel,
    reset,
  };
}
