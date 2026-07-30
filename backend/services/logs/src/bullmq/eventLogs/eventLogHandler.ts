import { ILogDocument } from 'erxes-api-shared/core-types';
import { generateModels } from '~/connectionResolvers';
import { IJobData } from '~/types';
import { handleMongoChangeEvent } from '../mongo';
import { handleAfterProcess } from '../afterProcess';
import { AFTER_PROCESS_CONSTANTS } from '~/constants';
import {
  LOG_STATUSES,
  sanitizeLogDocument,
  sanitizeLogTransportDocument,
} from 'erxes-api-shared/utils';

export const eventLogHandler = async (
  jobId: string | undefined,
  data: IJobData,
) => {
  const transportData = sanitizeLogTransportDocument(data);
  const sanitizedData = sanitizeLogDocument(transportData);
  const {
    subdomain,
    source,
    payload,
    contentType,
    userId,
    action,
    status,
    processId,
  } = sanitizedData;

  try {
    const models = await generateModels(subdomain);

    let result: ILogDocument | ILogDocument[];

    if (source === 'mongo') {
      result = await handleMongoChangeEvent(models.Logs, sanitizedData);
    } else {
      const logDoc = {
        source,
        action,
        payload,
        createdAt: new Date(),
        userId,
        status,
        processId,
        contentType,
      };
      result = await models.Logs.insertOne(logDoc);
    }

    const afterProcessPayload =
      typeof transportData.payload === 'object' &&
      transportData.payload !== null &&
      !Array.isArray(transportData.payload)
        ? transportData.payload
        : {};

    if (status === 'success') {
      const resultDoc = Array.isArray(result) ? result[0] : result;

      handleAfterProcess(subdomain, {
        source,
        action: resultDoc?.action || action,
        contentType,
        payload: { ...afterProcessPayload, userId, processId },
      }).catch((error: unknown) => {
        models.Logs.insertOne({
          source: 'afterProcess',
          action: AFTER_PROCESS_CONSTANTS[`${source}.${action}`],
          payload: { ...resultDoc?.payload, userId },
          createdAt: new Date(),
          userId,
          status: LOG_STATUSES.FAILED,
          processId,
        });
        console.error(
          `Error occurred during afterProcess job ${jobId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }
  } catch (error: unknown) {
    console.error(
      `Error processing job ${jobId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};
