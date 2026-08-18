import { useMutation } from '@apollo/client';
import { Button, Label, Spinner } from 'erxes-ui';
import { IconStar, IconStarFilled, IconTrash } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { ONE_FIT_PROVIDER_REVIEW_REMOVE } from '~/modules/provider/graphql/providerReviewQueries';
import { useProviderReviews } from '~/modules/provider/hooks/useProviderReviews';
import { OneFitProviderReview } from '~/modules/provider/types/provider';

interface ProviderReviewsSectionProps {
  providerId: string;
}

function formatReviewerName(review: OneFitProviderReview) {
  const u = review.user;
  if (!u) {
    return 'Customer';
  }
  const parts = [u.firstName, u.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return u.primaryEmail || 'Customer';
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) =>
        i < full ? (
          <IconStarFilled key={i} className="size-4 shrink-0" />
        ) : (
          <IconStar key={i} className="size-4 shrink-0 opacity-35" />
        ),
      )}
    </div>
  );
}

export function ProviderReviewsSection({
  providerId,
}: ProviderReviewsSectionProps) {
  const {
    summary,
    reviews,
    totalCount,
    pageInfo,
    loading,
    handleFetchMore,
    refetchAll,
  } = useProviderReviews(providerId);

  const [removeReview, { loading: removing }] = useMutation(
    ONE_FIT_PROVIDER_REVIEW_REMOVE,
  );

  async function handleDeleteReview(reviewId: string) {
    if (
      !window.confirm('Delete this review permanently? This cannot be undone.')
    ) {
      return;
    }
    await removeReview({
      variables: { id: reviewId, providerId },
    });
    await refetchAll();
  }

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <Label className="text-base font-semibold">Customer reviews</Label>
        {summary != null && summary.reviewCount > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <RatingStars
              rating={Math.min(5, Math.max(0, summary.averageRating))}
            />
            <span>
              {summary.averageRating.toFixed(1)} · {summary.reviewCount}{' '}
              {summary.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>

      {loading && !reviews?.length ? (
        <div className="flex justify-center py-8">
          <Spinner show />
        </div>
      ) : null}

      {!loading && (!reviews || reviews.length === 0) ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li
              key={review._id}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {formatReviewerName(review)}
                  </p>
                  {review.createdAt ? (
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(review.createdAt), 'MMM d, yyyy')}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <RatingStars rating={review.rating} />
                  {review._id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={removing}
                      aria-label="Delete review"
                      onClick={() => handleDeleteReview(review._id as string)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                  {review.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {pageInfo?.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleFetchMore()}
          disabled={loading}
        >
          <Spinner show={loading} />
          Load more
        </Button>
      ) : null}

      {totalCount != null && totalCount > 0 && !pageInfo?.hasNextPage ? (
        <p className="text-xs text-muted-foreground">
          Showing all {totalCount} {totalCount === 1 ? 'review' : 'reviews'}.
        </p>
      ) : null}
    </div>
  );
}
