import { Form, Input, Label, Switch, Textarea } from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import { FormSection } from '~/components/FormLayout';
import { SkillFormValues } from '../validations';

// SKILL.md editor body — name, description, instructions, glob category, the
// /slash exposure toggle, and free-form JSON metadata. Shared by the management
// editor page and the make_skill draft preview so both edit the same shape.
export const SkillFormFields = ({
  form,
  onNameChange,
}: {
  form: UseFormReturn<SkillFormValues>;
  /** Lets the create page auto-slug the name as a title is typed. */
  onNameChange?: (value: string) => void;
}) => (
  <>
    <FormSection
      title="Definition"
      description="The SKILL.md fields the agent reads — what the skill does and how to use it."
    >
      <Form.Field
        control={form.control}
        name="name"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Name</Form.Label>
            <Form.Control>
              <Input
                {...field}
                onChange={(e) =>
                  onNameChange
                    ? onNameChange(e.target.value)
                    : field.onChange(e.target.value)
                }
                placeholder="refund-policy"
                className="font-mono text-sm"
              />
            </Form.Control>
            <Form.Description>
              Lowercase letters, numbers and hyphens. Up to 64 characters.
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={form.control}
        name="description"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Description</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                placeholder="What this skill does and when to use it."
                rows={3}
              />
            </Form.Control>
            <Form.Description>
              Shown to the model to decide when to apply the skill (≤1024
              characters).
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={form.control}
        name="instructions"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Instructions</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                placeholder={'# Steps\n\n1. …'}
                rows={14}
                className="font-mono text-sm"
              />
            </Form.Control>
            <Form.Description>
              The SKILL.md markdown body injected when the skill activates (max
              ~5000 tokens).
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />
    </FormSection>

    <FormSection title="Scope & exposure">
      <Form.Field
        control={form.control}
        name="userInvocable"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-medium">User-invocable</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exposed in the chat composer's <code>/</code> slash picker so it
                can be activated for a turn.
              </p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <Form.Field
        control={form.control}
        name="category"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Category</Form.Label>
            <Form.Control>
              <Input {...field} placeholder="sales" />
            </Form.Control>
            <Form.Description>
              Optional namespace used for glob scoping (e.g. an agent scoped to
              <code className="mx-1">sales/*</code>).
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />

      <Form.Field
        control={form.control}
        name="metadataText"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Metadata (JSON)</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                placeholder={'{\n  "key": "value"\n}'}
                rows={4}
                className="font-mono text-sm"
              />
            </Form.Control>
            <Form.Description>
              Optional author metadata. Must be a JSON object.
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />
    </FormSection>
  </>
);
