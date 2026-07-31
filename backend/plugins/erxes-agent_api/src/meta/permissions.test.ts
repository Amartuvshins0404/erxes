import { ERXES_AGENT_ACTIONS } from './permissionActions';
import { permissions } from './permissions';

const group = (id: string) => {
  const result = permissions.defaultGroups?.find(
    (candidate) => candidate.id === id,
  );
  if (!result) throw new Error(`Missing permission group ${id}`);
  return result;
};

const actionScope = (groupId: string, actionName: string) =>
  group(groupId).permissions.find((permission) =>
    permission.actions.includes(actionName),
  )?.scope;

describe('erxes-agent human permission roles', () => {
  it('exposes exactly viewer, user, and admin roles', () => {
    expect(permissions.defaultGroups?.map(({ id }) => id)).toEqual([
      'erxes-agent:viewer',
      'erxes-agent:user',
      'erxes-agent:admin',
    ]);
    expect(
      permissions.defaultGroups?.every(
        ({ principalType }) => principalType === 'human',
      ),
    ).toBe(true);
  });

  it('keeps viewer access safe and read-only', () => {
    expect(
      actionScope('erxes-agent:viewer', ERXES_AGENT_ACTIONS.agent.readSummary),
    ).toBe('group');
    expect(
      actionScope('erxes-agent:viewer', ERXES_AGENT_ACTIONS.agent.chat),
    ).toBeUndefined();
    expect(
      actionScope('erxes-agent:viewer', ERXES_AGENT_ACTIONS.agent.readConfig),
    ).toBeUndefined();
    expect(
      actionScope('erxes-agent:viewer', ERXES_AGENT_ACTIONS.workflow.read),
    ).toBeUndefined();
  });

  it('limits user writes to owned resources and withholds privileged actions', () => {
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.agent.create),
    ).toBe('own');
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.workflow.run),
    ).toBe('own');
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.skills.update),
    ).toBe('own');
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.workflow.approve),
    ).toBeUndefined();
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.workflow.schedule),
    ).toBeUndefined();
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.agent.share),
    ).toBe('own');
    expect(
      actionScope('erxes-agent:user', ERXES_AGENT_ACTIONS.settings.manage),
    ).toBeUndefined();
  });

  it('gives admins full plugin scope but reserves organization ownership transfer', () => {
    expect(
      actionScope('erxes-agent:admin', ERXES_AGENT_ACTIONS.agent.moderate),
    ).toBe('all');
    expect(
      actionScope('erxes-agent:admin', ERXES_AGENT_ACTIONS.workflow.approve),
    ).toBe('all');
    expect(
      actionScope('erxes-agent:admin', ERXES_AGENT_ACTIONS.settings.manage),
    ).toBe('all');
    expect(
      actionScope(
        'erxes-agent:admin',
        ERXES_AGENT_ACTIONS.agent.transferOwnership,
      ),
    ).toBeUndefined();
    expect(
      actionScope('erxes-agent:admin', 'permissionsAgentProfilesManage'),
    ).toBe('all');
  });
});
