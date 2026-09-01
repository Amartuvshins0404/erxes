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
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState(name);

  const { updateAgency } = useUpdateAgency();

  // While the popover is open the input owns the value. Syncing from the query
  // mid-edit would drop every character typed since the request went out.
  useEffect(() => {
    if (!open) {
      setNameValue(name);
    }
  }, [name, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    const nextName = nameValue.trim();

    if (!nextName || nextName === name) {
      setNameValue(name);
      return;
    }

    updateAgency({ variables: { input: { name: nextName } } });
  };

  return (
    <PopoverScoped
      closeOnEnter
      open={open}
      onOpenChange={handleOpenChange}
      dependencies={[nameValue, name]}
    >
      <Tooltip.Provider delayDuration={0}>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <h1 className="text-xl font-medium leading-none hover:bg-accent">
                {name || (
                  <span className="text-accent-foreground/70">
                    Нэр оруулаагүй
                  </span>
                )}
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
