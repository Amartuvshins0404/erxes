import { useEffect } from 'react';
import { IconRocket, IconSparkles } from '@tabler/icons-react';
import { Badge, Button, Dialog, Form, Spinner, toast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SkillFormFields } from './SkillFormFields';
import { useSkill } from '../hooks/useSkill';
import { useSaveSkill } from '../hooks/useSaveSkill';
import { useSkillMutations } from '../hooks/useSkillMutations';
import { showSkillPermissionError, useSkillAccess } from '../hooks/useSkillAccess';
import { skillFormToDoc, stringifyMetadata } from '../utils';
import {
  SKILL_FORM_DEFAULTS,
  SkillFormValues,
  skillFormSchema,
} from '../validations';

/**
 * make_skill draft review panel. The makeSkill agent tool (mastraSkillFromThread)
 * distills a conversation into a DRAFT skill; this dialog surfaces it for
 * review/edit then save or publish — the documented UI half of that tool.
 */
export const SkillDraftPreviewDialog = ({
  skillId,
  open,
  onOpenChange,
  onDone,
}: {
  skillId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the draft is published/saved so the chat can clear its banner. */
  onDone?: () => void;
}) => {
  const { canEdit } = useSkillAccess();
  const { skill, loading } = useSkill(open && skillId ? skillId : undefined);

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: SKILL_FORM_DEFAULTS,
  });

  // No toast on save here — the explicit Save/Publish handlers below own the
  // messaging so the publish path shows one toast, not "Draft saved" + "Published".
  const { updateSkillDoc, saving } = useSaveSkill(
    skillId ?? undefined,
    () => undefined,
  );
  const { publish, loading: publishing } = useSkillMutations(() => {
    onDone?.();
    onOpenChange(false);
  });

  useEffect(() => {
    if (open && skill) {
      form.reset({
        name: skill.name || '',
        description: skill.description || '',
        instructions: skill.instructions || '',
        userInvocable: skill.userInvocable ?? true,
        category: skill.category || '',
        metadataText: stringifyMetadata(skill.metadata),
      });
    }
  }, [open, skill, form]);

  const toDoc = (values: SkillFormValues) => {
    const { doc, metadataError } = skillFormToDoc(values);
    if (!doc) form.setError('metadataText', { message: metadataError });
    return doc;
  };

  const onSave = async (values: SkillFormValues) => {
    // Guard double-submit: each save appends a version, so a second click while
    // the first is in flight would create a duplicate. `saving` also disables
    // the button, but this covers the programmatic-submit race.
    if (saving) return;
    const doc = toDoc(values);
    if (!doc) return;
    try {
      await updateSkillDoc(doc);
    } catch {
      // updateSkillDoc's onError already surfaced the failure toast.
      return;
    }
    toast({ title: 'Draft saved' });
    // Close on success so the panel can't be re-submitted into duplicate
    // versions; let the chat clear its make_skill banner.
    onDone?.();
    onOpenChange(false);
  };

  const handlePublish = async () => {
    if (!skillId) return;
    if (!canEdit) return showSkillPermissionError('publish');
    const doc = toDoc(form.getValues());
    if (!doc) return;
    try {
      // Persist edits first (appends a version) before publishing it.
      await updateSkillDoc(doc);
    } catch {
      return;
    }
    // publish() toasts "Skill published" and closes the dialog via onChanged.
    publish(skillId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-2xl gap-0 p-0">
        <Dialog.Header className="border-b px-5 py-3.5">
          <Dialog.Title className="flex items-center gap-2">
            <IconSparkles className="size-4 text-primary" /> Review draft skill
            {skill && <Badge variant="secondary">Draft</Badge>}
          </Dialog.Title>
          <Dialog.Description>
            This draft was distilled from your conversation. Review and edit it,
            then save or publish.
          </Dialog.Description>
        </Dialog.Header>

        {loading && !skill ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)}>
              <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
                <SkillFormFields form={form} />
              </div>

              <Dialog.Footer className="flex items-center gap-2 border-t px-5 py-3.5">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm">
                    Close
                  </Button>
                </Dialog.Close>
                <div className="flex-1" />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={saving || !canEdit}
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePublish}
                  disabled={saving || publishing || !canEdit}
                >
                  <IconRocket className="size-4" /> Publish
                </Button>
              </Dialog.Footer>
            </form>
          </Form>
        )}
      </Dialog.Content>
    </Dialog>
  );
};
