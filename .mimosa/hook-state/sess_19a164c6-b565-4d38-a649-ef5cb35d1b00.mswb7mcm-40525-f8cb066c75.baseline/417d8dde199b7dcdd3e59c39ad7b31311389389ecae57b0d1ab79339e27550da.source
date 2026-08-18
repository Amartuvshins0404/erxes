import { Separator, Sheet } from 'erxes-ui';
import { useAtom } from 'jotai';
import { contractDetailSheetState } from '../states/contractDetailSheetState';
import { format } from 'date-fns';
import { SelectContractType } from './SelectContractType';
import { SelectContractLabel } from './SelectContractLabel';

export const ContractDetail = () => {
  const [contract, setContract] = useAtom(contractDetailSheetState);

  return (
    <Sheet open={!!contract} onOpenChange={() => setContract(null)}>
      <Sheet.View className="w-full sm:max-w-5xl">
        <Sheet.Header>
          <div className="flex gap-2 items-center">
            <Sheet.Title className="capitalize">
              #{contract?.number}
            </Sheet.Title>
            <Sheet.Description>
              {contract?.createdAt
                ? format(new Date(contract.createdAt), 'MMM dd, yyyy')
                : ''}
              {' - '}
              {contract?.updatedAt
                ? format(new Date(contract.updatedAt), 'MMM dd, yyyy')
                : ''}
            </Sheet.Description>
            <SelectContractType />
          </div>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content>
          <div className="p-6 grid grid-cols-3 gap-4">
            <SelectContractLabel />
          </div>
          <Separator />
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
};
