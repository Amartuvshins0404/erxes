import { useMutation, useQuery } from '@apollo/client';
import {
  Button,
  Checkbox,
  Input,
  Label,
  ScrollArea,
  Sheet,
  Spinner,
  Textarea,
  toast,
} from 'erxes-ui';
import { useMemo, useState } from 'react';
import { MtoPageLayout } from '~/components/MtoPageLayout';
import {
  MTO_REGISTRATION_FORM_SCHEMA_CREATE,
  MTO_REGISTRATION_FORM_SCHEMA_REMOVE,
  MTO_REGISTRATION_FORM_SCHEMA_UPDATE,
} from '@/registration/graphql/registrationMutations';
import { MTO_REGISTRATION_FORM_SCHEMAS } from '@/registration/graphql/registrationQueries';
import {
  RegistrationField,
  RegistrationFieldKind,
  RegistrationSection,
} from '@/registration/types/registrationForm';
import {
  createEmptyField,
  createEmptyOption,
  createEmptySection,
  moveItem,
  normalizeSectionsFromUnknown,
  validateSchemaSections,
} from '@/registration/utils/schemaBuilder';

const FIELD_KIND_OPTIONS: RegistrationFieldKind[] = [
  'text',
  'textarea',
  'date',
  'boolean',
  'select',
  'multiselect',
  'checkbox_group',
  'file',
  'file_list',
];

const OPTION_KINDS: RegistrationFieldKind[] = [
  'select',
  'multiselect',
  'checkbox_group',
];

interface SchemaRow {
  _id: string;
  membershipTypeId: string;
  schemaVersion: string;
  title: string;
  description?: string;
  sections: unknown;
  applicationsCount: number;
}

function updateSection(
  sections: RegistrationSection[],
  sectionIndex: number,
  updater: (section: RegistrationSection) => RegistrationSection,
) {
  return sections.map((section, idx) =>
    idx === sectionIndex ? updater(section) : section,
  );
}

function updateField(
  sections: RegistrationSection[],
  sectionIndex: number,
  fieldIndex: number,
  updater: (field: RegistrationField) => RegistrationField,
) {
  return updateSection(sections, sectionIndex, (section) => ({
    ...section,
    fields: section.fields.map((field, idx) =>
      idx === fieldIndex ? updater(field) : field,
    ),
  }));
}

function buildCollapsedState(
  sections: RegistrationSection[],
): Record<number, boolean> {
  return sections.reduce(
    (acc, _section, index) => ({ ...acc, [index]: true }),
    {} as Record<number, boolean>,
  );
}

