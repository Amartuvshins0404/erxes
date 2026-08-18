import {
  IconBuilding,
  IconDoor,
  IconPhotoCirclePlus,
  IconStairs,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Badge, readImage, Slider, Tooltip } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { ADDRESS_DISTRICT } from '../constants/address';
import { COLOR_PALLATE } from '../constants/colors';
import { BLOCK_PROJECT_STATUS, PUBLISH_STATUS } from '../constants/project';
import { IProject, IProjectLocation } from '../types/projectTypes';
import { formatCompactNumber, formatCurrencyNumber } from '../utils';

const AddressSection = ({ location }: { location?: IProjectLocation }) => {
  const { city, district } = location || {};

  if (!city || !district) {
    return <p className="text-sm">No Location</p>;
  }

  const addresses: string[] = [];

  if (city && district) {
    const districts = ADDRESS_DISTRICT[city] || [];
    const districtInfo = districts.find((d) => d.value === district);

    addresses.push(districtInfo?.short || district);
    addresses.push(city);
  }

  return <p className="text-sm">{addresses.join(', ')}</p>;
};

const DateSection = ({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) => {
  if (!startDate && !endDate) {
    return <p className="text-sm">No Date</p>;
  }

  const dates: string[] = [];

  if (startDate) dates.push(format(startDate, "yyyy 'Q'Q"));
  if (endDate) dates.push(format(endDate, "yyyy 'Q'Q"));

  return <p className="text-sm">{dates.join(' - ')}</p>;
};

const StaticSection = ({ counts }: { counts?: Record<string, number> }) => {
  return (
    <div className="text-sm flex space-x-2 blk:[&_svg]:size-4">
      <Tooltip.Provider>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <div className="inline-flex items-center gap-2">
              <IconBuilding />
              <span className="text-foreground font-medium">
                {counts?.buildings ?? 0}
              </span>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content>Buildings: {counts?.buildings ?? 0}</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <div className="inline-flex items-center gap-2">
              <IconStairs />
              <span className="text-foreground font-medium">
                {counts?.zones ?? 0}
              </span>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content>Zones: {counts?.zones ?? 0}</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <div className="inline-flex items-center gap-2">
              <IconDoor />
              <span className="text-foreground font-medium">
                {counts?.units ?? 0}
              </span>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content>Units: {counts?.units ?? 0}</Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
    </div>
  );
};

const PriceSection = ({
  ranges,
}: {
  ranges?: Record<string, { min: number; max: number }>;
}) => {
  if (!ranges || Object.keys(ranges).length === 0) {
    return <p className="text-sm">No Price</p>;
  }

  const renderPrice = (key: string) => {
    const [currency, type] = key.split('_');

    const UOMS: Record<string, string> = {
      priceBySize: 'm²',
      priceByUnit: 'unit',
    };

    const range = ranges[key];
    if (!range) return null;

    const { min, max } = range;
    if (min == null && max == null) return null;

    const prices: string[] = [];

    if (min != null && max != null && min === max) {
      prices.push(formatCompactNumber(min));
    } else {
      if (min != null) prices.push(formatCompactNumber(min));
      if (max != null) prices.push(formatCompactNumber(max));
    }

    return (
      <span key={key} className="inline-flex items-center">
        {prices.join(' - ')}
        {currency ? ` ${formatCurrencyNumber(currency)}` : ''}
        {type && UOMS[type] ? `/${UOMS[type]}` : ''}
      </span>
    );
  };

  return (
    <div className="text-sm flex space-x-2">
      {Object.keys(ranges).slice(0, 1).map(renderPrice)}
    </div>
  );
};

export const ProjectCard = (project: IProject) => {
  const {
    name,
    _id,
    coverImage,
    status,
    isPublished,
    location,
    counts,
    priceRanges,
  } = project || {};

  return (
    <Link
      to={`/block/projects/${_id}`}
      className="border p-2 blk:rounded-[1.25rem]"
    >
      <div className="grid grid-cols-2">
        <div className="w-full h-full relative blk:aspect-2/1 rounded-xl overflow-hidden flex items-center justify-center">
          {coverImage ? (
            <img
              src={readImage(coverImage)}
              alt={name}
              className="w-full h-full object-cover object-center max-h-[220px]"
            />
          ) : (
            <IconPhotoCirclePlus className="size-8 text-scroll" />
          )}
          <div className="absolute inset-0 border border-foreground/10 rounded-xl" />
        </div>
        <div className="px-4 py-2 flex flex-col gap-3">
          <div className="flex justify-between">
            <h3 className="font-medium text-lg truncate">{name || 'No name'}</h3>
            <Tooltip.Provider delayDuration={0}>
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <Badge variant="secondary" className="-mt-1">
                    {PUBLISH_STATUS[`${isPublished}`]?.text || 'Нийтлээгүй'}
                  </Badge>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>
                    {PUBLISH_STATUS[`${isPublished}`]?.text || 'Нийтлээгүй'}
                  </p>
                </Tooltip.Content>
              </Tooltip>
            </Tooltip.Provider>
          </div>
          <Badge
            variant={
              (BLOCK_PROJECT_STATUS[status]?.variant as any) || 'default'
            }
          >
            {BLOCK_PROJECT_STATUS[status]?.text || status}
          </Badge>
          <div className="flex items-center gap-2 text-accent-foreground">
            <AddressSection location={location} />
          </div>
          <div className="flex items-center gap-2 text-accent-foreground">
            <DateSection
              startDate={project.startDate}
              endDate={project.endDate}
            />
          </div>
          <div className="flex items-center gap-2 text-accent-foreground">
            <PriceSection ranges={priceRanges} />
          </div>
          <div className="flex items-center gap-2 text-accent-foreground">
            <StaticSection counts={counts} />
          </div>
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="flex items-center gap-2">
                  <Slider value={[project.progress || 0]} max={100} hideThumb />
                  <p className="text-sm ml-1 text-accent-foreground font-medium">
                    {project.progress || 0}%
                  </p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Project progress: {project.progress || 0}%</p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </div>
      </div>
    </Link>
  );
};
