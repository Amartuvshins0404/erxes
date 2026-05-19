import { useMutation, useQuery } from '@apollo/client';
import { FocusSheet, IRelation, SideMenuContext, Spinner } from 'erxes-ui';
import {
  CompanyWidget,
  CustomerWidget,
  GET_RELATIONS_BY_ENTITY,
  IRelationModules,
  MANAGE_RELATIONS,
  WidgetAccessProp,
  useRelationWidget,
  usePermissionCheck,
} from 'ui-modules';

import {
  LEGACY_ROOT_CAR_CONTENT_TYPE,
  ROOT_CAR_CONTENT_TYPE,
} from '~/lib/constants';
import { CarDealsRelationPanel } from '~/components/cars/CarDealsRelationPanel';
import { ICompany, ICustomer } from '~/types/cars';

const RELATED_CONTENT_TYPE_BY_MODULE: Record<string, string> = {
  customer: 'core:customer',
  company: 'core:company',
  deals: 'sales:deal',
  tasks: 'operation:task',
};

const noop = () => undefined;

const resolveAccess = (
  access: WidgetAccessProp,
  moduleName: string,
): 'read' | 'write' => {
  if (typeof access === 'string') {
    return access;
  }

  return access[moduleName] ?? 'write';
};

const useCompatibleCarContentType = (
  carId: string,
  relatedContentType?: string,
) => {
  const shouldCheckLegacy = !!relatedContentType;

  const rootRelations = useQuery<{ getRelationsByEntity: IRelation[] }>(
    GET_RELATIONS_BY_ENTITY,
    {
      variables: {
        contentId: carId,
        contentType: ROOT_CAR_CONTENT_TYPE,
        relatedContentType,
      },
      skip: !shouldCheckLegacy,
      fetchPolicy: 'cache-and-network',
    },
  );

  const legacyRelations = useQuery<{ getRelationsByEntity: IRelation[] }>(
    GET_RELATIONS_BY_ENTITY,
    {
      variables: {
        contentId: carId,
        contentType: LEGACY_ROOT_CAR_CONTENT_TYPE,
        relatedContentType,
      },
      skip: !shouldCheckLegacy,
      fetchPolicy: 'cache-and-network',
    },
  );

  if (!shouldCheckLegacy) {
    return { contentType: ROOT_CAR_CONTENT_TYPE, loading: false };
  }

  const loading = rootRelations.loading || legacyRelations.loading;
  const rootCount = rootRelations.data?.getRelationsByEntity?.length || 0;
  const legacyCount = legacyRelations.data?.getRelationsByEntity?.length || 0;
  const hasLegacyRelations = legacyCount > 0;

  return {
    contentType:
      rootCount === 0 && legacyCount > 0
        ? LEGACY_ROOT_CAR_CONTENT_TYPE
        : ROOT_CAR_CONTENT_TYPE,
    hasLegacyRelations,
    loading,
  };
};

const CarRelationWidgetSideContent = ({
  access,
  carId,
  companies,
  customers,
  module,
  onRelationsChange,
  RelationWidget,
}: {
  access: WidgetAccessProp;
  carId: string;
  companies: ICompany[];
  customers: ICustomer[];
  module: IRelationModules;
  onRelationsChange?: () => void;
  RelationWidget: ReturnType<typeof useRelationWidget>['RelationWidget'];
}) => {
  const [manageRelations] = useMutation(MANAGE_RELATIONS);
  const accessLevel = resolveAccess(access, module.name);
  const canManageRelations = accessLevel === 'write';
  const relatedContentType = RELATED_CONTENT_TYPE_BY_MODULE[module.name];
  const { contentType, hasLegacyRelations, loading } =
    useCompatibleCarContentType(carId, relatedContentType);

  const manageContactRelations = async (
    relatedContentType: 'core:customer' | 'core:company',
    relatedContentIds: string[],
  ) => {
    await manageRelations({
      variables: {
        contentType: ROOT_CAR_CONTENT_TYPE,
        contentId: carId,
        relatedContentType,
        relatedContentIds,
      },
    });

    if (hasLegacyRelations) {
      await manageRelations({
        variables: {
          contentType: LEGACY_ROOT_CAR_CONTENT_TYPE,
          contentId: carId,
          relatedContentType,
          relatedContentIds: [],
        },
      });
    }

    onRelationsChange?.();
  };

  const handleSelectCustomers = async (customerIds: string[]) => {
    await manageContactRelations('core:customer', customerIds);
  };

  const handleSelectCompanies = async (companyIds: string[]) => {
    await manageContactRelations('core:company', companyIds);
  };

  const customerIds = customers.map((customer) => customer._id);
  const companyIds = companies.map((company) => company._id);

  return (
    <FocusSheet.SideContent value={module.name}>
      <SideMenuContext.Provider
        value={{ activeTab: module.name, setActiveTab: noop }}
      >
        {module.name === 'customer' ? (
          <CustomerWidget
            customerIds={customerIds}
            scope=" "
            access={accessLevel}
            onManageCustomers={
              canManageRelations ? handleSelectCustomers : undefined
            }
          />
        ) : module.name === 'company' ? (
          <CompanyWidget
            companyIds={companyIds}
            scope=" "
            onManageCompanies={
              canManageRelations ? handleSelectCompanies : undefined
            }
          />
        ) : module.name === 'deals' ? (
          <CarDealsRelationPanel
            carId={carId}
            contentType={contentType}
            access={accessLevel}
          />
        ) : loading ? (
          <Spinner containerClassName="flex h-full items-center justify-center" />
        ) : (
          <RelationWidget
            module={module.name}
            pluginName={module.pluginName}
            contentId={carId}
            contentType={contentType}
            access={accessLevel}
          />
        )}
      </SideMenuContext.Provider>
    </FocusSheet.SideContent>
  );
};

export const CarRelationWidgetSideTabs = ({
  carId,
  companies = [],
  customers = [],
  onRelationsChange,
}: {
  carId: string;
  companies?: ICompany[];
  customers?: ICustomer[];
  onRelationsChange?: () => void;
}) => {
  const { RelationWidget, relationWidgetsModules } = useRelationWidget({
    hiddenModules: ['car'],
  });
  const { hasActionPermission } = usePermissionCheck();
  const canManageCars = hasActionPermission('manageCars');

  return (
    <FocusSheet.SideTabs>
      {relationWidgetsModules.map((module) => (
        <CarRelationWidgetSideContent
          key={module.name}
          access={canManageCars ? 'write' : 'read'}
          carId={carId}
          companies={companies}
          customers={customers}
          module={module}
          onRelationsChange={canManageCars ? onRelationsChange : undefined}
          RelationWidget={RelationWidget}
        />
      ))}
      <FocusSheet.SideTabsList>
        {relationWidgetsModules.map((module) => (
          <FocusSheet.SideTabsTrigger
            key={module.name}
            value={module.name}
            Icon={module.icon}
            label={module.name.charAt(0).toUpperCase() + module.name.slice(1)}
          />
        ))}
      </FocusSheet.SideTabsList>
    </FocusSheet.SideTabs>
  );
};
