import { IRelationWidgetProps } from 'ui-modules';
import { MtoCustomerWidgets } from './MtoCustomerWidgets';

const RelationWidget = (props: IRelationWidgetProps) => {
  const { module } = props;
  switch (module) {
    case 'mtocustomer':
      return <MtoCustomerWidgets {...props} />;
    default:
      return null;
  }
};

export default RelationWidget;
