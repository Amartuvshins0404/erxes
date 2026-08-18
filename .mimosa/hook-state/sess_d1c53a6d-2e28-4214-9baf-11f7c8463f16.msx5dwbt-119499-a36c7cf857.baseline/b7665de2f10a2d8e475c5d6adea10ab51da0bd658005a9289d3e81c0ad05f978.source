import { useQuery } from '@apollo/client';
import { ONE_FIT_PROVIDER } from '~/modules/provider/graphql/providerQueries';
import { readImage } from 'erxes-ui';
import { cn } from 'erxes-ui/lib/utils';

interface SelectProviderImageProps {
  providerId?: string;
  selectedImage?: string;
  onSelect: (imageUrl: string) => void;
}

export function SelectProviderImage({
  providerId,
  selectedImage,
  onSelect,
}: SelectProviderImageProps) {
  const { data, loading } = useQuery(ONE_FIT_PROVIDER, {
    variables: { _id: providerId },
    skip: !providerId,
  });

  const provider = data?.oneFitProvider;
  const coverImages = provider?.coverImages || [];

  if (!providerId) {
    return (
      <div className="text-sm text-muted-foreground">
        Please select a provider first
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading images...</div>;
  }

  if (coverImages.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No images available for this provider
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {coverImages.map((imageUrl: string, index: number) => {
        const isSelected = selectedImage === imageUrl;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(imageUrl)}
            className={cn(
              'relative aspect-video rounded-md overflow-hidden border-2 transition-all hover:opacity-90',
              isSelected
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-border hover:border-primary/50'
            )}
          >
            <img
              src={readImage(imageUrl)}
              alt={`Provider image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
