import {
  Badge,
  BlockEditorReadOnly,
  Button,
  Card,
  InfoCard,
  Separator,
} from 'erxes-ui';
import { AgencyRejectionReasons } from '../types/dashboard';
import { REJECTION_REASONS } from '../constants/dashboard';
import { Icon123 } from '@tabler/icons-react';
import { Link } from 'react-router';

type Props = {
  rejectionReasons?: AgencyRejectionReasons[];
  rejectionNotes?: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified' | undefined;
};

export const AgencyVerificationWindow = ({
  rejectionNotes,
  rejectionReasons,
  verificationStatus,
}: Props) => {
  if (verificationStatus === 'verified') return null;
  return (
    <InfoCard
      title="Verification status window"
      description="These notes are required to verify your profile."
    >
      <InfoCard.Content>
        {rejectionReasons && (
          <Card className="">
            <Card.Title className="py-2 px-4">Instructions</Card.Title>
            <Card.Content className="py-2">
              <dl className="list-disc list-inside text-xs text-muted-foreground text-left space-y-3">
                {rejectionReasons.map((reason) => {
                  const match = REJECTION_REASONS.find((r) => r.key === reason);
                  const IconComponent = match?.icon || Icon123;
                  return (
                    <div key={reason} className="flex flex-col gap-1">
                      <dt>
                        <Badge variant={'info'}>
                          <IconComponent className="size-4" />
                          {match?.title}
                        </Badge>
                      </dt>
                      <dd className="pl-4">{match?.detail}</dd>
                    </div>
                  );
                })}
              </dl>
            </Card.Content>
            <Separator />
            <Card.Footer className="py-2 text-xs text-accent-foreground">
              ** These notes are required to verify your profile. **
            </Card.Footer>
          </Card>
        )}
        {rejectionNotes && (
          <Card className="py-2 px-4">
            <Card.Title>Notes</Card.Title>
            <Card.Content className="py-2">
              <BlockEditorReadOnly content={rejectionNotes} />
            </Card.Content>
          </Card>
        )}
        <div className="ml-auto space-x-2">
          <Link to="/blockagency/agency-profile">
            <Button>Edit Profile</Button>
          </Link>
          <Button variant={'link'}>Contact support</Button>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
