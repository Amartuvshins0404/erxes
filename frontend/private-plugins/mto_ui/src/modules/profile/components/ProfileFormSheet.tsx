import { Sheet } from 'erxes-ui';
import { ProfileForm } from '@/profile/components/ProfileForm';

interface ProfileFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

export function ProfileFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: ProfileFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-2xl">
        <Sheet.Header>
          <Sheet.Title>{editId ? 'Edit Profile' : 'New Profile'}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="overflow-y-auto flex-1">
          {open ? (
            <ProfileForm
              source="id"
              profileId={editId}
              layout="sheet"
              onSaved={() => {
                onSaved?.();
                onOpenChange(false);
              }}
            />
          ) : null}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
}
