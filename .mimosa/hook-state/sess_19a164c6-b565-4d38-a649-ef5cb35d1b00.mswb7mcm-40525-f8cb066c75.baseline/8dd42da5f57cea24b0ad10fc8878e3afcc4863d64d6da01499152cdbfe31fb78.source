import { OFFER_STATUS_OPTIONS } from '../constants/offer';

interface SelectOfferStatusProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SelectOfferStatus({
  value,
  onChange,
  className = '',
}: SelectOfferStatusProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`}
    >
      <option value="">Select status</option>
      {OFFER_STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
