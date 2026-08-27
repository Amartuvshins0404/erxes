import { IconClock, IconMapPin, IconWorldWww } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Empty,
  EnumCursorDirection,
  Spinner,
} from 'erxes-ui';

import { formatLongDate } from '@/shared/utils/format';
import { MEETING_STATUS_OPTIONS } from '../constants/meetingConstants';
import { useMeetings } from '../hooks/useMeetings';
import { IMeeting } from '../types/meeting';

const MeetingRow = ({ meeting }: { meeting: IMeeting }) => {
  const status = MEETING_STATUS_OPTIONS.find(
    (option) => option.value === meeting.status,
  );

  return (
    <li className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{meeting.title}</span>
        {status && <Badge variant={status.badge}>{status.label}</Badge>}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <IconClock className="size-4" />
          {formatLongDate(meeting.scheduledAt) || 'Огноо тодорхойгүй'}
        </span>
        {meeting.location && (
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin className="size-4" />
            {meeting.location}
          </span>
        )}
      </div>
      {meeting.note && (
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {meeting.note}
        </p>
      )}
    </li>
  );
};

export const MeetingList = ({
  searchValue,
  status,
}: {
  searchValue?: string;
  status?: string;
}) => {
  const { meetings, pageInfo, loading, error, handleFetchMore } = useMeetings({
    variables: {
      searchValue: searchValue || undefined,
      status: status || undefined,
    },
  });

  if (loading && !meetings) {
    return <Spinner containerClassName="py-32" />;
  }

  if (error) {
    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Title>Уулзалт ачаалж чадсангүй</Empty.Title>
          <Empty.Description>{error.message}</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  if (!meetings?.length) {
    const isFiltered = Boolean(searchValue || status);

    return (
      <Empty className="py-32">
        <Empty.Header>
          <Empty.Media>
            <IconWorldWww className="size-10 text-muted-foreground" />
          </Empty.Media>
          <Empty.Title>
            {isFiltered
              ? 'Хайлтад тохирох уулзалт олдсонгүй'
              : 'Товлосон уулзалт алга байна'}
          </Empty.Title>
          <Empty.Description>
            {isFiltered
              ? 'Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.'
              : 'Уулзалтын хуваарь вэб сайтаас үүсдэг. Энд зөвхөн харагдана.'}
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <ul className="flex flex-col gap-3">
        {meetings.map((meeting) => (
          <MeetingRow key={meeting._id} meeting={meeting} />
        ))}
      </ul>

      {pageInfo?.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() =>
              handleFetchMore({ direction: EnumCursorDirection.FORWARD })
            }
          >
            {loading && <Spinner size="sm" />}
            Цааш нь ачаалах
          </Button>
        </div>
      )}
    </div>
  );
};
