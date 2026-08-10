const WEBSITE_DELIVERY_SUCCESS =
  'The website is ready in Preview and Files.';

const WEBSITE_DELIVERY_FAILURE =
  "I couldn't publish the website preview, so it is not visible in Preview or Files. Website publishing did not complete; correct the reported file or storage problem in a new turn.";

export const ensureWebsiteDeliveryReply = (params: {
  reply: string;
  publishAttempted: boolean;
  websiteArtifactCount?: number;
}): string => {
  if (!params.publishAttempted) return params.reply;
  if ((params.websiteArtifactCount ?? 0) > 0) {
    return WEBSITE_DELIVERY_SUCCESS;
  }
  return WEBSITE_DELIVERY_FAILURE;
};
