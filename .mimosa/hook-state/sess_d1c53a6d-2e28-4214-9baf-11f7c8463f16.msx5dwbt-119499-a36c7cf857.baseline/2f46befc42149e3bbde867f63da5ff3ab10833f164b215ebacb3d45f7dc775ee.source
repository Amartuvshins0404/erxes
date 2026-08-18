import { InfoCard, InfoCardContent } from '@/block/components/card';
import { BANKS } from '@/project/constants/banks';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '@/project/hooks/useUpdateProject';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Label, Select } from 'erxes-ui';
import { useEffect, useState } from 'react';

export const ProjectBankPartners = () => {
  const { project } = useProjectDetail();
  const [bankPartners, setBankPartners] = useState(project?.bankPartners);
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  useEffect(() => {
    if (project?.bankPartners) {
      setBankPartners(project?.bankPartners);
    }
  }, [project?.bankPartners]);

  const handleUpdateBankPartners = (bankPartners: string[]) => {
    setBankPartners(bankPartners);
    updateProjectGeneralInfo(project?._id || '', { bankPartners });
  };

  return (
    <InfoCard title="BANK PARTNERS" description="Bank partners">
      <InfoCardContent className='space-y-3'>
        <div className='space-y-2'>
          {bankPartners?.map((bankPartner, index) => (
            <div className="flex gap-2" key={bankPartner || index}>
              <Select
                value={bankPartner}
                onValueChange={(value) =>
                  handleUpdateBankPartners(
                    bankPartners.map((bank, i) => (i === index ? value : bank)),
                  )
                }
              >
                <Select.Trigger className="h-8">
                  <Select.Value placeholder="Select bank partners" />
                </Select.Trigger>
                <Select.Content>
                  {BANKS.filter(
                    (bank) =>
                      !bankPartners.includes(bank.short) ||
                      bankPartner === bank.short,
                  ).map((bank) => (
                    <Select.Item value={bank.short}>{bank.name}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Button
                variant="secondary"
                size="icon"
                className="flex-none size-8 text-destructive bg-destructive/10 hover:bg-destructive/20"
                onClick={() =>
                  setBankPartners(bankPartners.filter((_, i) => i !== index))
                }
              >
                <IconTrash />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => setBankPartners([...(bankPartners || []), ''])}
        >
          <IconPlus />
          Add bank
        </Button>
      </InfoCardContent>
    </InfoCard>
  );
};
