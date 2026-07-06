import type { Game } from '../types';
import { formatDate } from '../utils/format';
import Badge from './Badge';

interface GamesTableProps {
  games: Game[];
  teamId: number;
}

export default function GamesTable({ games, teamId }: GamesTableProps) {
  if (games.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No games scheduled.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Week</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Opponent</th>
            <th className="px-4 py-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => {
            const isHome = game.homeTeam.id === teamId;
            const opponent = isHome ? game.awayTeam : game.homeTeam;
            const teamScore = isHome ? game.homeScore : game.awayScore;
            const oppScore = isHome ? game.awayScore : game.homeScore;
            const isWin =
              game.status === 'FINAL' && teamScore !== null && oppScore !== null && teamScore > oppScore;
            const isLoss =
              game.status === 'FINAL' && teamScore !== null && oppScore !== null && teamScore < oppScore;

            return (
              <tr key={game.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{game.week}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(game.date)}</td>
                <td className="px-4 py-3 text-slate-800">
                  {isHome ? 'vs' : '@'} {opponent.name}
                </td>
                <td className="px-4 py-3">
                  {game.status === 'SCHEDULED' ? (
                    <Badge tone="slate">Upcoming</Badge>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Badge tone={isWin ? 'green' : isLoss ? 'red' : 'slate'}>
                        {isWin ? 'W' : isLoss ? 'L' : '—'}
                      </Badge>
                      <span className="text-slate-600">
                        {teamScore}-{oppScore}
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
