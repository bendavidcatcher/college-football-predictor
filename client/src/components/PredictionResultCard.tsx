import type { PredictionResult } from '../types';
import WinProbabilityBar from './WinProbabilityBar';
import Badge from './Badge';
import { formatScoreLine } from '../utils/format';

interface PredictionResultCardProps {
  result: PredictionResult;
}

export default function PredictionResultCard({ result }: PredictionResultCardProps) {
  const {
    teamA,
    teamB,
    winnerTeamId,
    teamAWinProbability,
    teamBWinProbability,
    projectedScoreA,
    projectedScoreB,
    factors,
    summary,
  } = result;

  const winner = winnerTeamId === teamA.id ? teamA : teamB;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Predicted winner</p>
        <h3 className="mt-1 text-2xl font-extrabold" style={{ color: winner.primaryColor }}>
          {winner.name} {winner.mascot}
        </h3>
      </div>

      <WinProbabilityBar
        teamAName={teamA.name}
        teamBName={teamB.name}
        teamAProbability={teamAWinProbability}
        teamBProbability={teamBWinProbability}
        teamAColor={teamA.primaryColor}
        teamBColor={teamB.primaryColor}
      />

      <div className="mt-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Projected score</p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900">
          {formatScoreLine(projectedScoreA, projectedScoreB)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {teamA.abbreviation} – {teamB.abbreviation}
        </p>
      </div>

      <div className="mt-6">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Key factors</h4>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {factors.map((factor) => (
            <li key={factor.category} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{factor.category}</p>
                <p className="text-xs text-slate-500">{factor.description}</p>
              </div>
              <Badge tone={factor.edge === 'EVEN' ? 'slate' : 'navy'}>
                {factor.edge === 'EVEN' ? 'Even' : factor.edge === 'A' ? teamA.abbreviation : teamB.abbreviation}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
      </div>
    </div>
  );
}
