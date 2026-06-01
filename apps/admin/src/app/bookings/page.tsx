import { PLATFORM_META, formatPrice } from '@rideai/shared';
import { Table } from '@/components/Table';
import { MOCK_BOOKINGS } from '@/lib/mock';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-muted">{MOCK_BOOKINGS.length} recent bookings.</p>

      <div className="mt-6">
        <Table
          headers={['ID', 'User', 'Platform', 'Service', 'Fare', 'Saved', 'Status', 'Date']}
          rows={MOCK_BOOKINGS.map((b) => [
            <span key={b.id} className="font-mono text-xs">{b.id}</span>,
            b.user,
            PLATFORM_META[b.platform].label,
            b.serviceType,
            formatPrice(b.fare),
            b.savings > 0 ? formatPrice(b.savings) : '—',
            b.status,
            fmtDate(b.createdAt),
          ])}
        />
      </div>
    </div>
  );
}
