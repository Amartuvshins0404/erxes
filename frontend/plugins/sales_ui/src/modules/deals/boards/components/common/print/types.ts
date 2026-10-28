export type PrintDialogProps = {
  open: boolean;
  onClose: () => void;
  stageId: string;
};

export type PrintFormValues = {
  copies: number;
  width: number;
  brandId: string;
  placeEntityId: string;
  responsibleEntityId: string;
  documentId: string;
};
