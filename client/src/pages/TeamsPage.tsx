import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Team } from '../types';
import { getTeams } from '../api/teams';
import { formatRecord } from '../utils/format';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getTeams()
      .then(setTeams)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load teams.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
      <p className="mt-1 text-slate-600">Browse all SEC teams with current-season stats.</p>

      <div className="mt-6">
        {loading && <LoadingSpinner label="Loading teams..." />}
        {!loading && error && <ErrorAlert message={error} onRetry={load} />}
        {!loading && !error && teams && teams.length === 0 && (
          <p className="text-slate-500">No teams found.</p>
        )}
        {!loading && !error && teams && teams.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-2 w-full" style={{ backgroundColor: team.primaryColor }} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-navy">{team.name}</h2>
                      <p className="text-sm text-slate-500">{team.mascot}</p>
                    </div>
                    <Badge tone="navy">{team.conference}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-slate-900">
                      {team.stats ? formatRecord(team.stats.wins, team.stats.losses) : '—'}
                    </span>
                    <div className="text-right text-xs text-slate-500">
                      <p>PPG: <span className="font-semibold text-slate-700">{team.stats?.pointsPerGame.toFixed(1) ?? '—'}</span></p>
                      <p>PAPG: <span className="font-semibold text-slate-700">{team.stats?.pointsAllowedPerGame.toFixed(1) ?? '—'}</span></p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
