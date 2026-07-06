import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const workflowSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    name: { type: String, required: true, label: 'Name' },
    description: { type: String, label: 'Description' },
    // The owning agent (business agentId, NOT the mongoose _id) — the workflow's
    // identity anchor: background runs mint the owner token from THIS agent's
    // config and enable preconditions resolve from it, exactly as schedules do.
    // Indexed like schedule.agentId. Deliberately NOT `required` at the schema
    // level (unlike schedules): the boot backfill leaves genuinely unassignable
    // legacy workflows without one (and disables them) — presence is enforced at
    // the create boundary (mutation + builder tools) instead.
    agentId: { type: String, index: true, label: 'Agent' },
    // The full DSL document ({ trigger, policy, bindings, limits, steps }).
    // Schema-validated in code (validateDefinition) — Mongo stores it opaquely.
    definition: { type: Object, required: true, label: 'Definition' },
    // Bumped on every definition change; runs pin the version they started with.
    version: { type: Number, default: 1, label: 'Version' },
    // Disabled by default: a workflow only reacts to triggers after an explicit
    // enable (manual runs are allowed regardless, for testing).
    isEnabled: { type: Boolean, default: false, label: 'Enabled' },
    createdByUserId: { type: String, label: 'Created by' },
  },
  { timestamps: true },
);
