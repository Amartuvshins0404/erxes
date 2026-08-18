import { useQuery } from '@apollo/client';
import { useDebounce } from 'use-debounce';
import { useState, useEffect } from 'react';
import { Combobox, Command, Form, Popover } from 'erxes-ui';
import { GET_COMPANIES_LIST } from '../graphql/companyQueries';

export interface CompanyOption {
  _id: string;
  primaryName?: string;
}

interface SelectCompanyProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  valueLabel?: string;
}

export function SelectCompany({
  value,
  onValueChange,
  placeholder = 'Select company',
  disabled,
  valueLabel,
}: SelectCompanyProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  const { data, loading, error } = useQuery(GET_COMPANIES_LIST, {
    variables: {
      searchValue: debouncedSearch || undefined,
      limit: 50,
    },
    skip: !open,
  });

  const companies: CompanyOption[] = data?.companies?.list ?? [];
  const selectedFromList = companies.find((c) => c._id === value);

  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
    } else if (selectedFromList?.primaryName) {
      setSelectedLabel(selectedFromList.primaryName);
    } else if (valueLabel) {
      setSelectedLabel(valueLabel);
    } else {
      setSelectedLabel((prev) => prev || value);
    }
  }, [value, valueLabel, selectedFromList?.primaryName, selectedFromList?._id]);

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger
        className="w-full"
        variant="outline"
        disabled={disabled}
      >
        <Combobox.Value
          placeholder={placeholder}
          value={selectedLabel || undefined}
        />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search companies..."
          />
          <Command.List className="max-h-[300px] overflow-y-auto">
            <Combobox.Empty loading={loading} error={error ?? undefined} />
            {!loading &&
              companies.map((company) => (
                <Command.Item
                  key={company._id}
                  value={company._id}
                  onSelect={() => {
                    onValueChange(company._id);
                    setSelectedLabel(company.primaryName ?? company._id);
                    setOpen(false);
                  }}
                >
                  {company.primaryName || company._id}
                  <Combobox.Check checked={value === company._id} />
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
}

interface SelectCompanyFormItemProps extends SelectCompanyProps {
  label?: string;
  name: string;
  control: React.ComponentProps<typeof Form.Field>['control'];
}

export function SelectCompanyFormItem({
  name,
  control,
  label = 'Company',
  placeholder,
  disabled,
}: SelectCompanyFormItemProps) {
  return (
    <Form.Field
      control={control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          {label && <Form.Label>{label}</Form.Label>}
          <Form.Control>
            <SelectCompany
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
            />
          </Form.Control>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
}
