import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Team, PredictionResult } from '../types';
import { getTeams } from '../api/teams';
import { createPrediction, savePrediction } from '../api/predictions';
import { useAuth } from '../context/AuthContext';
import TeamSelect from '../components/TeamSelect';
import HomeFieldSelector from '../components/HomeFieldSelector';
import ComparisonCard from '../components/ComparisonCard';
import StatCompareRow from '../components/StatCompareRow';
import PredictionResultCard from '../components/PredictionResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function PredictorPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);

  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadTeams = useCallback(() => {
    setTeamsLoading(true);
    setTeamsError(null);
    getTeams()
      .then(setTeams)
      .catch((err: unknown) => setTeamsError(err instanceof Error ? err.message : 'Failed to load teams.'))
      .finally(() => setTeamsLoading(false));
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const teamA = useMemo(() => teams.find((t) => t.id === teamAId) ?? null, [teams, teamAId]);
  const teamB = useMemo(() => teams.find((t) => t.id === teamBId) ?? null, [teams, teamBId]);

  const handleTeamAChange = (id: number | null) => {
    setTeamAId(id);
    setResult(null);
    setSaved(false);
    if (homeTeamId !== null && homeTeamId !== id && homeTeamId !== teamBId) {
      setHomeTeamId(null);
    }
  };

  const handleTeamBChange = (id: number | null) => {
    setTeamBId(id);
    setResult(null);
    setSaved(false);
    if (homeTeamId !== null && homeTeamId !== id && homeTeamId !== teamAId) {
      setHomeTeamId(null);
    }
  };

  const handlePredict = async () => {
    if (!teamA || !teamB) return;
    setPredicting(true);
    setPredictError(null);
    setSaved(false);
    try {
      const prediction = await createPrediction({
        teamAId: teamA.id,
        teamBId: teamB.id,
        homeTeamId,
      });
      setResult(prediction);
    } catch (err) {
      setPredictError(err instanceof Error ? err.message : 'Failed to generate prediction.');
    } finally {
      setPredicting(false);
    }
  };

  const handleSave = async () => {
    if (!result || result.id === null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await savePrediction(result.id);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save prediction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Matchup Predictor</h1>
      <p className="mt-1 text-slate-600">Select two teams to compare stats and generate a prediction.</p>

      {teamsLoading && <LoadingSpinner label="Loading teams..." />}
      {!teamsLoading && teamsError && <ErrorAlert message={teamsError} onRetry={loadTeams} />}

      {!teamsLoading && !teamsError && (
        <>
          <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <TeamSelect label="Team A" teams={teams} value={teamAId} onChange={handleTeamAChange} disabledTeamId={teamBId} />
            <TeamSelect label="Team B" teams={teams} value={teamBId} onChange={handleTeamBChange} disabledTeamId={teamAId} />
          </div>

          {teamA && teamB && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <HomeFieldSelector
                teamAId={teamA.id}
                teamAName={teamA.name}
                teamBId={teamB.id}
                teamBName={teamB.name}
                value={homeTeamId}
                onChange={setHomeTeamId}
              />
            </div>
          )}

          {teamA && teamB && (
            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ComparisonCard team={teamA} align="left" />
                <ComparisonCard team={teamB} align="right" />
              </div>

              {teamA.stats && teamB.stats && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full">
                    <tbody>
                      <StatCompareRow
                        label="Points/Game"
                        teamAValue={teamA.stats.pointsPerGame}
                        teamBValue={teamB.stats.pointsPerGame}
                      />
                      <StatCompareRow
                        label="Points Allowed/Game"
                        teamAValue={teamA.stats.pointsAllowedPerGame}
                        teamBValue={teamB.stats.pointsAllowedPerGame}
                        lowerIsBetter
                      />
                      <StatCompareRow
                        label="Yards/Game"
                        teamAValue={teamA.stats.yardsPerGame}
                        teamBValue={teamB.stats.yardsPerGame}
                      />
                      <StatCompareRow
                        label="Yards Allowed/Game"
                        teamAValue={teamA.stats.yardsAllowedPerGame}
                        teamBValue={teamB.stats.yardsAllowedPerGame}
                        lowerIsBetter
                      />
                      <StatCompareRow
                        label="Turnover Margin"
                        teamAValue={teamA.stats.turnoverMargin}
                        teamBValue={teamB.stats.turnoverMargin}
                        formatValue={(v) => (v > 0 ? `+${v}` : `${v}`)}
                      />
                      <StatCompareRow
                        label="Strength of Schedule"
                        teamAValue={teamA.stats.strengthOfSchedule}
                        teamBValue={teamB.stats.strengthOfSchedule}
                        formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                      />
                      <StatCompareRow
                        label="Recent Form"
                        teamAValue={teamA.stats.recentFormScore}
                        teamBValue={teamB.stats.recentFormScore}
                        formatValue={(v) => `${v.toFixed(1)} / 10`}
                      />
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={predicting}
                  className="rounded-lg bg-navy px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {predicting ? 'Predicting...' : 'Predict Matchup'}
                </button>
              </div>
            </div>
          )}

          {predicting && <LoadingSpinner label="Crunching the numbers..." />}
          {!predicting && predictError && (
            <div className="mt-6">
              <ErrorAlert message={predictError} onRetry={handlePredict} />
            </div>
          )}

          {!predicting && result && (
            <div className="mt-6">
              <PredictionResultCard result={result} />

              <div className="mt-4 flex flex-col items-center gap-2">
                {user ? (
                  saved ? (
                    <span className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      Saved &#10003;
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg border border-navy px-5 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save prediction'}
                    </button>
                  )
                ) : (
                  <p className="text-sm text-slate-600">
                    <Link to="/login" className="font-semibold text-navy underline">
                      Log in
                    </Link>{' '}
                    to save this prediction.
                  </p>
                )}
                {saveError && <ErrorAlert message={saveError} onRetry={handleSave} />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
