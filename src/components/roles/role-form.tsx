'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createRoleSchema, type CreateRoleInput } from '@/lib/roles/schemas';
import { DEFAULT_ROLE_COLOR } from '@/lib/roles/constants';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';
import { ColorPicker } from '@/components/roles/color-picker';

interface RoleFormProps {
  mode: 'create' | 'edit';
  roleId?: string;
  defaultValues?: Partial<CreateRoleInput>;
}

export function RoleForm({ mode, roleId, defaultValues }: RoleFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      color: defaultValues?.color ?? DEFAULT_ROLE_COLOR,
    },
  });

  async function onSubmit(data: CreateRoleInput) {
    setServerError(null);

    const url = mode === 'create' ? '/api/roles' : `/api/roles/${roleId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push('/roles');
      router.refresh();
      return;
    }

    const body = await res.json().catch(() => null);

    if (res.status === 409) {
      setServerError('A role category with this name already exists.');
    } else if (res.status === 403) {
      setServerError(
        body?.error ?? 'Role category limit reached. Upgrade to Pro for unlimited roles.',
      );
    } else {
      setServerError(body?.error ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">
          {mode === 'create' ? 'New Role Category' : 'Edit Role Category'}
        </h1>
        <p className="font-body text-muted-foreground text-sm">
          {mode === 'create'
            ? 'Create a role category to organize your job search'
            : 'Update role category details'}
        </p>
      </div>

      {serverError && <AuthMessage variant="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Name" error={errors.name?.message}>
          <RetroInput
            type="text"
            placeholder="e.g. Frontend Developer"
            {...register('name')}
          />
        </RetroFormField>

        <RetroFormField label="Description" error={errors.description?.message}>
          <textarea
            className="font-body placeholder:text-muted-foreground border-input bg-background w-full rounded-md border px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[0_0_8px_var(--primary)] disabled:pointer-events-none disabled:opacity-50 caret-primary min-h-[80px] resize-y"
            placeholder="Optional description for this role category"
            {...register('description')}
          />
        </RetroFormField>

        <RetroFormField label="Color" error={errors.color?.message}>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <ColorPicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </RetroFormField>

        <div className="flex gap-3 pt-2">
          <RetroButton type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : mode === 'create'
                ? 'Create Role'
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
