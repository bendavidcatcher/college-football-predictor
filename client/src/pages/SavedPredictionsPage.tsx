import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { SavedPrediction } from '../types';
import { getSavedPredictions, deleteSavedPrediction } from '../api/predictions';
import { formatDate, formatPercent, formatScoreLine } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

export default function SavedPredictionsPage() {
  const [predictions, setPredictions] = useState<SavedPrediction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSavedPredictions()
      .then(setPredictions)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load saved predictions.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteSavedPrediction(id);
      setPredictions((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prediction.');
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Saved Predictions</h1>
      <p className="mt-1 text-slate-600">Predictions you've saved for later.</p>

      <div className="mt-6">
        {loading && <LoadingSpinner label="Loading saved predictions..." />}
        {!loading && error && <ErrorAlert message={error} onRetry={load} />}
        {!loading && !error && predictions && predictions.length === 0 && (
          <EmptyState
            title="No saved predictions yet"
            description="Run a matchup on the predictor and save it to see it here."
            action={
              <Link to="/predictor" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
                Go to Predictor
              </Link>
            }
          />
        )}
        {!loading && !error && predictions && predictions.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {predictions.map((saved) => {
              const { prediction } = saved;
              const winner = prediction.winnerTeamId === prediction.teamA.id ? prediction.teamA : prediction.teamB;
              return (
                <div key={saved.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {prediction.teamA.name} vs {prediction.teamB.name}
                      </h2>
                      <p className="text-xs text-slate-500">Saved {formatDate(saved.createdAt)}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-700">
                    Winner: <span className="font-semibold" style={{ color: winner.primaryColor }}>{winner.name}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {prediction.teamA.abbreviation} {formatPercent(prediction.teamAWinProbability)} &middot;{' '}
                    {prediction.teamB.abbreviation} {formatPercent(prediction.teamBWinProbability)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Projected: {formatScoreLine(prediction.projectedScoreA, prediction.projectedScoreB)}
                  </p>

                  <div className="mt-4">
                    {pendingDeleteId === saved.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Delete this prediction?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(saved.id)}
                          disabled={deletingId === saved.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === saved.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(saved.id)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
