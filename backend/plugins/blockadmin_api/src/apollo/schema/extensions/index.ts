import { cpUser as cpUserExtension } from './cpUser';
import { developer as developerExtension } from './developer';
import { extension } from './extension';
import { project as projectExtension } from './project';

export const TypeExtensions = `
    enum BlockAdminAgencyVerificationStatusEnum {
        verified
        unverified
    }

    enum BlockAdminDeveloperVerificationStatus {
        verified
        unverified
        pending
    }

    enum BlockAdminDeveloperVerificationStatusEnum {
        verified
        unverified
    }

    ${extension}
    ${projectExtension}
    ${developerExtension}
    ${cpUserExtension}
`;
