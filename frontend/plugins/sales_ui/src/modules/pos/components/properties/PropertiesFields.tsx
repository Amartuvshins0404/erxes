import {
  Input,
  Form,
  Checkbox,
  MultipleSelector,
  Textarea,
} from 'erxes-ui';
import { SelectBrand, SelectStructureEntities } from 'ui-modules';
import { Control } from 'react-hook-form';
import { ALLOW_TYPES } from '@/pos/constants';
import { useTranslation } from 'react-i18next';
import { STOCK_PLACE_CAPABILITY } from '@/constants/structure';

export interface FormData {
  name: string;
  description: string;
  type: string;
  maxSkipNumber: string;
  orderPassword: string;
  placeEntityId: string;
  responsibleEntityId: string;
  allowPlaceEntityIds: string[];
  brandId: string;
  allowTypes: string[];
  isOnline: boolean;
  onServer: boolean;
  pdomain: string;
  beginNumber: string;
}

export interface FieldProps {
  control: Control<FormData>;
}

export const NameField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="name"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control>
            <Input type="text" placeholder={t('pos-name-placeholder')} {...field} />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};

export const DescriptionField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="description"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('description')}</Form.Label>
          <Form.Control>
            <Textarea placeholder={t('description')} {...field} />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};

export const MaxSkipNumberField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="maxSkipNumber"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('max-skip-number')}</Form.Label>
          <Form.Control>
            <Input type="number" placeholder={t('max-skip-number')} {...field} />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};

export const OrderPasswordField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="orderPassword"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('order-password')}</Form.Label>
          <Form.Control>
            <Input type="text" placeholder={t('order-password')} {...field} />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};

export const PlaceEntityField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="placeEntityId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('place', 'Place')}</Form.Label>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="single"
              capability={STOCK_PLACE_CAPABILITY}
              value={field.value ?? ''}
              onValueChange={(placeEntityId) =>
                field.onChange(typeof placeEntityId === 'string' ? placeEntityId : '')
              }
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const ResponsibleEntityField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="responsibleEntityId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('responsible', 'Responsible')}</Form.Label>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="single"
              value={field.value ?? ''}
              onValueChange={(responsibleEntityId) =>
                field.onChange(
                  typeof responsibleEntityId === 'string'
                    ? responsibleEntityId
                    : '',
                )
              }
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const BrandField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="brandId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('brand')}</Form.Label>
          <Form.Control>
            <SelectBrand.FormItem
              mode="single"
              value={field.value ?? ''}
              onValueChange={(brand) => field.onChange(brand)}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const OnServerField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="onServer"
      render={({ field }) => (
        <Form.Item>
          <div className="flex items-center pt-6 space-x-2">
            <Form.Control>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </Form.Control>
            <Form.Label>{t('on-server')}</Form.Label>
          </div>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const IsOnlineField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="isOnline"
      render={({ field }) => (
        <Form.Item>
          <div className="flex items-center pt-6 space-x-2">
            <Form.Control>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </Form.Control>
            <Form.Label>{t('is-online')}</Form.Label>
          </div>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const AllowPlaceEntitiesField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="allowPlaceEntityIds"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('allow-places', 'Allowed places')}</Form.Label>
          <Form.Description>
            {t('allow-places-description', 'Places whose stock this POS may use')}
          </Form.Description>
          <Form.Control>
            <SelectStructureEntities.FormItem
              mode="multiple"
              capability={STOCK_PLACE_CAPABILITY}
              value={field.value ?? []}
              onValueChange={(placeEntityIds) =>
                field.onChange(Array.isArray(placeEntityIds) ? placeEntityIds : [])
              }
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const PosDomainField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="pdomain"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('pos-domain')}</Form.Label>
          <Form.Control>
            <Input type="text" placeholder={t('pos-domain')} {...field} />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const BeginNumberField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="beginNumber"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('begin-number')}</Form.Label>
          <Form.Control>
            <Input type="number" placeholder={t('begin-number')} {...field} />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

export const AllowTypesField = ({ control }: FieldProps) => {
  const { t } = useTranslation('sales');
  return (
    <Form.Field
      control={control}
      name="allowTypes"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{t('allow-types')}</Form.Label>
          <Form.Control>
            <MultipleSelector
              value={field.value?.map((v: string) => ({
                value: v,
                label: ALLOW_TYPES.find((at) => at.value === v)?.label || v,
              }))}
              onChange={(options) => field.onChange(options.map((o) => o.value))}
              defaultOptions={ALLOW_TYPES.map((at) => ({
                value: at.value,
                label: at.label,
              }))}
              placeholder={t('select-allow-types')}
              hidePlaceholderWhenSelected
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};
