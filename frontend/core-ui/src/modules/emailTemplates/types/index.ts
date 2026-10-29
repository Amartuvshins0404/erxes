import type { JSONContent } from 'erxes-ui';
import type { EmailTemplate, EmailTemplateContentFormat } from 'ui-modules';
export { emailTemplateFormat } from 'ui-modules';
import { IUser } from 'ui-modules';

export type TEmailContentFormat = EmailTemplateContentFormat;

export interface IEmailTemplate extends EmailTemplate {
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  createdUser?: IUser;
}

export type TEmailTemplateInput = {
  name: string;
  description?: string;
  content?: string;
  contentJson?: JSONContent;
  contentFormat?: TEmailContentFormat;
};
