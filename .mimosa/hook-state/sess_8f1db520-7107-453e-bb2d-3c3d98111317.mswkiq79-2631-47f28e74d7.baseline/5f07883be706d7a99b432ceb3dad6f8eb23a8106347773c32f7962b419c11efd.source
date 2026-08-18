import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragMoveEvent,
} from '@dnd-kit/core';
import { useAtomValue, useAtom, useSetAtom } from 'jotai';
import {
  addingContractStatusState,
  editingContractStatusState,
} from '@/contract-status/states/ContractStatusStates';
import { useAddBlockContractStatus } from '@/contract-status/hooks/useAddBlockContractStatus';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import { useUpdateBlockContractStatus } from '@/contract-status/hooks/useUpdateBlockContractStatus';
import { useUpdateBlockContractStatusOrder } from '@/contract-status/hooks/useUpdateBlockContractStatusOrder';
import { useSortable } from '@dnd-kit/sortable';
import { IBlockContractStatus } from '@/contract-status/types';
import { BLOCK_CONTRACT_STATUS_FORM_SCHEMA } from '@/contract-status/schemas';
import {
  Button,
  cn,
  DropdownMenu,
  Form,
  Input,
  useToast,
  Skeleton,
  ColorPicker,
} from 'erxes-ui';
import {
  IconDots,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useDeleteBlockContractStatus } from '@/contract-status/hooks/useDeleteBlockContractStatus';
import { ContractStatusInlineIcon } from '@/contract-status/components/ContractStatusInline';
import { TERMINAL_CONTRACT_STATUS_TYPES } from '@/contract-status/constants';

const StatusSkeleton = () => {
  return (
    <div className="group relative flex justify-between items-center shadow-xs my-1 py-2 pr-2 pl-1 rounded cursor-default">
      <div className="absolute inset-0 rounded" />
      <span className="flex items-center gap-1">
        <IconGripVertical className="invisible w-4 h-4" stroke={1.5} />
        <Skeleton className="size-7" />
        <div className="flex flex-col">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="mt-1 w-16 h-2" />
        </div>
      </span>
      <Button variant="ghost" size="icon" disabled={true}>
        <IconDots />
      </Button>
    </div>
  );
};

export const ContractStatus = ({
  status,
  isDragDisabled,
}: {
  status: IBlockContractStatus;
  isDragDisabled: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: status._id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const dragProps = isDragDisabled ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex justify-between items-center shadow-xs my-1 py-2 pr-2 pl-1 rounded cursor-default',
        isDragging && 'cursor-grabbing shadow-lg',
      )}
    >
      <div className="absolute inset-0 rounded" {...dragProps} />
      <span className="flex items-center gap-2">
        <IconGripVertical
          className={cn(
            'w-4 h-4 transition-all',
            isDragDisabled
              ? 'opacity-0'
              : 'group-hover:opacity-100 opacity-0 hover:cursor-move',
          )}
          stroke={1.5}
        />
        <Button
          size={'icon'}
          variant={'secondary'}
          className="relative hover:bg-muted cursor-default"
          style={{
            backgroundColor: status.color ? `${status.color}25` : '#00000025',
            color: status.color || '#000000',
          }}
        >
          <ContractStatusInlineIcon
            statusType={status.type}
            color={status.color}
          />
        </Button>
        <div className="flex flex-col">
          <span className="capitalize">{status.name}</span>
          <span className="text-muted-foreground text-xs">
            {status.description}
          </span>
        </div>
      </span>
      {TERMINAL_CONTRACT_STATUS_TYPES.includes(status.type) ? null : (
        <ContractStatusOptionMenu statusId={status._id} />
      )}
    </div>
  );
};

