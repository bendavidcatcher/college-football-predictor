interface StatCompareRowProps {
  label: string;
  teamAValue: number;
  teamBValue: number;
  lowerIsBetter?: boolean;
  formatValue?: (value: number) => string;
}

export default function StatCompareRow({
  label,
  teamAValue,
  teamBValue,
  lowerIsBetter = false,
  formatValue = (v) => v.toFixed(1),
}: StatCompareRowProps) {
  let aEdge = false;
  let bEdge = false;

  if (teamAValue !== teamBValue) {
    const aIsHigher = teamAValue > teamBValue;
    const aWins = lowerIsBetter ? !aIsHigher : aIsHigher;
    aEdge = aWins;
    bEdge = !aWins;
  }

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className={`w-1/3 py-3 pr-4 text-right text-sm ${aEdge ? 'font-bold text-navy' : 'text-slate-600'}`}>
        <span className="inline-flex items-center gap-1.5 justify-end">
          {aEdge && <span aria-hidden="true">&#9668;</span>}
          {formatValue(teamAValue)}
        </span>
      </td>
      <td className="w-1/3 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </td>
      <td className={`w-1/3 py-3 pl-4 text-left text-sm ${bEdge ? 'font-bold text-navy' : 'text-slate-600'}`}>
        <span className="inline-flex items-center gap-1.5">
          {formatValue(teamBValue)}
          {bEdge && <span aria-hidden="true">&#9658;</span>}
        </span>
      </td>
    </tr>
  );
}
