import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { ADDITIONAL_TOOL_KEYS } from '~/mastra/tools/additionalTools';

export const agentSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    instructions: { type: String, maxlength: 20000, label: 'Instructions' },
    provider: { type: String, required: true, label: 'Provider' },
    model: { type: String, required: true, label: 'Model' },
    createdBy: { type: String, index: true, label: 'Created By' },
    // No default: legacy profiles remain distinguishable and the access layer
    // preserves their original organization-visible behavior.
    visibility: {
      type: String,
      enum: ['private', 'shared', 'organization'],
      required: true,
      index: true,
      label: 'Visibility',
    },
    audienceUserIds: [{ type: String }],
    audienceTeamIds: [{ type: String }],
    audienceDepartmentIds: [{ type: String }],
    // Missing on legacy profiles means managed. New profiles always set this
    // explicitly in the create resolver.
    permissionMode: {
      type: String,
      enum: ['delegated', 'managed'],
      required: true,
      label: 'Permission Mode',
    },
    // Skill allowlist. Glob patterns matched against global skills' name (or
    // "category/name"); the requesting user's own published skills are always
    // added on top. Empty/unset → the agent has no skills attached.
    skills: [{ type: String }],
    additionalTools: [
      {
        type: String,
        enum: ADDITIONAL_TOOL_KEYS,
      },
    ],
    // Consent for irreversible deletes/merges (remove/delete/merge mutations).
    //   'ask' (default) → the agent asks the user to approve each one in chat.
    //   'allow'         → they run without asking.
    // 'block' is the legacy value (treated as 'ask'); kept in the enum so old
    // documents validate. The agent never hard-refuses a destructive op.
    destructiveOps: {
      type: String,
      enum: ['allow', 'ask', 'block'],
      default: 'ask',
      label: 'Destructive Operations',
    },
    memoryEnabled: { type: Boolean, default: true },
    // Debug view: when on, the chat shows this agent's full tool-call trace
    // (web searches, fetches, operations, raw I/O). Off (default) → the chat
    // shows only a one-line turn summary that expands to the short thoughts.
    debug: { type: Boolean, default: false },
    // Sampling temperature sent to the model. Unset → the provider/SDK default
    // (the legacy OpenAI-compatible loop defaults to 0). Some models pin it:
    // e.g. Kimi thinking models reject anything but 1.
    temperature: { type: Number, min: 0, max: 2, label: 'Temperature' },
  },
  { timestamps: true },
);
