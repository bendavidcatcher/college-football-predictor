import { formatPercent } from '../utils/format';

interface WinProbabilityBarProps {
  teamAName: string;
  teamBName: string;
  teamAProbability: number;
  teamBProbability: number;
  teamAColor?: string;
  teamBColor?: string;
}

export default function WinProbabilityBar({
  teamAName,
  teamBName,
  teamAProbability,
  teamBProbability,
  teamAColor = '#14213D',
  teamBColor = '#94a3b8',
}: WinProbabilityBarProps) {
  const aPct = Math.round(teamAProbability * 100);
  const bPct = 100 - aPct;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700">
        <span>
          {teamAName} <span className="text-slate-500 font-normal">{formatPercent(teamAProbability)}</span>
        </span>
        <span>
          <span className="text-slate-500 font-normal">{formatPercent(teamBProbability)}</span> {teamBName}
        </span>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full border border-slate-200 shadow-inner">
        <div
          className="h-full transition-all"
          style={{ width: `${aPct}%`, backgroundColor: teamAColor }}
          aria-label={`${teamAName} win probability ${aPct}%`}
        />
        <div
          className="h-full transition-all"
          style={{ width: `${bPct}%`, backgroundColor: teamBColor }}
          aria-label={`${teamBName} win probability ${bPct}%`}
        />
      </div>
    </div>
  );
}
