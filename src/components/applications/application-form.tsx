'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  createApplicationSchema,
  type CreateApplicationInput,
  APPLICATION_STATUSES,
  STATUS_CONFIG,
} from '@/lib/applications';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { RetroSelect } from '@/components/retro-select';
import { RetroDateTimePicker } from '@/components/retro-date-time-picker';
import { AuthMessage } from '@/components/auth/auth-message';

interface Role {
  id: string;
  name: string;
}

interface ApplicationFormProps {
  mode: 'create' | 'edit';
  applicationId?: string;
  roles: Role[];
  defaultValues?: Partial<CreateApplicationInput>;
}

export function ApplicationForm({
  mode,
  applicationId,
  roles,
  defaultValues,
}: ApplicationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: {
      companyName: defaultValues?.companyName ?? '',
      jobTitle: defaultValues?.jobTitle ?? '',
      jobUrl: defaultValues?.jobUrl ?? '',
      roleCategoryId: defaultValues?.roleCategoryId ?? '',
      notes: defaultValues?.notes ?? '',
      currentStatus: defaultValues?.currentStatus ?? 'draft',
      appliedAt: defaultValues?.appliedAt ?? '',
    },
  });

  const statusOptions = APPLICATION_STATUSES.map((s) => ({
    value: s,
    label: STATUS_CONFIG[s].label,
  }));

  const roleOptions = [
    { value: '__none__', label: 'None' },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  async function onSubmit(data: CreateApplicationInput) {
    setServerError(null);

    const url =
      mode === 'create'
        ? '/api/applications'
        : `/api/applications/${applicationId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push('/applications');
      router.refresh();
      return;
    }

    const body = await res.json().catch(() => null);

    if (res.status === 403) {
      setServerError(
        body?.error ??
          'Application limit reached. Upgrade to Pro for unlimited applications.',
      );
    } else {
      setServerError(body?.error ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">
          {mode === 'create' ? 'New Application' : 'Edit Application'}
        </h1>
        <p className="font-body text-muted-foreground text-sm">
          {mode === 'create'
            ? 'Track a new job application'
            : 'Update application details'}
        </p>
      </div>

      {serverError && <AuthMessage variant="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Company Name" error={errors.companyName?.message}>
          <RetroInput
            type="text"
            placeholder="e.g. Acme Corp"
            {...register('companyName')}
          />
        </RetroFormField>

        <RetroFormField label="Job Title" error={errors.jobTitle?.message}>
          <RetroInput
            type="text"
            placeholder="e.g. Software Engineer"
            {...register('jobTitle')}
          />
        </RetroFormField>

        <RetroFormField label="Job URL" error={errors.jobUrl?.message}>
          <RetroInput
            type="url"
            placeholder="https://example.com/job/123"
            {...register('jobUrl')}
          />
        </RetroFormField>

        <RetroFormField
          label="Role Category"
          error={errors.roleCategoryId?.message}
        >
          <Controller
            control={control}
            name="roleCategoryId"
            render={({ field }) => (
              <RetroSelect
                options={roleOptions}
                value={field.value || '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                placeholder="Select role category..."
              />
            )}
          />
        </RetroFormField>

        <RetroFormField label="Status" error={errors.currentStatus?.message}>
          <Controller
            control={control}
            name="currentStatus"
            render={({ field }) => (
              <RetroSelect
                options={statusOptions}
                value={field.value ?? 'draft'}
                onValueChange={field.onChange}
                placeholder="Select status..."
              />
            )}
          />
        </RetroFormField>

        <RetroFormField label="Applied At" error={errors.appliedAt?.message}>
          <Controller
            control={control}
            name="appliedAt"
            render={({ field }) => (
              <RetroDateTimePicker
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </RetroFormField>

        <RetroFormField label="Notes" error={errors.notes?.message}>
          <textarea
            className="font-body placeholder:text-muted-foreground border-input bg-background w-full rounded-md border px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)] disabled:pointer-events-none disabled:opacity-50 caret-primary min-h-[80px] resize-y"
            placeholder="Notes about this application..."
            {...register('notes')}
          />
        </RetroFormField>

        <div className="flex gap-3 pt-2">
          <RetroButton type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
                ? 'Create Application'
                : 'Save Changes'}
          </RetroButton>
          <RetroButton
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </RetroButton>
        </div>
      </form>
    </div>
  );
}
