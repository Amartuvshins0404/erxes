interface ListTotalsLabelProps {
  filteredTotalCount?: number;
  overallTotalCount?: number;
  loading?: boolean;
  className?: string;
}

export function ListTotalsLabel({
  filteredTotalCount,
  overallTotalCount,
  loading = false,
  className = 'px-3 pt-3 text-sm text-muted-foreground',
}: ListTotalsLabelProps) {
  if (loading && filteredTotalCount === undefined && overallTotalCount === undefined) {
    return <div className={className}>Loading totals...</div>;
  }

  if (filteredTotalCount === undefined && overallTotalCount === undefined) {
    return <div className={className}>Showing - of -</div>;
  }

  const filteredValue = filteredTotalCount ?? overallTotalCount ?? 0;
  const overallValue = overallTotalCount ?? filteredValue;

  return (
    <div className={className}>
      Showing {filteredValue.toLocaleString()} of {overallValue.toLocaleString()}
    </div>
  );
}
