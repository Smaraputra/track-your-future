import { RetroWindow } from '@/components/retro-window';
import { RoleForm } from '@/components/roles/role-form';

export default function NewRolePage() {
  return (
    <RetroWindow title="sys://roles/new">
      <RoleForm mode="create" />
    </RetroWindow>
  );
}
