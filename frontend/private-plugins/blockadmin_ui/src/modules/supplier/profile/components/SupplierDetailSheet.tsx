import {
  Badge,
  BlockEditorReadOnly,
  Button,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Spinner,
  Table,
  useQueryState,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useSupplierDetail } from '../hooks/useSupplierDetail';
import { ISupplier } from '../types';
import { SupplierVerificationAction } from './SupplierVerificationAction';

const verificationVariant = (status?: string) => {
  if (status === 'verified') return 'success' as const;
  if (status === 'unverified') return 'destructive' as const;
  return 'secondary' as const;
};

const Row = ({
  label,
  value,
  html
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
  html?: boolean;
}) => (
  <Table.Row>
    <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
      {label}
    </Table.Cell>
    <Table.Cell className="p-2 h-auto min-h-10 whitespace-normal">
      {html ? <BlockEditorReadOnly content={value as string} /> : value ?? '-'}
    </Table.Cell>
  </Table.Row>
);

const SupplierInfo = ({ supplier }: { supplier: ISupplier }) => {
  const { t } = useTranslation('blockadmin');
  const {
    _id,
    name,
    code,
    description,
    about,
    logo,
    coverImage,
    registrationNumber,
    industry,
    dateFounded,
    website,
    primaryEmail,
    primaryPhone,
    emails = [],
    phones = [],
    verificationStatus,
    address,
    createdAt,
    updatedAt,
    socialLinks = {},
  } = supplier || {};

  const { details = {} } = address || {};
  const { __typename, ...socialLinksWithoutTypename } =
    (socialLinks as Record<string, string>) || {};

  const cityDistrict = [details?.city, details?.city_district]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex flex-col gap-4 p-4">
      {(logo || coverImage) && (
        <div className="relative">
          {coverImage && (
            <img
              src={coverImage}
              alt="Cover"
              className="rounded-lg w-full h-32 object-cover"
            />
          )}
          {logo && (
            <div
              className={
                coverImage ? 'absolute top-1/2 left-4 -translate-y-1/2' : ''
              }
            >
              <img
                src={logo}
                alt={name}
                className="border-2 border-background rounded-lg w-16 h-16 object-cover"
              />
            </div>
          )}
        </div>
      )}

      <InfoCard title={t('General')}>
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              <Row label={t('Name')} value={name} />
              <Row label={t('Code')} value={code} />
              <Row label={t('Registration #')} value={registrationNumber} />
              <Row label={t('Industry')} value={industry} />
              <Row label={t('Founded')} value={dateFounded} />
              <Row label={t('Website')} value={website} />
              <Row label={t('Primary Email')} value={primaryEmail} />
              <Row label={t('Primary Phone')} value={primaryPhone} />
              {emails.length > 0 && (
                <Row label={t('Emails')} value={emails.join(', ')} />
              )}
              {phones.length > 0 && (
                <Row label={t('Phones')} value={phones.join(', ')} />
              )}
              <Row label={t('City')} value={cityDistrict || details?.city} />
              <Row label={t('Address')} value={address?.short} />
              <Table.Row>
                <Table.Cell className="bg-sidebar p-2 w-40 h-auto min-h-10 text-muted-foreground">
                  {t('Verification')}
                </Table.Cell>
                <Table.Cell className="p-1 px-2 h-auto min-h-10 whitespace-normal">
                  <SupplierVerificationAction
                    supplierId={_id}
                    status={verificationStatus}
                  >
                    <Badge variant={verificationVariant(verificationStatus)}>
                      {verificationStatus || 'unverified'}
                    </Badge>
                  </SupplierVerificationAction>
                </Table.Cell>
              </Table.Row>
              <Row
                label={t('Created')}
                value={
                  createdAt
                    ? new Date(createdAt).toLocaleDateString()
                    : undefined
                }
              />
              <Row
                label={t('Updated')}
                value={
                  updatedAt
                    ? new Date(updatedAt).toLocaleDateString()
                    : undefined
                }
              />
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      {(description || about) && (
        <InfoCard title={t('About')}>
          <InfoCard.Content className="shadow-none p-0 overflow-hidden">
            <Table>
              <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                {description && (
                  <Row label={t('Description')} value={description} />
                )}
                {about && <Row label={t('About')} value={about} html/>}
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>
      )}

      {Object.values(socialLinksWithoutTypename).some(Boolean) && (
        <InfoCard title={t('Social Links')}>
          <InfoCard.Content className="shadow-none p-0 overflow-hidden">
            <Table>
              <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
                {(
                  [
                    'facebook',
                    'instagram',
                    'twitter',
                    'linkedin',
                    'youtube',
                    'website',
                  ] as const
                ).map((key) =>
                  socialLinksWithoutTypename[key] ? (
                    <Row
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={socialLinksWithoutTypename[key]}
                    />
                  ) : null,
                )}
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>
      )}
    </div>
  );
};

export const SupplierDetailSheet = () => {
  const { t } = useTranslation('blockadmin');
  const [activeSupplierId, setActiveSupplierId] =
    useQueryState<string>('activeSupplierId');
  const { supplier, loading } = useSupplierDetail(activeSupplierId);

  return (
    <FocusSheet
      open={!!activeSupplierId}
      onOpenChange={() => setActiveSupplierId(null)}
    >
      <FocusSheet.View className="w-[50%] md:w-[50%]">
        <FocusSheet.Header title={supplier?.name || t('Supplier Detail')} />
        <FocusSheet.Content className="flex flex-col flex-auto min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            {loading && (
              <div className="p-4">
                <Spinner />
              </div>
            )}
            {!loading && supplier && <SupplierInfo supplier={supplier} />}
            {!loading && !supplier && (
              <div className="p-4">{t('Supplier not found')}</div>
            )}
          </ScrollArea>

          <Sheet.Footer className="flex-none border-t">
            <Sheet.Close asChild>
              <Button variant="secondary" className="bg-border">
                {t('Close')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FocusSheet.Content>
      </FocusSheet.View>
    </FocusSheet>
  );
};
