import { Separator, Sheet } from 'erxes-ui';

export const ContractPrintPreview = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Sheet>
      {children}
      <Sheet.View className="blk:sm:max-w-4xl blk:md:w-[calc(100vw-(--spacing(4)))] flex-row">
        <div className="flex-auto p-4 ">
          <div className="bg-background p-4 shadow-sm"></div>
        </div>
        <Separator orientation="vertical" />
        <div className="flex-none w-1/3 bg-background relative">
          <div className="p-4">hi</div>
          <Sheet.Close className="absolute top-4 right-4" />
        </div>
      </Sheet.View>
    </Sheet>
  );
};
