import {
  useAddBoardForm,
  useBoardAdd,
  useBoardDetail,
  useBoardEdit,
} from '@/deals/boards/hooks/useBoards';
import { TBoardForm } from '@/deals/types/boards';
import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  Dialog,
  Form,
  Input,
  Skeleton,
  Spinner,
  toast,
  useQueryState,
} from 'erxes-ui';
import React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { SelectStructureEntities } from 'ui-modules';

export const BoardForm = () => {
  const [boardId, setBoardId] = useQueryState<string>('boardId');

  const { methods } = useAddBoardForm();
  const { handleSubmit, reset } = methods;

  const [open, setOpen] = React.useState<boolean>(false);

  const { boardDetail, loading: boardDetailLoading } = useBoardDetail();

  React.useEffect(() => {
    setOpen(!!boardId);
    if (!boardId) reset();
  }, [boardId, reset]);

  React.useEffect(() => {
    if (boardId && boardDetail) {
      reset({
        name: boardDetail.name,
        sharedEntityIds: boardDetail.sharedEntityIds?.filter(
          (id): id is string => !!id,
        ),
      });
    }
  }, [boardId, boardDetail, reset]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
    setBoardId(null);
    reset();
  }, [reset, setBoardId]);

  const { addBoard, loading: addLoading } = useBoardAdd();
  const { editBoard, loading: editLoading } = useBoardEdit();

  const submitHandler: SubmitHandler<TBoardForm> = React.useCallback(
    async (data) => {
      const successTitle = boardId ? 'Updated a board' : 'Created a board';

      const onCompleted = () => {
        toast({ title: successTitle });
        handleClose();
      };
      if (boardId) {
        await editBoard({ variables: { ...data, _id: boardId }, onCompleted });
      } else {
        await addBoard({ variables: data, onCompleted });
      }
    },
    [addBoard, editBoard, boardId, handleClose],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) =>
        boardId ? !isOpen && handleClose() : setOpen(isOpen)
      }
    >
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          className="text-xs font-semibold text-accent-foreground"
        >
          <IconPlus />
        </Button>
      </Dialog.Trigger>
      <Dialog.ContentCombined
        title={boardId ? 'Edit Board' : 'Add Board'}
        description={
          boardId ? 'Edit existing board details' : 'Create a new board'
        }
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <Form {...methods}>
          <form
            onSubmit={handleSubmit(submitHandler)}
            className="flex flex-col gap-4 w-full"
          >
            <div className="flex flex-col gap-3">
              {boardDetailLoading ? (
                <Skeleton className="w-full h-10 my-1" />
              ) : (
                <Form.Field
                  control={methods.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Board Name</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter board name"
                          className="input"
                          value={field.value || boardDetail?.name || ''}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              )}
              <Form.Field
                control={methods.control}
                name="sharedEntityIds"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Shared with</Form.Label>
                    <Form.Description>
                      Only members of these nodes and the nodes below them can
                      use this board. Leave empty to share with everyone.
                    </Form.Description>
                    <SelectStructureEntities.FormItem
                      mode="multiple"
                      value={field.value || []}
                      onValueChange={(value) =>
                        field.onChange(Array.isArray(value) ? value : [])
                      }
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>
            <Dialog.Footer className="pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addLoading || editLoading}>
                {addLoading || editLoading ? <Spinner /> : 'Save'}
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.ContentCombined>
    </Dialog>
  );
};
