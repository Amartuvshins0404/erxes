import {
  IconChevronDown,
  IconFileSpreadsheet,
  IconMinus,
  IconPercentage,
  IconPlus,
  IconPrinter,
} from '@tabler/icons-react';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Popover,
  ScrollArea,
  Separator,
  Toggle,
} from 'erxes-ui/components';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useQueryState } from 'erxes-ui/hooks/use-query-state';
import { PageContainer } from 'erxes-ui/modules/layout';
import { printSettingsAtom } from '../states/reportSettingsState';

export const ReportPageContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [inPreview, setInPreview] = useQueryState<boolean>('inPreview');
  const [{ printsize, showTableLayoutOnEveryPage }, setPrintSettings] =
    useAtom(printSettingsAtom);
  useEffect(() => {
    if (!inPreview) {
      setInPreview(true);
    }
  }, []);

  const printsizeToFontSize = (size: number) => {
    const margin = (100 - size) / 10;

    return `${12 - margin}px`;
  };

  const handlePrintsizeChange = (size: number) => {
    if (size < 60) {
      return;
    }

    if (size > 160) {
      return;
    }

    setPrintSettings((prev) => ({ ...prev, printsize: size }));
  };

  return (
    <PageContainer className="h-dvh print:h-auto print:block">
      <header className="flex items-center justify-between h-12 px-4 box-border shrink-0 bg-sidebar overflow-auto styled-scroll print:hidden">
        <div className="flex items-center gap-2 flex-none pr-8">
          <span className="px-1 text-sm font-medium">Report</span>
          <Separator.Inline />
          <Toggle pressed={!!inPreview} onPressedChange={setInPreview}>
            {inPreview ? 'hide sidebar' : 'show sidebar'}
          </Toggle>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => handlePrintsizeChange(printsize - 10)}
          >
            <IconMinus />
          </Button>
          <div className="relative">
            <Input
              className="w-20 rounded-full pr-7 text-center"
              value={printsize}
              readOnly
            />
            <IconPercentage className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => handlePrintsizeChange(printsize + 10)}
          >
            <IconPlus />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full">
            <IconFileSpreadsheet />
            Export to excel
          </Button>
          <div className="inline-flex items-center rounded-full shadow-button-outline">
            <Button
              onClick={() => window.print()}
              variant="ghost"
              className="rounded-l-full rounded-r-none"
            >
              <IconPrinter />
              Print
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Popover>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-l-none rounded-r-full"
                >
                  <IconChevronDown />
                </Button>
              </Popover.Trigger>
              <Popover.Content className="rounded-2xl">
                <Label variant="peer" className="font-medium">
                  Print settings
                </Label>
                <div className="flex flex-col gap-2 pt-4 pb-2">
                  <Label className="text-xs text-muted-foreground">Table</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="show-table-header-on-every-page"
                      checked={showTableLayoutOnEveryPage}
                      onCheckedChange={(value) =>
                        setPrintSettings((prev) => ({
                          ...prev,
                          showTableLayoutOnEveryPage: !!value,
                        }))
                      }
                    />
                    <Label
                      variant="peer"
                      htmlFor="show-table-header-on-every-page"
                    >
                      Show table layout on every page
                    </Label>
                  </div>
                </div>
              </Popover.Content>
            </Popover>
          </div>
        </div>
      </header>
      <Separator />
      <ReportStyle />
      <ScrollArea className="bg-sidebar flex-auto">
        <div
          className="m-6 mx-auto max-w-5xl rounded-3xl bg-card p-8 pl-15 shadow-card print:rounded-none print:shadow-none"
          style={{ fontSize: printsizeToFontSize(printsize) }}
        >
          {children}
        </div>
      </ScrollArea>
    </PageContainer>
  );
};

export const ReportStyle = () => {
  return (
    <style>
      {`
        @page {
          margin: 0;
          background: white;
          margin-top: 5mm; 
        }
  
        
        table { page-break-after: auto; }
        table tr { page-break-inside: avoid; page-break-after: auto; }
        table td { page-break-inside: avoid; page-break-after: auto; }
        
      `}
    </style>
  );
};
