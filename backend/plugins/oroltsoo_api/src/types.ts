import { Request, Response } from 'express';

export interface IWebhookRequest<T> extends Request {
  body: {
    subdomain: string;
    payload: {
      entityId: string;
      data?: {
        input: T;
      };
    };
  };
}

export type IWebhookResponse = Response;
