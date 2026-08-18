import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import { Alert, Button } from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { SERVER_STATUSES } from '../constants';

type ProvisioningStatus =
  | typeof SERVER_STATUSES.PENDING
  | typeof SERVER_STATUSES.APPROVED
  | typeof SERVER_STATUSES.FAILED
  | typeof SERVER_STATUSES.DEPLOYING;

type StepState = 'pending' | 'active' | 'completed' | 'failed';

export type ManagedProvisioningProgressProps = {
  status: ProvisioningStatus;
  stage?: string;
  message?: string;
  startedAt?: string;
  updatedAt?: string;
  error?: string;
  runtimeUrl?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

const STEPS = [
  {
    stage: 'preparing',
    label: 'Preparing deployment',
    message: 'We are preparing your managed OpenClaw runtime.',
    estimatedAt: 0,
  },
  {
    stage: 'server_lookup',
    label: 'Creating or reusing server',
    message: 'A new secure runtime server is being created or reused.',
    estimatedAt: 15,
  },
  {
    stage: 'ssh_wait',
    label: 'Waiting for server access',
    message: 'Waiting for the server to accept SSH connections.',
    estimatedAt: 45,
  },
  {
    stage: 'installing_openclaw',
    label: 'Installing OpenClaw',
    message: 'Installing OpenClaw and required runtime packages.',
    estimatedAt: 70,
  },
  {
    stage: 'configuring_runtime',
    label: 'Configuring assistant runtime',
    message: 'Writing assistant configuration and workspace instructions.',
    estimatedAt: 95,
  },
  {
    stage: 'starting_services',
    label: 'Starting services',
    message: 'Starting OpenClaw Gateway and the Erxes adapter.',
    estimatedAt: 125,
  },
  {
    stage: 'verifying_health',
    label: 'Verifying runtime health',
    message: 'Checking that the assistant runtime is reachable.',
    estimatedAt: 140,
  },
  {
    stage: 'approved',
    label: 'Ready',
    message: 'Your assistant runtime is ready.',
    estimatedAt: 160,
  },
] as const;

const formatElapsed = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(
    2,
    '0',
  )}`;
};

const getElapsedSeconds = (startedAt?: string, now = Date.now()) => {
  if (!startedAt) {
    return 0;
  }

  const timestamp = new Date(startedAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  return Math.max(0, Math.floor((now - timestamp) / 1000));
};

const getEstimatedStageIndex = (elapsedSeconds: number) => {
  let index = 0;

  for (let i = 0; i < STEPS.length; i += 1) {
    if (elapsedSeconds >= STEPS[i].estimatedAt) {
      index = i;
    }
  }

  return Math.min(index, STEPS.length - 2);
};

const getStageIndex = ({
  status,
  stage,
  elapsedSeconds,
}: {
  status: ProvisioningStatus;
  stage?: string;
  elapsedSeconds: number;
}) => {
  if (status === SERVER_STATUSES.APPROVED) {
    return STEPS.length - 1;
  }

  if (status === SERVER_STATUSES.FAILED) {
    const failedIndex = STEPS.findIndex((step) => step.stage === stage);
    return failedIndex >= 0 ? failedIndex : 0;
  }

  const stageIndex = STEPS.findIndex((step) => step.stage === stage);
  const estimatedIndex = getEstimatedStageIndex(elapsedSeconds);

  if (stageIndex < 0) {
    return estimatedIndex;
  }

  return Math.max(stageIndex, estimatedIndex);
};

const getStepState = (
  index: number,
  activeIndex: number,
  status: ProvisioningStatus,
): StepState => {
  if (status === SERVER_STATUSES.FAILED && index === activeIndex) {
    return 'failed';
  }

  if (index < activeIndex || status === SERVER_STATUSES.APPROVED) {
    return 'completed';
  }

  if (index === activeIndex) {
    return 'active';
  }

  return 'pending';
};

const stepIcon = (state: StepState) => {
  if (state === 'completed') {
    return <IconCheck className="size-3.5" />;
  }

  if (state === 'failed') {
    return <IconAlertTriangle className="size-3.5" />;
  }

  if (state === 'active') {
    return <IconLoader2 className="size-3.5 animate-spin" />;
  }

  return <span className="size-2 rounded-full bg-muted-foreground/40" />;
};

export const ManagedProvisioningProgress = ({
  status,
  stage,
  message,
  startedAt,
  error,
  runtimeUrl,
  onRetry,
  retrying,
}: ManagedProvisioningProgressProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (
      status === SERVER_STATUSES.APPROVED ||
      status === SERVER_STATUSES.FAILED
    ) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const elapsedSeconds = getElapsedSeconds(startedAt, now);
  const activeIndex = getStageIndex({ status, stage, elapsedSeconds });
  const activeStep = STEPS[activeIndex] || STEPS[0];
  const isEstimated =
    status !== SERVER_STATUSES.APPROVED &&
    status !== SERVER_STATUSES.FAILED &&
    (!stage || activeStep.stage !== stage);
  const progressPercent = useMemo(() => {
    if (status === SERVER_STATUSES.APPROVED) {
      return 100;
    }

    if (status === SERVER_STATUSES.FAILED) {
      return Math.max(8, (activeIndex / (STEPS.length - 1)) * 100);
    }

    return Math.max(8, (activeIndex / (STEPS.length - 1)) * 100);
  }, [activeIndex, status]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">
          {status === SERVER_STATUSES.FAILED
            ? 'Provisioning failed'
            : status === SERVER_STATUSES.APPROVED
            ? 'Assistant runtime ready'
            : 'Creating your AI assistant runtime'}
        </h3>
        <p className="text-xs text-muted-foreground">
          This usually takes 2-4 minutes for a new server.
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              status === SERVER_STATUSES.FAILED ? 'bg-destructive' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Elapsed time: {formatElapsed(elapsedSeconds)}</span>
          <span>Estimated time: 2-4 minutes</span>
        </div>
      </div>

      <Alert
        variant={
          status === SERVER_STATUSES.FAILED
            ? 'destructive'
            : elapsedSeconds > 300
            ? 'warning'
            : 'default'
        }
      >
        <Alert.Title>
          {status === SERVER_STATUSES.FAILED
            ? 'Provisioning failed'
            : activeStep.label}
        </Alert.Title>
        <Alert.Description>
          {status === SERVER_STATUSES.FAILED
            ? error ||
              'The runtime could not be prepared. You can retry provisioning. If this keeps happening, check the deployer logs.'
            : message || activeStep.message}
          {isEstimated ? ' Estimated progress is shown while provisioning runs.' : ''}
        </Alert.Description>
      </Alert>

      {elapsedSeconds > 180 && status === SERVER_STATUSES.PENDING && (
        <p className="text-xs text-muted-foreground">
          Still working. Fresh servers can take a few minutes while packages and
          OpenClaw are installed.
        </p>
      )}

      {elapsedSeconds > 300 && status === SERVER_STATUSES.PENDING && (
        <p className="text-xs font-medium text-amber-700">
          This is taking longer than expected. You can keep this page open or
          check logs. Do not create another assistant.
        </p>
      )}

      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const state = getStepState(index, activeIndex, status);

          return (
            <div key={step.stage} className="flex gap-3">
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                  state === 'completed'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : state === 'failed'
                    ? 'border-destructive bg-destructive text-destructive-foreground'
                    : state === 'active'
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {stepIcon(state)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{step.label}</div>
                <div className="text-xs text-muted-foreground">
                  {step.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {status === SERVER_STATUSES.FAILED && onRetry && (
          <Button
            type="button"
            variant="outline"
            disabled={retrying}
            onClick={onRetry}
            className="gap-2"
          >
            {retrying && <IconRefresh className="size-4 animate-spin" />}
            Retry provisioning
          </Button>
        )}
        {status === SERVER_STATUSES.APPROVED && runtimeUrl && (
          <Button asChild variant="outline" className="gap-2">
            <a href={runtimeUrl} target="_blank" rel="noreferrer">
              <IconExternalLink className="size-4" />
              Open runtime
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
