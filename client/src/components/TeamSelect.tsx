import type { Team } from '../types';

interface TeamSelectProps {
  label: string;
  teams: Team[];
  value: number | null;
  onChange: (teamId: number | null) => void;
  disabledTeamId?: number | null;
}

export default function TeamSelect({ label, teams, value, onChange, disabledTeamId }: TeamSelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select a team...</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id} disabled={team.id === disabledTeamId}>
            {team.name} {team.mascot}
          </option>
        ))}
      </select>
    </label>
  );
}
