import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const agentSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    name: { type: String, required: true, maxlength: 200, label: 'Name' },
    agentId: { type: String, required: true, unique: true, label: 'Agent ID' },
    description: { type: String, label: 'Description' },
    instructions: { type: String, maxlength: 20000, label: 'Instructions' },
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
    // Debug view: when on, the chat shows this agent's full tool-call trace
    // (web searches, fetches, operations, raw I/O). Off (default) → the chat
    // shows only a one-line turn summary that expands to the short thoughts.
    debug: { type: Boolean, default: false },
    maxSteps: { type: Number, default: 10, min: 1, max: 50 },
    // Sampling temperature sent to the model. Unset → the provider/SDK default
    // (the legacy OpenAI-compatible loop defaults to 0). Some models pin it:
    // e.g. Kimi thinking models reject anything but 1.
    temperature: { type: Number, min: 0, max: 2, label: 'Temperature' },
    isEnabled: { type: Boolean, default: true },
    createdBy: { type: String, label: 'Created By' },
    // Permission group used by unattended workflow/bot service-user execution.
    ownerUserId: { type: String, label: 'Owner User' },
    // Agent-as-principal (step 21). serviceUserId: the agent's dedicated core
    // service user (passwordless, role:'system'), provisioned lazily by
    // ensureServiceUser. grantGroupId: the permission group synced onto that
    // user (its server-side grant). Both unset until the lifecycle runs.
    serviceUserId: { type: String, label: 'Service User' },
    grantGroupId: { type: String, label: 'Grant Group' },
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
