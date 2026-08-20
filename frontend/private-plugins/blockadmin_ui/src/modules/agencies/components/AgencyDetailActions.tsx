import {
  IconCircleDashedCheck,
  IconCircleDashedX,
  IconDotsVertical,
} from '@tabler/icons-react';
import { Block } from '@blocknote/core';
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
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { useAgencyReject } from '../hooks/useAgencyReject';
import { useAgencyVerify } from '../hooks/useAgencyVerify';
import { AgencyRejectionReasons } from '../types/agencyTypes';

export const AgencyDetailActions = () => {
  const { agency } = useAgencyDetail();
  const [rejectOpen, setRejectOpen] = useState(false);
  const { handleVerify, loading: verifying } = useAgencyVerify();
  const isVerified = agency?.verificationStatus === 'verified';
  const isRejected = agency?.verificationStatus === 'unverified';

  if (!agency) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button variant="outline">
            <IconDotsVertical />
            Actions
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="min-w-48" align="end">
          <DropdownMenu.Item
            className="text-success focus:text-success"
            disabled={verifying || isVerified}
            onSelect={() => handleVerify(agency._id)}
          >
            {verifying ? <Spinner /> : <IconCircleDashedCheck />}
            {isVerified ? 'Already verified' : 'Verify agency'}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            className="text-destructive focus:text-destructive"
            disabled={isRejected}
            onSelect={(e) => {
              e.preventDefault();
              setRejectOpen(true);
            }}
          >
            <IconCircleDashedX />
            {isRejected ? 'Already rejected' : 'Reject submission'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      <AgencyRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        agencyId={agency._id}
      />
    </>
  );
};

export const AgencyRejectDialog = ({
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