export function RegistrationSchemasBuilderPage() {
  const { data, loading, error, refetch } = useQuery(
    MTO_REGISTRATION_FORM_SCHEMAS,
  );
  const [createMutation, { loading: creating }] = useMutation(
    MTO_REGISTRATION_FORM_SCHEMA_CREATE,
  );
  const [updateMutation, { loading: updating }] = useMutation(
    MTO_REGISTRATION_FORM_SCHEMA_UPDATE,
  );
  const [removeMutation, { loading: removing }] = useMutation(
    MTO_REGISTRATION_FORM_SCHEMA_REMOVE,
  );

  const rows: SchemaRow[] = data?.mtoRegistrationFormSchemas ?? [];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [membershipTypeId, setMembershipTypeId] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<RegistrationSection[]>([
    createEmptySection(),
  ]);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<number, boolean>
  >({});
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  const selected = useMemo(
    () => rows.find((row) => row._id === selectedId) ?? null,
    [rows, selectedId],
  );

  const hasUsedApplications = (selected?.applicationsCount ?? 0) > 0;
  const mutationLoading = creating || updating || removing;

  function resetEditorState() {
    setSelectedId(null);
    setMembershipTypeId('');
    setSchemaVersion('');
    setTitle('');
    setDescription('');
    const nextSections = [createEmptySection()];
    setSections(nextSections);
    setCollapsedSections(buildCollapsedState(nextSections));
    setSelectedSectionIndex(0);
  }

  function openCreateSheet() {
    resetEditorState();
    setSheetOpen(true);
  }

  function openEditSheet(row: SchemaRow) {
    setSelectedId(row._id);
    setMembershipTypeId(row.membershipTypeId);
    setSchemaVersion(row.schemaVersion);
    setTitle(row.title);
    setDescription(row.description ?? '');
    const normalized = normalizeSectionsFromUnknown(row.sections);
    const nextSections = normalized.length
      ? normalized
      : [createEmptySection()];
    setSections(nextSections);
    setCollapsedSections(buildCollapsedState(nextSections));
    setSelectedSectionIndex(0);
    setSheetOpen(true);
  }

  async function handleSave() {
    const draft = {
      membershipTypeId: membershipTypeId.trim(),
      schemaVersion: schemaVersion.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      sections,
    };

    if (!draft.membershipTypeId || !draft.schemaVersion || !draft.title) {
      toast({
        title: 'Validation error',
        description: 'Fill required fields',
        variant: 'destructive',
      });
      return;
    }

    const sectionsError = validateSchemaSections(draft.sections);
    if (sectionsError) {
      toast({
        title: 'Validation error',
        description: sectionsError,
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      ...draft,
      sections: draft.sections.map((section) => ({
        ...section,
        title: section.title?.trim() || undefined,
        description: section.description?.trim() || undefined,
        fields: section.fields.map((field) => ({
          ...field,
          options: OPTION_KINDS.includes(field.kind)
            ? (field.options ?? []).filter(
                (opt) => opt.value.trim() && opt.label.trim(),
              )
            : undefined,
        })),
      })),
    };

    try {
      if (selectedId) {
        await updateMutation({
          variables: { _id: selectedId, definition: payload },
        });
      } else {
        await createMutation({ variables: { definition: payload } });
      }
      await refetch();
      toast({ title: 'Saved', description: 'Schema saved successfully' });
      setSheetOpen(false);
      resetEditorState();
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save schema',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (hasUsedApplications) {
      toast({
        title: 'Blocked',
        description: 'Schema has applications',
        variant: 'destructive',
      });
      return;
    }
    try {
      await removeMutation({ variables: { _id: selectedId } });
      await refetch();
      setSheetOpen(false);
      resetEditorState();
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to delete schema',
        variant: 'destructive',
      });
    }
  }

  return (
    <MtoPageLayout pageName="Registration Schemas">
      <div className="flex flex-auto overflow-hidden flex-col">
        <div className="shrink-0 p-6 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Schemas</h3>
            <Button type="button" onClick={openCreateSheet}>
              New schema
            </Button>
          </div>

          {loading ? <Spinner /> : null}
          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : null}
        </div>

        <ScrollArea className="flex-auto">
          <div className="space-y-2 px-6 pb-6">
            {rows.map((row) => (
              <button
                key={row._id}
                type="button"
                className="w-full border rounded-md p-3 text-left"
                onClick={() => openEditSheet(row)}
              >
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {row.membershipTypeId} / {row.schemaVersion}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <Sheet.View className="sm:max-w-4xl lg:max-w-6xl w-full md:w-[min(84rem,calc(100vw-1rem))]">
          <Sheet.Header className="shrink-0">
            <Sheet.Title>
              {selectedId ? 'Edit schema' : 'Create schema'}
            </Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>

          <Sheet.Content className="overflow-y-auto min-h-0 flex-1">
            <div className="space-y-3 p-5 pb-10">
              {hasUsedApplications ? (
                <p className="text-xs text-amber-600">
                  Warning: this schema is already used by submitted
                  applications.
                </p>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={membershipTypeId}
                  onChange={(e) => setMembershipTypeId(e.target.value)}
                  placeholder="membershipTypeId"
                />
                <Input
                  value={schemaVersion}
                  onChange={(e) => setSchemaVersion(e.target.value)}
                  placeholder="schemaVersion"
                />
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="title"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="description"
              />

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Groups</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSections((prev) => {
                          const next = [...prev, createEmptySection()];
                          setCollapsedSections((old) => ({
                            ...old,
                            [next.length - 1]: true,
                          }));
                          setSelectedSectionIndex(next.length - 1);
                          return next;
                        })
                      }
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                    {sections.map((section, sectionIndex) => (
                      <button
                        key={`group-${sectionIndex}`}
                        type="button"
                        onClick={() => setSelectedSectionIndex(sectionIndex)}
                        className={`w-full text-left border rounded-md px-3 py-2 ${
                          selectedSectionIndex === sectionIndex
                            ? 'border-primary bg-muted/40'
                            : ''
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {section.title?.trim() ||
                            section.id?.trim() ||
                            `Section ${sectionIndex + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {section.fields.length} questions
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg bg-muted/20 p-4 space-y-3">
                  {sections[selectedSectionIndex] ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {sections[selectedSectionIndex].title?.trim() ||
                            sections[selectedSectionIndex].id?.trim() ||
                            `Section ${selectedSectionIndex + 1}`}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setCollapsedSections((prev) => ({
                              ...prev,
                              [selectedSectionIndex]:
                                !prev[selectedSectionIndex],
                            }))
                          }
                        >
                          {collapsedSections[selectedSectionIndex]
                            ? 'Expand'
                            : 'Collapse'}
                        </Button>
                      </div>

                      {collapsedSections[selectedSectionIndex] ? null : (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-2">
                            <Input
                              value={sections[selectedSectionIndex].id}
                              onChange={(e) =>
                                setSections((prev) =>
                                  updateSection(
                                    prev,
                                    selectedSectionIndex,
                                    (s) => ({
                                      ...s,
                                      id: e.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="section id"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={selectedSectionIndex === 0}
                              onClick={() =>
                                setSections((prev) => {
                                  const moved = moveItem(
                                    prev,
                                    selectedSectionIndex,
                                    selectedSectionIndex - 1,
                                  );
                                  setSelectedSectionIndex((index) =>
                                    Math.max(0, index - 1),
                                  );
                                  return moved;
                                })
                              }
                            >
                              Up
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                selectedSectionIndex === sections.length - 1
                              }
                              onClick={() =>
                                setSections((prev) => {
                                  const moved = moveItem(
                                    prev,
                                    selectedSectionIndex,
                                    selectedSectionIndex + 1,
                                  );
                                  setSelectedSectionIndex((index) =>
                                    Math.min(moved.length - 1, index + 1),
                                  );
                                  return moved;
                                })
                              }
                            >
                              Down
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={sections.length === 1}
                              onClick={() =>
                                setSections((prev) => {
                                  const next = prev.filter(
                                    (_, idx) => idx !== selectedSectionIndex,
                                  );
                                  setSelectedSectionIndex((index) =>
                                    Math.max(
                                      0,
                                      Math.min(index - 1, next.length - 1),
                                    ),
                                  );
                                  return next;
                                })
                              }
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <Input
                              value={sections[selectedSectionIndex].title ?? ''}
                              onChange={(e) =>
                                setSections((prev) =>
                                  updateSection(
                                    prev,
                                    selectedSectionIndex,
                                    (s) => ({
                                      ...s,
                                      title: e.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="section title"
                            />
                            <Textarea
                              rows={2}
                              value={
                                sections[selectedSectionIndex].description ?? ''
                              }
                              onChange={(e) =>
                                setSections((prev) =>
                                  updateSection(
                                    prev,
                                    selectedSectionIndex,
                                    (s) => ({
                                      ...s,
                                      description: e.target.value,
                                    }),
                                  ),
                                )
                              }
                              placeholder="section description"
                            />
                          </div>

                          {sections[selectedSectionIndex].fields.map(
                            (field, fieldIndex) => (
                              <div
                                key={`field-${selectedSectionIndex}-${fieldIndex}`}
                                className="border rounded-md bg-background p-3 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Question {fieldIndex + 1}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px] gap-2">
                                  <Input
                                    value={field.id}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        updateField(
                                          prev,
                                          selectedSectionIndex,
                                          fieldIndex,
                                          (f) => ({
                                            ...f,
                                            id: e.target.value,
                                          }),
                                        ),
                                      )
                                    }
                                    placeholder="field id"
                                  />
                                  <Input
                                    value={field.label}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        updateField(
                                          prev,
                                          selectedSectionIndex,
                                          fieldIndex,
                                          (f) => ({
                                            ...f,
                                            label: e.target.value,
                                          }),
                                        ),
                                      )
                                    }
                                    placeholder="field label"
                                  />
                                  <select
                                    className="h-8 rounded-md border px-1.5 text-xs bg-background"
                                    value={field.kind}
                                    onChange={(e) =>
                                      setSections((prev) =>
                                        updateField(
                                          prev,
                                          selectedSectionIndex,
                                          fieldIndex,
                                          (f) => ({
                                            ...f,
                                            kind: e.target
                                              .value as RegistrationFieldKind,
                                            options: OPTION_KINDS.includes(
                                              e.target
                                                .value as RegistrationFieldKind,
                                            )
                                              ? (f.options ?? [
                                                  createEmptyOption(),
                                                ])
                                              : [],
                                          }),
                                        ),
                                      )
                                    }
                                  >
                                    {FIELD_KIND_OPTIONS.map((kind) => (
                                      <option key={kind} value={kind}>
                                        {kind}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs">
                                  <label className="flex items-center gap-2">
                                    <Checkbox
                                      checked={field.required === true}
                                      onCheckedChange={(checked) =>
                                        setSections((prev) =>
                                          updateField(
                                            prev,
                                            selectedSectionIndex,
                                            fieldIndex,
                                            (f) => ({
                                              ...f,
                                              required: checked === true,
                                            }),
                                          ),
                                        )
                                      }
                                    />
                                    required
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <Checkbox
                                      checked={field.acknowledgment === true}
                                      onCheckedChange={(checked) =>
                                        setSections((prev) =>
                                          updateField(
                                            prev,
                                            selectedSectionIndex,
                                            fieldIndex,
                                            (f) => ({
                                              ...f,
                                              acknowledgment: checked === true,
                                            }),
                                          ),
                                        )
                                      }
                                    />
                                    acknowledgment
                                  </label>
                                </div>

                                {OPTION_KINDS.includes(field.kind) ? (
                                  <div className="space-y-2 border rounded-md p-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Answers
                                    </p>
                                    {(field.options ?? []).map(
                                      (option, optionIndex) => (
                                        <div
                                          key={`opt-${selectedSectionIndex}-${fieldIndex}-${optionIndex}`}
                                          className="flex items-center gap-2"
                                        >
                                          <Input
                                            className="min-w-0 flex-1"
                                            value={option.value}
                                            onChange={(e) =>
                                              setSections((prev) =>
                                                updateField(
                                                  prev,
                                                  selectedSectionIndex,
                                                  fieldIndex,
                                                  (f) => ({
                                                    ...f,
                                                    options: (
                                                      f.options ?? []
                                                    ).map((opt, idx) =>
                                                      idx === optionIndex
                                                        ? {
                                                            ...opt,
                                                            value:
                                                              e.target.value,
                                                          }
                                                        : opt,
                                                    ),
                                                  }),
                                                ),
                                              )
                                            }
                                            placeholder="option value"
                                          />
                                          <Input
                                            className="min-w-0 flex-1"
                                            value={option.label}
                                            onChange={(e) =>
                                              setSections((prev) =>
                                                updateField(
                                                  prev,
                                                  selectedSectionIndex,
                                                  fieldIndex,
                                                  (f) => ({
                                                    ...f,
                                                    options: (
                                                      f.options ?? []
                                                    ).map((opt, idx) =>
                                                      idx === optionIndex
                                                        ? {
                                                            ...opt,
                                                            label:
                                                              e.target.value,
                                                          }
                                                        : opt,
                                                    ),
                                                  }),
                                                ),
                                              )
                                            }
                                            placeholder="option label"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() =>
                                              setSections((prev) =>
                                                updateField(
                                                  prev,
                                                  selectedSectionIndex,
                                                  fieldIndex,
                                                  (f) => ({
                                                    ...f,
                                                    options: (
                                                      f.options ?? []
                                                    ).filter(
                                                      (_, idx) =>
                                                        idx !== optionIndex,
                                                    ),
                                                  }),
                                                ),
                                              )
                                            }
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ),
                                    )}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSections((prev) =>
                                          updateField(
                                            prev,
                                            selectedSectionIndex,
                                            fieldIndex,
                                            (f) => ({
                                              ...f,
                                              options: [
                                                ...(f.options ?? []),
                                                createEmptyOption(),
                                              ],
                                            }),
                                          ),
                                        )
                                      }
                                    >
                                      Add option
                                    </Button>
                                  </div>
                                ) : null}

                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={fieldIndex === 0}
                                    onClick={() =>
                                      setSections((prev) =>
                                        updateSection(
                                          prev,
                                          selectedSectionIndex,
                                          (s) => ({
                                            ...s,
                                            fields: moveItem(
                                              s.fields,
                                              fieldIndex,
                                              fieldIndex - 1,
                                            ),
                                          }),
                                        ),
                                      )
                                    }
                                  >
                                    Up
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      fieldIndex ===
                                      sections[selectedSectionIndex].fields
                                        .length -
                                        1
                                    }
                                    onClick={() =>
                                      setSections((prev) =>
                                        updateSection(
                                          prev,
                                          selectedSectionIndex,
                                          (s) => ({
                                            ...s,
                                            fields: moveItem(
                                              s.fields,
                                              fieldIndex,
                                              fieldIndex + 1,
                                            ),
                                          }),
                                        ),
                                      )
                                    }
                                  >
                                    Down
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={
                                      sections[selectedSectionIndex].fields
                                        .length === 1
                                    }
                                    onClick={() =>
                                      setSections((prev) =>
                                        updateSection(
                                          prev,
                                          selectedSectionIndex,
                                          (s) => ({
                                            ...s,
                                            fields: s.fields.filter(
                                              (_, idx) => idx !== fieldIndex,
                                            ),
                                          }),
                                        ),
                                      )
                                    }
                                  >
                                    Remove field
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSections((prev) =>
                                updateSection(
                                  prev,
                                  selectedSectionIndex,
                                  (s) => ({
                                    ...s,
                                    fields: [...s.fields, createEmptyField()],
                                  }),
                                ),
                              )
                            }
                          >
                            Add field
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a group to edit questions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Sheet.Content>

          <Sheet.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={mutationLoading}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!selectedId || mutationLoading || hasUsedApplications}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Sheet.Footer>
        </Sheet.View>
      </Sheet>
    </MtoPageLayout>
  );
}
