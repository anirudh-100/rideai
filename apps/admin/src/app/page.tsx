import { PLATFORM_META, formatPrice } from '@rideai/shared';
import { StatCard } from '@/components/StatCard';
import { Table } from '@/components/Table';
import { MOCK_BOOKINGS, STATS } from '@/lib/mock';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function OverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="mt-1 text-muted">Live snapshot of RideAI activity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={STATS.totalUsers.toLocaleString('en-IN')} />
        <StatCard label="Bookings today" value={String(STATS.bookingsToday)} />
        <StatCard label="Active coupons" value={String(STATS.activeCoupons)} />
        <StatCard label="Avg. savings / order" value={formatPrice(STATS.avgSavings)} accent />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Recent bookings</h2>
      <Table
        headers={['User', 'Platform', 'Service', 'Fare', 'Saved', 'Status', 'Date']}
        rows={MOCK_BOOKINGS.map((b) => [
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
  );
}
