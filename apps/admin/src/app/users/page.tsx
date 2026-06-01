import { PLATFORM_META } from '@rideai/shared';
import { Table } from '@/components/Table';
import { MOCK_USERS } from '@/lib/mock';

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-muted">{MOCK_USERS.length} users.</p>

      <div className="mt-6">
        <Table
          headers={['Name', 'City', 'Bookings', 'Platforms used']}
          rows={MOCK_USERS.map((u) => [
            u.name,
            u.city,
            String(u.totalBookings),
            u.platforms.length
              ? u.platforms.map((p) => PLATFORM_META[p].label).join(', ')
              : '—',
          ])}
        />
      </div>
    </div>
  );
}
