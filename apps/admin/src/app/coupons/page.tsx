import { DiscountType, PLATFORM_META, formatPrice } from '@rideai/shared';
import { Table } from '@/components/Table';
import { MOCK_COUPONS } from '@/lib/mock';

function discountLabel(
  type: DiscountType,
  value: number,
  maxDiscount: number | null | undefined,
): string {
  if (type === DiscountType.PERCENT) {
    return `${value}%${maxDiscount ? ` (max ${formatPrice(maxDiscount)})` : ''}`;
  }
  return formatPrice(value);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function CouponsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Coupons</h1>
      <p className="mt-1 text-muted">{MOCK_COUPONS.length} coupons in the catalogue.</p>

      <div className="mt-6">
        <Table
          headers={['Code', 'Platform', 'Type', 'Discount', 'Min fare', 'Success', 'Verified', 'Expires']}
          rows={MOCK_COUPONS.map((c) => [
            <span key={c.code} className="font-mono">{c.code}</span>,
            PLATFORM_META[c.platform].label,
            c.type,
            discountLabel(c.discountType, c.discountValue, c.maxDiscount),
            c.minFare ? formatPrice(c.minFare) : '—',
            `${Math.round((c.successRate ?? 0) * 100)}%`,
            fmtDate(c.lastVerified),
            fmtDate(c.expiresAt),
          ])}
        />
      </div>
    </div>
  );
}
