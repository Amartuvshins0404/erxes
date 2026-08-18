import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  RemoveButton,
  UploadButton,
  UploadCard,
} from '@/block/components/UploadCard';
import {
  BLOCK_CREATE_DOCUMENT,
  BLOCK_DELETE_DOCUMENT,
  BLOCK_GET_DOCUMENTS,
  BLOCK_UPDATE_DOCUMENT,
} from '@/project/graphql/documentQueries';
import {
  IconFile,
  IconFileOff,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery } from '@apollo/client';
import {
  AlertDialog,
  Button,
  Form,
  Input,
  Label,
  readImage,
  Select,
  Sheet,
  toast,
} from 'erxes-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const DOCUMENT_TYPES = [
  { value: 'brochure', label: 'Brochure' },
  { value: 'price-list', label: 'Price List' },
  { value: 'floor-book', label: 'Floor Book' },
  { value: 'other', label: 'Other' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'agents_only', label: 'Agents Only' },
];

interface IDocument {
  _id: string;
  name: string;
  type: string;
  visibility: string;
  createdBy: string;
  attachment: string;
  description: string;
}

export const ProjectDetailDocument = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [editDoc, setEditDoc] = useState<IDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, refetch } = useQuery<{ blockGetDocuments: IDocument[] }>(
    BLOCK_GET_DOCUMENTS,
    { variables: { itemType: 'project', itemId: projectId }, skip: !projectId },
  );

  const [deleteDocument, { loading: deleting }] = useMutation(
    BLOCK_DELETE_DOCUMENT,
    {
      onCompleted: () => {
        setDeleteTarget(null);
        refetch();
      },
      onError: (err) =>
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        }),
    },
  );

  const documents = data?.blockGetDocuments || [];

  return (
    <div className="p-8">
      <InfoCard title="Document">
        <InfoCardContent>
          {documents.length > 0 && (
            <div className="gap-3 grid grid-cols-12 mb-2">
              <Label className="col-span-3" asChild>
                <span>Name</span>
              </Label>
              <Label className="col-span-2" asChild>
                <span>Type</span>
              </Label>
              <Label className="col-span-2" asChild>
                <span>Visibility</span>
              </Label>
              <Label className="col-span-3" asChild>
                <span>File</span>
              </Label>
              <Label className="col-span-2" asChild>
                <span>Actions</span>
              </Label>
            </div>
          )}

          {documents.length === 0 && (
            <div className="flex flex-col justify-center items-center gap-3 py-12 text-muted-foreground">
              <IconFileOff size={40} strokeWidth={1.5} />
              <p className="text-sm">No documents yet</p>
            </div>
          )}

          {documents.map((doc) => (
            <div
              key={doc._id}
              className="items-center gap-3 grid grid-cols-12 py-1"
            >
              <div className="col-span-3 text-sm truncate">{doc.name}</div>
              <div className="col-span-2 text-sm truncate capitalize">
                {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ||
                  doc.type}
              </div>
              <div className="col-span-2 text-sm truncate capitalize">
                {VISIBILITY_OPTIONS.find((v) => v.value === doc.visibility)
                  ?.label || doc.visibility}
              </div>
              <div className="col-span-3 min-w-0 text-sm">
                {doc.attachment ? (
                  <a
                    href={readImage(doc.attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-2 bg-accent hover:bg-accent/70 px-2 py-1 rounded w-fit transition-colors"
                  >
                    <IconFile
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="font-medium text-muted-foreground text-xs uppercase">
                      {doc.attachment.split('.').pop()}
                    </span>
                  </a>
                ) : (
                  <span className="flex items-center gap-2 bg-accent hover:bg-accent/70 px-2 py-1 rounded w-fit font-medium text-muted-foreground text-xs uppercase transition-colors">
                    No attachment
                  </span>
                )}
              </div>
              <div className="flex gap-1 col-span-2 shrink-0">
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditDoc(doc)}
                >
                  <IconPencil size={14} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-destructive/10 hover:bg-destructive/20 size-8 text-destructive"
                  onClick={() => setDeleteTarget(doc._id)}
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            </div>
          ))}

          <ProjectDocumentSheet projectId={projectId || ''} onSaved={refetch} />
        </InfoCardContent>
      </InfoCard>

      {editDoc && (
        <ProjectDocumentEditSheet
          doc={editDoc}
          projectId={projectId || ''}
          onSaved={() => {
            setEditDoc(null);
            refetch();
          }}
          onClose={() => setEditDoc(null)}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Delete document?</AlertDialog.Title>
            <AlertDialog.Description>
              This action cannot be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() =>
                deleteTarget &&
                deleteDocument({ variables: { _id: deleteTarget } })
              }
              disabled={deleting}
            >
              Delete
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};

export const ProjectDocumentSheet = ({
  projectId,
  onSaved,
}: {
  projectId: string;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary" className="mt-2">
          Add Document
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Add Document</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ProjectDetailDocumentForm
          projectId={projectId}
          onClose={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </Sheet.View>
    </Sheet>
  );
};

const ProjectDocumentEditSheet = ({
  doc,
  projectId,
  onSaved,
  onClose,
}: {
  doc: IDocument;
  projectId: string;
  onSaved: () => void;
  onClose: () => void;
}) => {
  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Edit Document</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ProjectDetailDocumentForm
          projectId={projectId}
          editDoc={doc}
          onClose={onSaved}
        />
      </Sheet.View>
    </Sheet>
  );
};

const documentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  visibility: z.string().min(1, 'Visibility is required'),
  description: z.string().optional(),
  file: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export const ProjectDetailDocumentForm = ({
  projectId,
  editDoc,
  onClose,
}: {
  projectId: string;
  editDoc?: IDocument;
  onClose: () => void;
}) => {
  const isEdit = !!editDoc;

  const form = useForm<DocumentFormValues>({
    defaultValues: {
      name: editDoc?.name || '',
      type: editDoc?.type || '',
      visibility: editDoc?.visibility || 'private',
      description: editDoc?.description || '',
      file: editDoc?.attachment || '',
    },
    resolver: zodResolver(documentFormSchema),
  });

  const [createDocument, { loading: creating }] = useMutation(
    BLOCK_CREATE_DOCUMENT,
    {
      onCompleted: () => {
        toast({ title: 'Document added' });
        onClose();
      },
      onError: (err) =>
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        }),
    },
  );

  const [updateDocument, { loading: updating }] = useMutation(
    BLOCK_UPDATE_DOCUMENT,
    {
      onCompleted: () => {
        toast({ title: 'Document updated' });
        onClose();
      },
      onError: (err) =>
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        }),
    },
  );

  const loading = creating || updating;

  const onSubmit = (values: DocumentFormValues) => {
    const input = {
      name: values.name,
      type: values.type,
      visibility: values.visibility,
      description: values.description || '',
      itemType: 'project',
      itemId: projectId,
      attachment: values.file || '',
    };

    if (isEdit) {
      updateDocument({ variables: { _id: editDoc._id, input } });
    } else {
      createDocument({ variables: { input } });
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="space-y-3 p-4">
          <InfoCard title="Details">
            <InfoCardContent className="gap-4 grid grid-cols-2 p-4">
              <Form.Field
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Form.Item className="col-span-2">
                    <Form.Label>Name</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Type</Form.Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Form.Control>
                        <Select.Trigger className="h-8">
                          <Select.Value placeholder="Select type" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {DOCUMENT_TYPES.map((t) => (
                          <Select.Item key={t.value} value={t.value}>
                            {t.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="visibility"
                control={form.control}
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Visibility</Form.Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Form.Control>
                        <Select.Trigger className="h-8">
                          <Select.Value placeholder="Select visibility" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {VISIBILITY_OPTIONS.map((v) => (
                          <Select.Item key={v.value} value={v.value}>
                            {v.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Form.Item className="col-span-2">
                    <Form.Label>Description</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                  </Form.Item>
                )}
              />
            </InfoCardContent>
          </InfoCard>

          <Form.Field
            name="file"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <UploadCard
                  title="File"
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? '')}
                  acceptedFileTypes={['*/*']}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <UploadButton value={field.value} />
                    <RemoveButton value={field.value} />
                  </div>
                </UploadCard>
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="bg-border"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
