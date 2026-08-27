import { IconExternalLink } from '@tabler/icons-react';
import { Badge } from 'erxes-ui';

import {
  formatDate,
  formatMoney,
  formatYearRange,
  SourceLink,
} from '@/shared/utils/format';
import {
  BILL_ROLE_OPTIONS,
  BILL_STAGE_OPTIONS,
  PROMISE_STATUS_OPTIONS,
} from '../../constants/profileConstants';
import { IAdminProfile, IProfileLink } from '../../types/profile';
import {
  AdminProfileSection,
  AdminProfileTextBlock,
} from './AdminProfileSection';

const LinkList = ({
  links,
  emptyLabel,
}: {
  links?: IProfileLink[];
  emptyLabel: string;
}) =>
  links?.length ? (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={`${link.url}-${link.title}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <IconExternalLink className="size-4" />
            {link.title}
          </a>
          {link.publishedAt && (
            <span className="ml-2 text-xs text-muted-foreground">
              {formatDate(link.publishedAt)}
            </span>
          )}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm italic text-muted-foreground">{emptyLabel}</p>
  );

export const AdminProfileContent = ({
  profile,
}: {
  profile: IAdminProfile;
}) => {
  const socialLinks = Object.entries(profile.contact?.socialLinks || {}).filter(
    ([key, value]) => key !== '__typename' && Boolean(value),
  );

  const { attendance } = profile;
  const hasAttendance = [
    attendance?.sessionAttendanceRate,
    attendance?.committeeAttendanceRate,
    attendance?.totalSessions,
  ].some((value) => value !== null && value !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <AdminProfileSection title="Үндсэн мэдээлэл">
        <AdminProfileTextBlock
          label="Танилцуулга"
          value={profile.introduction}
        />
        <AdminProfileTextBlock
          label="Албан тушаал"
          value={profile.positionDescription}
        />
        <AdminProfileTextBlock
          label="Төлөөлж буй нутаг дэвсгэр"
          value={profile.territoryDescription}
        />
      </AdminProfileSection>

      <AdminProfileSection title="Намтар">
        <div>
          <div className="text-sm font-medium">Боловсрол</div>
          {profile.education?.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {profile.education.map((item) => (
                <li
                  key={`${item.school}-${item.startYear ?? ''}`}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.school}</span>
                    {item.degree && (
                      <span className="text-muted-foreground">
                        {item.degree}
                      </span>
                    )}
                    <span className="ml-auto text-muted-foreground">
                      {formatYearRange(item.startYear, item.endYear)}
                    </span>
                  </div>
                  {item.field && (
                    <p className="mt-1 text-muted-foreground">{item.field}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Боловсролын мэдээлэл алга байна.
            </p>
          )}
        </div>

        <div>
          <div className="text-sm font-medium">Ажлын туршлага</div>
          {profile.career?.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {profile.career.map((item) => (
                <li
                  key={`${item.organization}-${item.position}-${item.startYear ?? ''}`}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.position}</span>
                    <span className="text-muted-foreground">
                      {item.organization}
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {formatYearRange(item.startYear, item.endYear)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Ажлын туршлага бүртгэгдээгүй байна.
            </p>
          )}
        </div>
      </AdminProfileSection>

      <AdminProfileSection title="Үйл ажиллагаа">
        <AdminProfileTextBlock
          label="Хийсэн ажил"
          value={profile.achievements}
        />
        <AdminProfileTextBlock
          label="Бодлого, байр суурь"
          value={profile.policyStance}
        />

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            Амлалт ба хэрэгжилт
            <Badge variant="secondary">
              Дундаж {profile.promiseProgress ?? 0}%
            </Badge>
          </div>
          {profile.promises?.length ? (
            <ul className="flex flex-col gap-3">
              {profile.promises.map((promise) => {
                const option = PROMISE_STATUS_OPTIONS.find(
                  (item) => item.value === promise.status,
                );

                return (
                  <li key={promise.title} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{promise.title}</span>
                      {option && (
                        <Badge variant={option.badge}>{option.label}</Badge>
                      )}
                      <span className="ml-auto text-sm text-muted-foreground">
                        {promise.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${promise.progress}%` }}
                      />
                    </div>
                    {promise.description && (
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {promise.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Амлалт бүртгэгдээгүй байна.
            </p>
          )}
        </div>

        <div>
          <div className="text-sm font-medium">Хууль санаачилга</div>
          {profile.bills?.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {profile.bills.map((bill) => {
                const stage = BILL_STAGE_OPTIONS.find(
                  (item) => item.value === bill.stage,
                );
                const role = BILL_ROLE_OPTIONS.find(
                  (item) => item.value === bill.role,
                );

                return (
                  <li
                    key={`${bill.title}-${bill.submittedAt ?? ''}`}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{bill.title}</span>
                      {stage && (
                        <Badge variant={stage.badge}>{stage.label}</Badge>
                      )}
                      {role && (
                        <span className="text-muted-foreground">
                          {role.label}
                        </span>
                      )}
                      {bill.submittedAt && (
                        <span className="ml-auto text-muted-foreground">
                          {formatDate(bill.submittedAt)}
                        </span>
                      )}
                    </div>
                    {bill.description && (
                      <p className="mt-1 whitespace-pre-line text-muted-foreground">
                        {bill.description}
                      </p>
                    )}
                    <div className="mt-1">
                      <SourceLink url={bill.url} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Хуулийн төсөл бүртгэгдээгүй байна.
            </p>
          )}
        </div>

        <AdminProfileTextBlock
          label="УИХ дахь үйл ажиллагаа"
          value={profile.parliamentActivity}
        />
        <AdminProfileTextBlock
          label="Санал хураалт"
          value={profile.votingSummary}
        />

        <div>
          <div className="text-sm font-medium">
            Ирц, оролцоо
            {attendance?.periodLabel && (
              <span className="ml-2 font-normal text-muted-foreground">
                {attendance.periodLabel}
              </span>
            )}
          </div>
          {hasAttendance ? (
            <>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {attendance?.sessionAttendanceRate !== null &&
                  attendance?.sessionAttendanceRate !== undefined && (
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">
                        Чуулганы ирц
                      </div>
                      <div className="text-lg font-semibold">
                        {attendance.sessionAttendanceRate}%
                      </div>
                    </div>
                  )}
                {attendance?.committeeAttendanceRate !== null &&
                  attendance?.committeeAttendanceRate !== undefined && (
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">
                        Хорооны ирц
                      </div>
                      <div className="text-lg font-semibold">
                        {attendance.committeeAttendanceRate}%
                      </div>
                    </div>
                  )}
              </div>
              {attendance?.totalSessions !== null &&
                attendance?.totalSessions !== undefined && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Нийт {attendance.totalSessions} хуралдаанаас{' '}
                    {attendance.attendedSessions ?? 0}-д оролцсон.
                  </p>
                )}
              <div className="mt-1">
                <SourceLink url={attendance?.sourceUrl} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Ирцийн мэдээлэл бүртгэгдээгүй байна.
            </p>
          )}
        </div>
      </AdminProfileSection>

      <AdminProfileSection title="Иргэдтэй харилцах">
        <AdminProfileTextBlock
          label="Санал хүсэлт"
          value={profile.feedbackNote}
        />

        <AdminProfileTextBlock
          label="Хүсэлтийн явц"
          value={profile.requestProcessNote}
        />
      </AdminProfileSection>

      <AdminProfileSection title="Мэдээлэл">
        <div>
          <div className="mb-2 text-sm font-medium">Мэдээ</div>
          <LinkList
            links={profile.newsLinks}
            emptyLabel="Мэдээний холбоос алга байна."
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Тайлан</div>
          <LinkList
            links={profile.reports}
            emptyLabel="Тайлан нэмэгдээгүй байна."
          />
        </div>
        <AdminProfileTextBlock
          label="Ил тод байдал"
          value={profile.transparencyNote}
        />
      </AdminProfileSection>

      <AdminProfileSection title="Санхүү, ил тод байдал">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Хөрөнгө орлогын мэдүүлэг</div>
            {profile.finance?.assetDeclarationUrl ? (
              <>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatDate(profile.finance.assetDeclarationDate) ||
                    'Огноо тодорхойгүй'}
                </div>
                <div className="mt-1">
                  <SourceLink url={profile.finance.assetDeclarationUrl} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm italic text-muted-foreground">
                Мэдүүлэг холбогдоогүй байна.
              </p>
            )}
          </div>

          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Ашиг сонирхлын мэдүүлэг</div>
            {profile.finance?.interestDeclarationUrl ? (
              <>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatDate(profile.finance.interestDeclarationDate) ||
                    'Огноо тодорхойгүй'}
                </div>
                <div className="mt-1">
                  <SourceLink url={profile.finance.interestDeclarationUrl} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm italic text-muted-foreground">
                Мэдүүлэг холбогдоогүй байна.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Сонгуулийн зардал</div>
          {formatMoney(profile.finance?.campaignExpense) ? (
            <>
              <div className="mt-1 text-lg font-semibold">
                {formatMoney(profile.finance?.campaignExpense)}
              </div>
              <SourceLink url={profile.finance?.campaignExpenseUrl} />
            </>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground">
              Зардлын мэдээлэл алга байна.
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            Хандив
            {!!profile.finance?.donations?.length && (
              <Badge variant="secondary">
                Нийт {formatMoney(profile.finance.totalDonations ?? 0)}
              </Badge>
            )}
          </div>
          {profile.finance?.donations?.length ? (
            <ul className="flex flex-col gap-2">
              {profile.finance.donations.map((donation) => (
                <li
                  key={`${donation.donor}-${donation.receivedAt ?? ''}`}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{donation.donor}</span>
                    <span className="ml-auto font-semibold">
                      {formatMoney(donation.amount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                    {donation.receivedAt && (
                      <span>{formatDate(donation.receivedAt)}</span>
                    )}
                    <SourceLink url={donation.url} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Хандив бүртгэгдээгүй байна.
            </p>
          )}
        </div>
      </AdminProfileSection>

      <AdminProfileSection title="Холбоо барих">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminProfileTextBlock
            label="И-мэйл"
            value={profile.contact?.email}
          />
          <AdminProfileTextBlock label="Утас" value={profile.contact?.phone} />
          <AdminProfileTextBlock label="Хаяг" value={profile.contact?.address} />
          <AdminProfileTextBlock
            label="Ажиллах цаг"
            value={profile.contact?.officeHours}
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Сошиал хаягууд</div>
          {socialLinks.length ? (
            <ul className="flex flex-wrap gap-3">
              {socialLinks.map(([key, value]) => (
                <li key={key}>
                  <a
                    href={String(value)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <IconExternalLink className="size-4" />
                    {key}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Сошиал хаяг нэмэгдээгүй байна.
            </p>
          )}
        </div>
      </AdminProfileSection>
    </div>
  );
};
