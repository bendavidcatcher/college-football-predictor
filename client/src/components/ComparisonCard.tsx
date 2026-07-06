import type { Team } from '../types';
import { formatRecord } from '../utils/format';
import Badge from './Badge';

interface ComparisonCardProps {
  team: Team;
  align?: 'left' | 'right';
}

export default function ComparisonCard({ team, align = 'left' }: ComparisonCardProps) {
  const record = team.stats ? formatRecord(team.stats.wins, team.stats.losses) : '—';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-2 w-full" style={{ backgroundColor: team.primaryColor }} />
      <div className={`p-4 ${align === 'right' ? 'text-right' : 'text-left'}`}>
        <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
        <p className="text-sm text-slate-500">{team.mascot}</p>
        <div className={`mt-3 flex items-center gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-2xl font-extrabold text-slate-900">{record}</span>
          <Badge tone="navy">{team.conference}</Badge>
        </div>
      </div>
    </div>
  );
}
