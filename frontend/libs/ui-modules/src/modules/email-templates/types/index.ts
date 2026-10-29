import type { JSONContent } from 'erxes-ui';

export type EmailTemplateContentFormat = 'blocks' | 'maily';

export interface EmailTemplate {
  _id: string;
  name: string;
  description?: string;
  content?: string;
  contentJson?: JSONContent;
  contentFormat?: EmailTemplateContentFormat;
}

export const emailTemplateFormat = (
  template?: Pick<EmailTemplate, 'contentFormat' | 'contentJson'>,
): EmailTemplateContentFormat =>
  template?.contentFormat || (template?.contentJson ? 'maily' : 'blocks');