const ContractStatusOptionMenu = ({ statusId }: { statusId: string }) => {
  const setEditingStatus = useSetAtom(editingContractStatusState);
  const { toast } = useToast();
  const { deleteStatus } = useDeleteBlockContractStatus();

  const handleDeleteStatus = () => {
    deleteStatus({
      variables: { _id: statusId },
      onCompleted: () => {
        toast({
          title: 'Success!',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconDots />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="bottom"
        alignOffset={-160}
        className="min-w-48 text-sm"
        align="start"
      >
        <DropdownMenu.Item
          onClick={(e) => {
            e.stopPropagation();
            setEditingStatus(statusId);
          }}
        >
          <IconEdit />
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          className="text-destructive"
          onClick={handleDeleteStatus}
        >
          <IconTrash />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

export const ContractStatusForm = ({
  statusType,
  projectId,
  editingStatus,
  defaultColor,
}: {
  statusType: string;
  projectId: string;
  editingStatus?: IBlockContractStatus;
  defaultColor?: string;
}) => {
  const { addStatus } = useAddBlockContractStatus();
  const { toast } = useToast();
  const { updateStatus } = useUpdateBlockContractStatus();
  const setAddingStatus = useSetAtom(addingContractStatusState);
  const setEditingStatus = useSetAtom(editingContractStatusState);

  const isEditing = !!editingStatus;

  const form = useForm<z.infer<typeof BLOCK_CONTRACT_STATUS_FORM_SCHEMA>>({
    resolver: zodResolver(BLOCK_CONTRACT_STATUS_FORM_SCHEMA),
    defaultValues: {
      name: editingStatus?.name || '',
      description: editingStatus?.description || '',
      color: editingStatus?.color || defaultColor || '#000000',
    },
  });

  useEffect(() => {
    form.setFocus('name');
  }, [form]);

  const onSubmit = (data: z.infer<typeof BLOCK_CONTRACT_STATUS_FORM_SCHEMA>) => {
    const { name, description, color } = data;

    if (isEditing && editingStatus) {
      updateStatus({
        variables: {
          _id: editingStatus._id,
          input: {
            name,
            projectId: editingStatus.projectId,
            description,
            color: color?.length && color.length > 2 ? color : '',
            type: statusType,
          },
        },
        onCompleted: () => {
          setEditingStatus(null);
        },
      });
    } else {
      addStatus({
        variables: {
          input: {
            name,
            projectId,
            description,
            color,
            type: statusType,
          },
        },
        onCompleted: () => {
          setAddingStatus(null);
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setEditingStatus(null);
    } else {
      setAddingStatus(null);
    }
  };

  return (
    <div
      className={cn(
        'group flex justify-between items-center shadow-xs my-1 py-2 pr-2 pl-1 rounded overflow-x-auto cursor-default',
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <span className="flex items-center gap-3">
            <IconGripVertical className="invisible w-4 h-4" stroke={1.5} />
            <Form.Field
              control={form.control}
              name="color"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <ColorPicker.Provider
                      value={field.value || '#000000'}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <ColorPicker.Trigger asChild>
                        <Button
                          size={'icon'}
                          variant={'secondary'}
                          className="flex justify-center items-center bg-accent hover:bg-muted shadow-none m-0 p-0 size-7 cursor-default hover:cursor-pointer"
                          style={{
                            backgroundColor: field.value
                              ? `${field.value}25`
                              : undefined,
                          }}
                        >
                          <ContractStatusInlineIcon
                            statusType={statusType}
                            color={field.value}
                          />
                        </Button>
                      </ColorPicker.Trigger>
                      <ColorPicker.Content />
                    </ColorPicker.Provider>
                  </Form.Control>
                </Form.Item>
              )}
            />

            <span className="flex items-center gap-3 w-auto">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        placeholder="Name"
                        {...field}
                        className="w-full"
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.Item className="w-full">
                    <Form.Control>
                      <Input
                        placeholder="Description"
                        {...field}
                        className="w-full"
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />
            </span>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? 'Update' : 'Save'}</Button>
          </span>
        </form>
      </Form>
    </div>
  );
};

export const ContractStatusGroup = ({
  statusType,
  statusTypeLabel,
  statusTypeColor,
  projectId,
}: {
  statusType: string;
  statusTypeLabel?: string;
  statusTypeColor?: string;
  projectId: string;
}) => {
  const { statuses = [], loading } = useBlockContractStatusesByType({
    projectId,
    type: statusType,
  });
  const { changeOrder } = useUpdateBlockContractStatusOrder();
  const [addingStatus, setAddingStatus] = useAtom(addingContractStatusState);
  const editingStatusId = useAtomValue(editingContractStatusState);
  const [_statuses, _setStatuses] = useState(statuses);

  useEffect(() => {
    _setStatuses(statuses);
  }, [statuses]);

  const isDragDisabled = _statuses.length <= 1 || editingStatusId !== null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = _statuses.findIndex((status) => status._id === active.id);
    const newIndex = _statuses.findIndex((status) => status._id === over.id);

    const newOrder = arrayMove(_statuses, oldIndex, newIndex);

    newOrder.forEach((status, index) => {
      changeOrder({
        variables: {
          _id: status._id,
          order: index,
        },
      });
    });

    _setStatuses(newOrder);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta } = event;
    if (delta) {
      delta.x = 0;
    }
  };

  const isTerminal = TERMINAL_CONTRACT_STATUS_TYPES.includes(statusType);

  return (
    <section className="p-4 w-full">
      <div className="flex justify-between items-center">
        <div className="flex justify-between items-center gap-2 bg-accent py-1 pr-2 pl-4 rounded-md w-full blk:min-h-8">
          <div className="flex items-center gap-2">
            <p className="font-medium text-base capitalize">
              {statusTypeLabel || statusType}
            </p>
          </div>
          {isTerminal ? null : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAddingStatus(statusType)}
              disabled={addingStatus !== null || editingStatusId !== null}
              className="size-6"
            >
              <IconPlus className="stroke-foreground" />
            </Button>
          )}
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      >
        <SortableContext
          items={_statuses.map((status) => status._id)}
          strategy={verticalListSortingStrategy}
        >
          {loading
            ? Array.from({ length: 2 }).map((_, index) => (
                <StatusSkeleton key={index} />
              ))
            : _statuses.map((status) => {
                if (editingStatusId === status._id) {
                  return (
                    <ContractStatusForm
                      key={status._id}
                      statusType={statusType}
                      projectId={projectId}
                      editingStatus={status}
                      defaultColor={statusTypeColor}
                    />
                  );
                }
                return (
                  <ContractStatus
                    key={status._id}
                    status={status}
                    isDragDisabled={isDragDisabled}
                  />
                );
              })}
          {addingStatus === statusType && (
            <ContractStatusForm
              statusType={statusType}
              projectId={projectId}
              defaultColor={statusTypeColor}
            />
          )}
        </SortableContext>
      </DndContext>
    </section>
  );
};
