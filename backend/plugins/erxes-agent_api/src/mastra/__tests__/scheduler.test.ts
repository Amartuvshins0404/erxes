import type { IModels } from '~/connectionResolvers';

const mockStore = {
  listSchedules: jest.fn(),
  getSchedule: jest.fn(),
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
};
const mockStartWorkers = jest.fn().mockResolvedValue(undefined);
const mockComputeNextFireAt = jest.fn().mockReturnValue(2_000);
const mockGenerateModels = jest.fn();
const mockRunBackgroundWorkflow = jest.fn();

jest.mock('@mastra/core/mastra', () => ({
  Mastra: jest.fn().mockImplementation(() => ({
    startWorkers: mockStartWorkers,
  })),
}));

jest.mock('@mastra/core/workflows', () => ({
  computeNextFireAt: mockComputeNextFireAt,
  createStep: jest.fn((config) => config),
  createEventedWorkflow: jest.fn(() => ({
    then: jest.fn(() => ({ commit: jest.fn(() => ({})) })),
  })),
}));

jest.mock('@mastra/mongodb', () => ({
  MongoDBStore: jest.fn().mockImplementation(() => ({
    getStore: jest.fn().mockResolvedValue(mockStore),
  })),
}));

jest.mock('erxes-api-shared/utils', () => ({
  getEnv: jest.fn(),
  getSaasOrganizations: jest.fn(),
}));

jest.mock('~/connectionResolvers', () => ({
  generateModels: mockGenerateModels,
}));
jest.mock('~/mastra/workflows/runtime', () => ({
  runBackgroundWorkflow: mockRunBackgroundWorkflow,
}));

import { dispatchScheduledRun, syncTenantSchedules } from '../scheduler';

describe('Mastra workflow schedule projection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getSchedule.mockResolvedValue(null);
    mockStore.createSchedule.mockResolvedValue(undefined);
    mockStore.updateSchedule.mockResolvedValue(undefined);
    mockStore.deleteSchedule.mockResolvedValue(undefined);
  });

  it('projects only schedule-triggered workflows and removes obsolete rows', async () => {
    mockStore.listSchedules.mockResolvedValue([
      { id: 'erxes:agent:2:os:obsolete-agent-schedule' },
    ]);
    const models = {
      MastraWorkflow: {
        getWorkflows: jest.fn().mockResolvedValue([
          {
            _id: 'scheduled-workflow',
            isEnabled: true,
            approvalStatus: 'approved',
            definition: {
              trigger: {
                type: 'schedule',
                config: {
                  cron: '30 9 * * *',
                  timezone: 'Asia/Ulaanbaatar',
                },
              },
            },
          },
          {
            _id: 'manual-workflow',
            isEnabled: true,
            definition: { trigger: { type: 'manual', config: {} } },
          },
        ]),
      },
    } as unknown as IModels;

    await syncTenantSchedules(models, 'os');

    expect(mockStartWorkers).toHaveBeenCalledTimes(1);
    expect(mockStore.deleteSchedule).toHaveBeenCalledWith(
      'erxes:agent:2:os:obsolete-agent-schedule',
    );
    expect(mockStore.createSchedule).toHaveBeenCalledTimes(1);
    expect(mockStore.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'erxes:workflow:2:os:scheduled-workflow',
        status: 'active',
        timezone: 'Asia/Ulaanbaatar',
        target: expect.objectContaining({
          workflowId: 'erxes-scheduled-dispatch',
          inputData: {
            subdomain: 'os',
            workflowId: 'scheduled-workflow',
          },
        }),
      }),
    );
  });

  it('recovers when another synchronizer creates the workflow row', async () => {
    mockStore.listSchedules.mockResolvedValue([]);
    mockStore.getSchedule.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'erxes:workflow:9:localhost:workflow-schedule',
      cron: '0 8 * * *',
      timezone: 'UTC',
      status: 'active',
    });
    mockStore.createSchedule.mockRejectedValue(
      new Error('Schedule already exists'),
    );
    const models = {
      MastraWorkflow: {
        getWorkflows: jest.fn().mockResolvedValue([
          {
            _id: 'workflow-schedule',
            isEnabled: true,
            approvalStatus: 'approved',
            definition: {
              trigger: {
                type: 'schedule',
                config: { cron: '0 8 * * *', timezone: 'UTC' },
              },
            },
          },
        ]),
      },
    } as unknown as IModels;

    await expect(
      syncTenantSchedules(models, 'localhost'),
    ).resolves.toBeUndefined();
    expect(mockStore.updateSchedule).toHaveBeenCalledWith(
      'erxes:workflow:9:localhost:workflow-schedule',
      expect.objectContaining({ status: 'active' }),
    );
  });
});

describe('Mastra scheduled workflow dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes a scheduled workflow through background execution', async () => {
    const workflow = {
      _id: 'workflow-schedule',
      isEnabled: true,
      approvalStatus: 'approved',
      definition: { trigger: { type: 'schedule' } },
    };
    const models = {
      MastraWorkflow: {
        findOne: jest.fn().mockResolvedValue(workflow),
      },
    };
    mockGenerateModels.mockResolvedValue(models);
    mockRunBackgroundWorkflow.mockResolvedValue({
      _id: 'run-1',
      status: 'success',
    });

    await expect(
      dispatchScheduledRun({
        subdomain: 'os',
        workflowId: 'workflow-schedule',
      }),
    ).resolves.toEqual({ status: 'success', runId: 'run-1' });
    expect(mockRunBackgroundWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        models,
        subdomain: 'os',
        workflow,
        envelope: expect.objectContaining({
          source: 'schedule',
          type: 'schedule',
        }),
      }),
    );
  });
});
