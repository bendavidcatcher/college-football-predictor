import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Team, Game } from '../types';
import { getTeam, getTeamGames } from '../api/teams';
import { ApiError } from '../api/client';
import { formatRecord, formatConferenceRecord, formatSosPercent, formatSigned } from '../utils/format';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import GamesTable from '../components/GamesTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([getTeam(id), getTeamGames(id)])
      .then(([teamData, gamesData]) => {
        setTeam(teamData);
        setGames(gamesData);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load team.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingSpinner label="Loading team..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState
          title="Team not found"
          description="We couldn't find a team with that id."
          action={
            <Link to="/teams" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
              Back to Teams
            </Link>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorAlert message={error} onRetry={load} />
      </div>
    );
  }

  if (!team) return null;

  const stats = team.stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-3 w-full" style={{ backgroundColor: team.primaryColor }} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {team.name} {team.mascot}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {team.city}, {team.state}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats ? formatRecord(stats.wins, stats.losses) : '—'}
            </span>
            <Badge tone="navy">{team.conference}</Badge>
          </div>
        </div>
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Points/Game" value={stats.pointsPerGame.toFixed(1)} />
          <StatCard label="Points Allowed/Game" value={stats.pointsAllowedPerGame.toFixed(1)} />
          <StatCard label="Yards/Game" value={stats.yardsPerGame.toFixed(1)} />
          <StatCard label="Yards Allowed/Game" value={stats.yardsAllowedPerGame.toFixed(1)} />
          <StatCard label="Turnover Margin" value={formatSigned(stats.turnoverMargin)} />
          <StatCard label="Strength of Schedule" value={formatSosPercent(stats.strengthOfSchedule)} />
          <StatCard label="Recent Form" value={`${stats.recentFormScore.toFixed(1)} / 10`} />
          <StatCard
            label="Conference Record"
            value={formatConferenceRecord(stats.conferenceWins, stats.conferenceLosses)}
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Season Schedule</h2>
        <GamesTable games={games} teamId={team.id} />
      </div>
    </div>
  );
}
