import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { OleMissDashboard } from '../types';
import { getOleMissDashboard } from '../api/olemiss';
import {
  formatRecord,
  formatSosPercent,
  formatSigned,
  formatDate,
  formatScoreLine,
} from '../utils/format';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';
import GamesTable from '../components/GamesTable';
import WinProbabilityBar from '../components/WinProbabilityBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const NAVY = '#14213D';
const RED = '#CE1126';

interface ChartTooltipPayloadItem {
  dataKey: string;
  value: number;
  payload: { week: number; opponent: string; result: 'W' | 'L'; pointsFor: number; pointsAgainst: number };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="font-semibold text-slate-800">
        Week {point.week} · {point.opponent}
      </p>
      <p className="mt-1 text-slate-600">Points for: {point.pointsFor}</p>
      <p className="text-slate-600">Points against: {point.pointsAgainst}</p>
      <p className="mt-1">
        <Badge tone={point.result === 'W' ? 'green' : 'red'}>{point.result === 'W' ? 'Win' : 'Loss'}</Badge>
      </p>
    </div>
  );
}

export default function OleMissPage() {
  const [dashboard, setDashboard] = useState<OleMissDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getOleMissDashboard()
      .then(setDashboard)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load Ole Miss dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingSpinner label="Loading Ole Miss dashboard..." />
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

  if (!dashboard) return null;

  const { team, games, nextGame, nextGamePrediction, weeklyPerformance } = dashboard;
  const stats = team.stats;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: NAVY }}>
        <div className="h-2 w-full" style={{ backgroundColor: RED }} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: RED }}>
              {stats?.season ?? ''} Season
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-white">Ole Miss Rebels</h1>
            <p className="mt-1 text-sm text-slate-300">{team.conference} Conference</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold text-white">
              {stats ? formatRecord(stats.wins, stats.losses) : '—'}
            </span>
            <Badge tone="slate">Overall Record</Badge>
          </div>
        </div>
      </div>

      {/* Key stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Points/Game" value={stats.pointsPerGame.toFixed(1)} accentColor={RED} />
          <StatCard label="Points Allowed/Game" value={stats.pointsAllowedPerGame.toFixed(1)} accentColor={RED} />
          <StatCard label="Yards/Game" value={stats.yardsPerGame.toFixed(1)} accentColor={RED} />
          <StatCard label="Yards Allowed/Game" value={stats.yardsAllowedPerGame.toFixed(1)} accentColor={RED} />
          <StatCard label="Turnover Margin" value={formatSigned(stats.turnoverMargin)} accentColor={RED} />
          <StatCard label="Strength of Schedule" value={formatSosPercent(stats.strengthOfSchedule)} accentColor={RED} />
          <StatCard label="Recent Form" value={`${stats.recentFormScore.toFixed(1)} / 10`} accentColor={RED} />
        </div>
      )}

      {/* Weekly performance chart */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Weekly Performance</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {weeklyPerformance.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No completed games yet this season.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={weeklyPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tickFormatter={(w) => `Wk ${w}`} stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="pointsFor" name="Points For" stroke={RED} strokeWidth={2} dot={{ r: 3 }} />
                <Line
                  type="monotone"
                  dataKey="pointsAgainst"
                  name="Points Against"
                  stroke={NAVY}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Full Schedule</h2>
        <GamesTable games={games} teamId={team.id} />
      </div>

      {/* Next matchup preview */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Next Matchup Preview</h2>
        {!nextGame ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No upcoming games scheduled.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-500">{formatDate(nextGame.date)}</p>
                <p className="text-lg font-bold text-slate-900">
                  {nextGame.homeTeam.id === team.id ? 'vs' : '@'}{' '}
                  {nextGame.homeTeam.id === team.id ? nextGame.awayTeam.name : nextGame.homeTeam.name}
                </p>
              </div>
              <Badge tone="slate">Week {nextGame.week}</Badge>
            </div>

            {nextGamePrediction ? (
              <div className="mt-5">
                <WinProbabilityBar
                  teamAName={nextGamePrediction.teamA.name}
                  teamBName={nextGamePrediction.teamB.name}
                  teamAProbability={nextGamePrediction.teamAWinProbability}
                  teamBProbability={nextGamePrediction.teamBWinProbability}
                  teamAColor={nextGamePrediction.teamA.primaryColor}
                  teamBColor={nextGamePrediction.teamB.primaryColor}
                />

                <div className="mt-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Projected score</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {formatScoreLine(nextGamePrediction.projectedScoreA, nextGamePrediction.projectedScoreB)}
                  </p>
                </div>

                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">Top factors</h3>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {nextGamePrediction.factors.slice(0, 3).map((factor) => (
                      <li key={factor.category} className="flex items-start justify-between gap-3 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{factor.category}</p>
                          <p className="text-xs text-slate-500">{factor.description}</p>
                        </div>
                        <Badge tone={factor.edge === 'EVEN' ? 'slate' : 'navy'}>
                          {factor.edge === 'EVEN'
                            ? 'Even'
                            : factor.edge === 'A'
                              ? nextGamePrediction.teamA.abbreviation
                              : nextGamePrediction.teamB.abbreviation}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm leading-relaxed text-slate-700">{nextGamePrediction.summary}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Prediction not available for this matchup yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
