import { IconMail, IconPhone } from '@tabler/icons-react';
import { Badge, InfoCard, Label } from 'erxes-ui';
import { ReactNode } from 'react';
import { useAgencyDetail } from '../hooks/useAgencyDetail';

const ContactList = ({
  label,
  values,
  primary,
  href,
  icon,
  emptyLabel,
}: {
  label: string;
  values?: string[];
  primary?: string;
  href: (value: string) => string;
  icon: ReactNode;
  emptyLabel: string;
}) => {
  const items = Array.from(
    new Set([...(primary ? [primary] : []), ...(values ?? [])].filter(Boolean)),
  );

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((value) => (
            <li key={value} className="flex items-center gap-2">
              <span className="text-accent-foreground">{icon}</span>
              <a
                href={href(value)}
                className="text-sm font-medium hover:underline break-all"
              >
                {value}
              </a>
              {value === primary && <Badge variant="secondary">Primary</Badge>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
};

export const AgencyDetailContact = () => {
  const { agency } = useAgencyDetail();

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Contact info"
        description="Phone numbers and email addresses submitted by the agency"
      >
        <InfoCard.Content className="grid grid-cols-2 gap-6">
          <ContactList
            label="Phones"
            values={agency?.phones}
            primary={agency?.primaryPhone}
            href={(value) => `tel:${value}`}
            icon={<IconPhone className="size-4" />}
            emptyLabel="No phone number submitted"
          />
          <ContactList
            label="Emails"
            values={agency?.emails}
            primary={agency?.primaryEmail}
            href={(value) => `mailto:${value}`}
            icon={<IconMail className="size-4" />}
            emptyLabel="No email address submitted"
          />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
