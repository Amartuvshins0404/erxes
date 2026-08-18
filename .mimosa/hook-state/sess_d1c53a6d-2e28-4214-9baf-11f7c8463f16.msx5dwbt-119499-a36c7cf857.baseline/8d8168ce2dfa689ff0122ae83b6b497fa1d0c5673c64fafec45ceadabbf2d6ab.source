import {
  Input,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  Spinner,
  Tooltip,
} from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useEffect, useState } from 'react';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { useGeneralForm } from '../hooks/useGeneralForm';

export const AgencyProfileDetailHeader = () => {
  const { agencyInfo, loading } = useAgencyInfo();

  if (loading) return <Spinner containerClassName="py-12" />;

  return (
    <div className="flex border-b">
      <div className="p-8 space-y-3">
        <div className="flex items-center gap-3">
          <AgencyDetailName name={agencyInfo?.name || ''} />
        </div>
      </div>
    </div>
  );
};

export const AgencyDetailName = ({ name }: { name: string }) => {
  const [nameValue, setNameValue] = useState(name);

  const { form } = useGeneralForm({});
  const { updateAgency } = useUpdateAgency();

  useEffect(() => {
    if (name) {
      setNameValue(name);
    }
  }, [name]);

  return (
    <PopoverScoped
      closeOnEnter
      onOpenChange={(open) => {
        if (!open && nameValue !== name) {
          updateAgency({
            variables: { input: { name: nameValue } },
            onCompleted: (data) => {
              form.reset({
                name: data.updateAgency.name,
              });
            },
          });
        }
      }}
    >
      <Tooltip.Provider delayDuration={0}>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <h1 className="text-xl font-medium leading-none hover:bg-accent">
                {name}
              </h1>
            </Popover.Trigger>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p>Вэб дээр харагдах албан нэр</p>
          </Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
      <RecordTableInlineCell.Content sideOffset={-24}>
        <Input
          placeholder="Төслийн нэрийг оруулна уу"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};
