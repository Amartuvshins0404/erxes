/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconCalendar,
  IconCertificate,
  IconCircleCheck,
  IconCircleX,
  IconDots,
  IconEdit,
  IconMail,
  IconMapPin,
  IconPhone,
  IconPhoto,
  IconServer,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import { format } from 'date-fns';
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { MtoProfile, ProfileStatus } from '@/profile/types/profile';

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM dd, yyyy');
};

const statusVariant = (status?: ProfileStatus) => {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'destructive' as const;
  return 'secondary' as const;
};

export const profileColumns = ({
  onEdit,
  onRemove,
  onApprove,
  onReject,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}): ColumnDef<MtoProfile>[] => [
  {
    id: 'businessName',
    accessorKey: 'businessName',
    header: () => <RecordTable.InlineHead label="Name" icon={IconTag} />,
    cell: ({ row }) => {
      const { businessName, icon } = row.original;
      return (
        <RecordTableInlineCell className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar size="xl" className="rounded">
              {icon ? (
                <Avatar.Image
                  src={readImage(icon)}
                  alt={businessName?.en || ''}
                />
              ) : null}
              <Avatar.Fallback className="rounded">
                <IconPhoto className="size-4 text-muted-foreground" />
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">
                {businessName?.en || '—'}
              </span>
              {businessName?.mn ? (
                <span className="text-xs text-muted-foreground truncate">
                  {businessName.mn}
                </span>
              ) : null}
            </div>
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 260,
  },
  {
    id: 'email',
    header: () => <RecordTable.InlineHead label="Email" icon={IconMail} />,
    cell: ({ row }) => {
      const email = row.original.contactInfo?.email;
      return (
        <RecordTableInlineCell className="min-w-0">
          {email ? (
            <span className="truncate">{email}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'phone',
    header: () => <RecordTable.InlineHead label="Phone" icon={IconPhone} />,
    cell: ({ row }) => {
      const phone = row.original.contactInfo?.phone;
      return (
        <RecordTableInlineCell className="min-w-0">
          {phone ? (
            <span className="truncate">{phone}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'certificateNo',
    accessorKey: 'certificateNo',
    header: () => (
      <RecordTable.InlineHead label="Certificate No" icon={IconCertificate} />
    ),
    cell: ({ cell }) => {
      const certificateNo = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell className="min-w-0">
          {certificateNo ? (
            <span className="truncate">{certificateNo}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: () => (
      <RecordTable.InlineHead label="Address" icon={IconMapPin} />
    ),
    cell: ({ cell }) => {
      const address = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell className="min-w-0">
          {address ? (
            <span className="truncate">{address}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 180,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => (
      <RecordTable.InlineHead label="Status" icon={IconCircleCheck} />
    ),
    cell: ({ cell, row }) => {
      const status = cell.getValue() as ProfileStatus | undefined;
      const active = row.original.isActive;
      return (
        <RecordTableInlineCell>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={statusVariant(status)}>{status || 'pending'}</Badge>
            <Badge variant={active ? 'success' : 'secondary'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 180,
  },
  {
    id: 'instanceId',
    accessorKey: 'instanceId',
    header: () => (
      <RecordTable.InlineHead label="Instance" icon={IconServer} />
    ),
    cell: ({ cell }) => {
      const instanceId = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell className="min-w-0">
          {instanceId ? (
            <span className="truncate">{instanceId}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <RecordTable.InlineHead label="Created" icon={IconCalendar} />
    ),
    cell: ({ cell }) => {
      const label = formatDate(cell.getValue() as string | undefined);
      return (
        <RecordTableInlineCell>
          {label || <span className="text-muted-foreground">—</span>}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'actions',
    header: () => <span />,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <RecordTableInlineCell>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <IconDots className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="mto:min-w-36" align="end">
              <DropdownMenu.Item
                className="cursor-pointer"
                onClick={() => onEdit(row.original._id)}
              >
                <IconEdit className="size-4" />
                <span>Edit</span>
              </DropdownMenu.Item>
              {status !== 'approved' ? (
                <DropdownMenu.Item
                  className="cursor-pointer"
                  onClick={() => onApprove(row.original._id)}
                >
                  <IconCircleCheck className="size-4" />
                  <span>Approve</span>
                </DropdownMenu.Item>
              ) : null}
              {status !== 'rejected' ? (
                <DropdownMenu.Item
                  className="cursor-pointer"
                  onClick={() => onReject(row.original._id)}
                >
                  <IconCircleX className="size-4" />
                  <span>Reject</span>
                </DropdownMenu.Item>
              ) : null}
              <DropdownMenu.Item
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onRemove(row.original._id)}
              >
                <IconTrash className="size-4" />
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </RecordTableInlineCell>
      );
    },
    size: 50,
  },
];
