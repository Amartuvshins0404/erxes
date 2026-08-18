import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useBanners } from '../hooks/useBanners';
import { BannerFilters, BannerStatus } from '../types/banner';
import { BANNERS_CURSOR_SESSION_KEY } from '../constants/bannerCursorSessionKey';
import { EditBannerDialog } from './BannerDialog';
import { RemoveBannerDialog } from './RemoveBannerDialog';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ONE_FIT_PROVIDERS } from '~/modules/provider/graphql/providerQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { readImage } from 'erxes-ui/utils/core';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface BannersListProps {
  filters?: BannerFilters;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case BannerStatus.ACTIVE:
      return 'success';
    case BannerStatus.INACTIVE:
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'adult':
      return 'default';
    case 'child':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const BannersList = ({ filters }: BannersListProps) => {
  const {
    banners,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useBanners(filters);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const { data: providersData } = useQuery(ONE_FIT_PROVIDERS, {
    variables: { limit: 1000 },
  });

  const providers = providersData?.oneFitProviders?.list || [];
  const getProviderName = (providerId: string) => {
    const provider = providers.find((p: { _id: string }) => p._id === providerId);
    if (!provider) return providerId;
    return getLocalizedString(provider.businessName, 'en');
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ cell }) => {
        const imageUrl = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            {imageUrl ? (
              <img
                src={readImage(imageUrl)}
                alt="Banner"
                className="h-16 w-24 object-cover rounded"
              />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            )}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'providerId',
      header: 'Provider',
      cell: ({ cell }) => {
        const providerId = cell.getValue() as string;
        const providerName = getProviderName(providerId);
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {providerName}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ cell }) => {
        const type = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            <Badge
              variant={getTypeBadgeVariant(type)}
              className="capitalize"
            >
              {type}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        const status = cell.getValue() as string;
        return (
          <RecordTableInlineCell>
            <Badge
              variant={getStatusBadgeVariant(status)}
              className="capitalize"
            >
              {status}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            <RelativeDateDisplay value={cell.getValue() as string} asChild>
              <RelativeDateDisplay.Value value={cell.getValue() as string} />
            </RelativeDateDisplay>
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const banner = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBanner(banner._id);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBanner(banner._id);
                  setRemoveDialogOpen(true);
                }}
              >
                Remove
              </Button>
            </div>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <>
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={banners || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={banners?.length}
          sessionKey={BANNERS_CURSOR_SESSION_KEY}
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              <RecordTable.CursorBackwardSkeleton
                handleFetchMore={handleFetchMore}
              />
              {loading && <RecordTable.RowSkeleton rows={40} />}
              <RecordTable.RowList />
              <RecordTable.CursorForwardSkeleton
                handleFetchMore={handleFetchMore}
              />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.CursorProvider>
      </RecordTable.Provider>

      {selectedBanner && (
        <>
          <EditBannerDialog
            bannerId={selectedBanner}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedBanner(null);
            }}
          />
          <RemoveBannerDialog
            bannerId={selectedBanner}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedBanner(null);
            }}
          />
        </>
      )}
    </>
  );
};
