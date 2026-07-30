import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const agentSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    name: { type: String, required: true, label: 'Name' },
    agentId: { type: String, required: true, unique: true, label: 'Agent ID' },
    description: { type: String, label: 'Description' },
    instructions: { type: String, label: 'Instructions' },
    provider: { type: String, required: true, label: 'Provider' },
    model: { type: String, required: true, label: 'Model' },
    // Tool reach. 'all' (default) lets the agent search & execute every erxes
    // operation + builtin. 'custom' restricts it to `allowedTools`, whose entries
    // are operation names, "plugin:<name>", "module:<name>", or "builtin:<key>".
    toolPolicy: {
      type: String,
      enum: ['all', 'custom'],
      default: 'all',
      label: 'Tool Policy',
    },
    allowedTools: [{ type: String }],
    // Skill allowlist. Glob patterns matched against global skills' name (or
    // "category/name"); the requesting user's own published skills are always
    // added on top. Empty/unset → the agent has no skills attached.
    skills: [{ type: String }],
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
    maxSteps: { type: Number, default: 10 },
    // Sampling temperature sent to the model. Unset → the provider/SDK default
    // (the legacy OpenAI-compatible loop defaults to 0). Some models pin it:
    // e.g. Kimi thinking models reject anything but 1.
    temperature: { type: Number, min: 0, max: 2, label: 'Temperature' },
    isEnabled: { type: Boolean, default: true },
    createdBy: { type: String, label: 'Created By' },
    visibility: {
      type: String,
      enum: ['private', 'team', 'department', 'unit', 'org'],
      default: 'private',
      label: 'Visibility',
    },
    // teamId   — branch _id for 'team' scope; also stored as cascade context for
    //            'department' and 'unit' scopes so the edit form can reconstruct
    //            the branch selection without a reverse-lookup.
    teamId: { type: String },
    departmentId: { type: String },
    unitId: { type: String },
  },
  { timestamps: true },
);
