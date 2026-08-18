import {
  IconCircleDashedCheck,
  IconCircleDashedX,
  IconDotsVertical,
} from '@tabler/icons-react';
import {
  BlockEditor,
  Button,
  Checkbox,
  Dialog,
  DropdownMenu,
  Label,
  Spinner,
  useBlockEditor,
} from 'erxes-ui';
import { useState } from 'react';
import { useAgencyVerify } from '../hooks/useAgencyVerify';
import { useParams } from 'react-router-dom';
import { useAgencyReject } from '../hooks/useAgencyReject';
import { AgencyRejectionReasons } from '../types/agencyTypes';
import { Block } from '@blocknote/core';

export const AgencyActionBar = () => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="ba:flex ba:justify-end ba:items-center">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <ActionBarTrigger />
        <ActionBarMenu />
      </DropdownMenu>
    </div>
  );
};

export const ActionBarTrigger = () => {
  return (
    <DropdownMenu.Trigger asChild>
      <Button variant={'secondary'}>
        <IconDotsVertical />
        Actions
      </Button>
    </DropdownMenu.Trigger>
  );
};

export const ActionBarMenu = () => {
  return (
    <DropdownMenu.Content align="end">
      <ActionVerifyStatus />
      <ActionRejectSubmission />
    </DropdownMenu.Content>
  );
};

export const ActionVerifyStatus = () => {
  const { handleVerify, loading } = useAgencyVerify();
  const { id } = useParams();
  return (
    <DropdownMenu.Item
      className="text-success"
      disabled={loading}
      onSelect={() => handleVerify(id as string)}
    >
      {loading ? <Spinner /> : <IconCircleDashedCheck />}
      Verify
    </DropdownMenu.Item>
  );
};

export const ActionRejectSubmission = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { id } = useParams();
  return (
    <>
      <DropdownMenu.Item
        className="text-destructive"
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <IconCircleDashedX />
        Reject
      </DropdownMenu.Item>
      <ActionRejectionDialog
        open={open}
        onOpenChange={setOpen}
        agencyId={id as string}
      />
    </>
  );
};

export const ActionRejectionDialog = ({
  open,
  onOpenChange,
  agencyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}) => {
  const { handleReject, loading } = useAgencyReject();
  const [selectedReasons, setSelectedReasons] = useState<
    AgencyRejectionReasons[]
  >([]);
  const [notesContent, setNotesContent] = useState<Block[] | undefined>(
    undefined,
  );

  const editor = useBlockEditor({
    initialContent: undefined,
    placeholder: 'Add any additional notes...',
  });

  const allReasons = Object.values(AgencyRejectionReasons);

  const toggleReason = (reason: AgencyRejectionReasons) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleNotesChange = async () => {
    const content = await editor?.document;
    if (content) {
      const blocks = [...content];
      blocks.pop();
      setNotesContent(blocks as Block[]);
    }
  };

  const handleSubmit = () => {
    const notes = notesContent?.length
      ? JSON.stringify(notesContent)
      : undefined;
    handleReject(agencyId, selectedReasons, notes);
    onOpenChange(false);
    setSelectedReasons([]);
    setNotesContent(undefined);
    editor?.removeBlocks(editor.document);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Reject Agency Submission</Dialog.Title>
          <Dialog.Description>
            Select the reasons for rejecting this agency submission.
          </Dialog.Description>
        </Dialog.Header>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            {allReasons.map((reason) => (
              <div key={reason} className="flex items-center gap-2">
                <Checkbox
                  id={reason}
                  checked={selectedReasons.includes(reason)}
                  onCheckedChange={() => toggleReason(reason)}
                />
                <Label htmlFor={reason}>{reason}</Label>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Notes (optional)</Label>
            <div className="border rounded-md min-h-24 overflow-y-auto">
              <BlockEditor editor={editor} onChange={handleNotesChange} />
            </div>
          </div>
        </div>
        <Dialog.Footer>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading || selectedReasons.length === 0}
            onClick={handleSubmit}
          >
            <Spinner show={loading} />
            Reject
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
