'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { RetroDialog } from '@/components/retro-dialog';
import { RetroButton } from '@/components/retro-button';
import { UploadProgressBar } from '@/components/documents/upload-progress-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDocumentUpload } from '@/hooks/use-document-upload';
import { DOCUMENT_TYPES, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/documents/schemas';

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (documentId?: string) => void;
  roles: Role[];
  defaultRoleId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  cover_letter: 'Cover Letter',
  summary: 'Summary',
  custom: 'Custom',
};

export function UploadDialog({
  open,
  onOpenChange,
  onUploaded,
  roles,
  defaultRoleId,
}: UploadDialogProps) {
  const [documentType, setDocumentType] = useState<string>('cv');
  const [customTypeName, setCustomTypeName] = useState('');
  const [roleCategoryId, setRoleCategoryId] = useState<string>(defaultRoleId ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, progress, error, upload, cancel, reset } = useDocumentUpload();

  const isUploading = status === 'presigning' || status === 'uploading' || status === 'confirming';

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(selected.type as typeof ALLOWED_MIME_TYPES[number])) {
      setFileError('Only PDF and DOCX files are allowed');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size must not exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`);
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) return;

    const docId = await upload({
      file,
      documentType,
      customTypeName: documentType === 'custom' ? customTypeName : undefined,
      roleCategoryId: roleCategoryId || undefined,
    });

    if (docId) {
      onUploaded(docId);
      handleClose();
    }
  }

  function handleClose() {
    if (isUploading) return;
    setFile(null);
    setFileError(null);
    setDocumentType('cv');
    setCustomTypeName('');
    setRoleCategoryId(defaultRoleId ?? '');
    reset();
    onOpenChange(false);
  }

  return (
    <RetroDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) handleClose();
      }}
      title="Upload Document"
      description="Upload a PDF or DOCX file (max 10 MB)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="font-body text-sm font-medium">Document Type</label>
          <Select
            value={documentType}
            onValueChange={setDocumentType}
            disabled={isUploading}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {documentType === 'custom' && (
          <div className="space-y-2">
            <label className="font-body text-sm font-medium">Custom Type Name</label>
            <Input
              value={customTypeName}
              onChange={(e) => setCustomTypeName(e.target.value)}
              placeholder="e.g., Portfolio, Reference Letter"
              disabled={isUploading}
              maxLength={100}
            />
          </div>
        )}

        {!defaultRoleId && (
          <div className="space-y-2">
            <label className="font-body text-sm font-medium">
              Role Category{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Select
              value={roleCategoryId}
              onValueChange={setRoleCategoryId}
              disabled={isUploading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No role assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No role assigned</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="font-body text-sm font-medium">File</label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer"
          />
          {fileError && (
            <p className="font-body text-destructive text-xs">{fileError}</p>
          )}
          {file && (
            <p className="font-body text-muted-foreground text-xs">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <UploadProgressBar progress={progress} status={status} />

        {error && (
          <p className="font-body text-destructive text-sm">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          {isUploading ? (
            <RetroButton
              type="button"
              variant="destructive"
              size="sm"
              onClick={cancel}
            >
              Cancel Upload
            </RetroButton>
          ) : (
            <>
              <RetroButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </RetroButton>
              <RetroButton
                type="submit"
                size="sm"
                disabled={!file || (documentType === 'custom' && !customTypeName.trim())}
              >
                <Upload className="size-4" />
                Upload
              </RetroButton>
            </>
          )}
        </div>
      </form>
    </RetroDialog>
  );
}
