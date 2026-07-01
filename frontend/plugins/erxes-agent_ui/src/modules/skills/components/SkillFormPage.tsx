import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  IconArrowLeft,
  IconBook2,
  IconHistory,
  IconRocket,
  IconWorldDown,
  IconWorldUp,
} from '@tabler/icons-react';
import { Badge, Breadcrumb, Button, Form, Separator, toast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from 'ui-modules';
import { SkillFormFields } from './SkillFormFields';
import { SkillVersionHistoryDialog } from './SkillVersionHistoryDialog';
import { useSkill } from '../hooks/useSkill';
import { useSaveSkill } from '../hooks/useSaveSkill';
import { useSkillMutations } from '../hooks/useSkillMutations';
import {
  showSkillPermissionError,
  useSkillAccess,
} from '../hooks/useSkillAccess';
import { IMastraSkill } from '../types';
import {
  skillFormToDoc,
  skillStatusLabel,
  skillStatusVariant,
  skillVisibilityLabel,
  stringifyMetadata,
  toSkillSlug,
} from '../utils';
import {
  SKILL_FORM_DEFAULTS,
  SkillFormValues,
  skillFormSchema,
} from '../validations';
import { SKILLS_PATH } from '../constants';

export const SkillFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: SKILL_FORM_DEFAULTS,
  });

  const [historyOpen, setHistoryOpen] = useState(false);

  const { skill, loading } = useSkill(id);
  const { canCreate, canEdit, canPromote } = useSkillAccess();

  const onSaved = (saved: IMastraSkill) => {
    toast({ title: isEdit ? 'Skill saved' : 'Skill created' });
    if (!isEdit) navigate(`${SKILLS_PATH}/edit/${saved._id}`);
  };

  const { createSkillDoc, updateSkillDoc, saving } = useSaveSkill(id, onSaved);
  const { publish, promote, demote, loading: lifecycleBusy } =
    useSkillMutations();

  const canSave = isEdit ? canEdit : canCreate;
  // isMine is a nullable Boolean; only an explicit `true` is the owner — `null`
  // must not unlock owner-only affordances the backend would then reject.
  const isOwner = skill?.isMine === true;
  const isDraft = skill?.status === 'draft';
  const isPublished = skill?.status === 'published';
  const isPrivate = skill?.visibility === 'private';
  const isPublic = skill?.visibility === 'public';
  // A promoted (global) skill can be pulled back to private by its author or an
  // admin — the inverse of Promote, so the one-way trap has an exit.
  const canDemote = isPublic && (isOwner || canPromote);

  // Populate the form once the skill arrives (edit only).
  useEffect(() => {
    if (isEdit && skill) {
      form.reset({
        name: skill.name || '',
        description: skill.description || '',
        instructions: skill.instructions || '',
        userInvocable: skill.userInvocable ?? true,
        category: skill.category || '',
        metadataText: stringifyMetadata(skill.metadata),
      });
    }
  }, [skill, isEdit, form]);

  // On the create path the name field IS the slug, so keep it slugified as the
  // author types. (Edit passes no handler — the name is edited verbatim.)
  const handleNameChange = (value: string) => {
    form.setValue('name', toSkillSlug(value), { shouldValidate: true });
  };

  const onSubmit = (values: SkillFormValues) => {
    const { doc, metadataError } = skillFormToDoc(values);
    if (!doc) {
      form.setError('metadataText', { message: metadataError });
      return;
    }
    if (isEdit) {
      updateSkillDoc(doc);
    } else {
      createSkillDoc(doc);
    }
  };

  const handlePublish = () => {
    if (!id) return;
    if (!canEdit) return showSkillPermissionError('publish');
    publish(id);
  };

  const handlePromote = () => {
    if (!id) return;
    if (!canPromote) return showSkillPermissionError('promote');
    promote(id);
  };

  const handleDemote = () => {
    if (!id) return;
    if (!isOwner && !canPromote) return showSkillPermissionError('demote');
    demote(id);
  };

  const saveLabel = isEdit ? 'Save changes' : 'Create skill';

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={SKILLS_PATH}>
                    <IconBook2 />
                    Skills
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="text-muted-foreground">
                  {isEdit ? skill?.name || 'Edit skill' : 'New skill'}
                </span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          {isEdit && skill && (
            <>
              <Separator.Inline />
              <Badge variant={skillStatusVariant(skill.status)}>
                {skillStatusLabel(skill.status)}
              </Badge>
              <Badge variant="secondary">
                {skillVisibilityLabel(skill.visibility)}
              </Badge>
            </>
          )}
        </PageHeader.Start>
        <PageHeader.End>
          <Button variant="outline" asChild>
            <Link to={SKILLS_PATH}>
              <IconArrowLeft /> Back
            </Link>
          </Button>
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              disabled={!skill?.versionCount}
            >
              <IconHistory /> History
            </Button>
          )}
          {isEdit && isDraft && isOwner && (
            <Button
              variant="secondary"
              onClick={handlePublish}
              disabled={lifecycleBusy}
            >
              <IconRocket /> Publish
            </Button>
          )}
          {isEdit && isPublished && isPrivate && canPromote && (
            <Button
              variant="secondary"
              onClick={handlePromote}
              disabled={lifecycleBusy}
            >
              <IconWorldUp /> Promote to global
            </Button>
          )}
          {isEdit && canDemote && (
            <Button
              variant="secondary"
              onClick={handleDemote}
              disabled={lifecycleBusy}
            >
              <IconWorldDown /> Demote to private
            </Button>
          )}
          <Button
            type="submit"
            form="skill-form"
            disabled={saving || !canSave || (isEdit && !isOwner)}
          >
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="flex-1 overflow-auto p-4">
        {isEdit && loading && !skill ? (
          <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
            Loading skill…
          </div>
        ) : (
          <Form {...form}>
            <form
              id="skill-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="max-w-2xl mx-auto space-y-4"
            >
              <SkillFormFields
                form={form}
                onNameChange={isEdit ? undefined : handleNameChange}
              />

              <div className="flex gap-3 pb-4 sm:hidden">
                <Button type="submit" disabled={saving || !canSave}>
                  {saving ? 'Saving…' : saveLabel}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to={SKILLS_PATH}>Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      {isEdit && id && (
        <SkillVersionHistoryDialog
          skillId={id}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          activeVersionId={skill?.activeVersionId ?? null}
          canRestore={canEdit && isOwner}
        />
      )}
    </div>
  );
};
