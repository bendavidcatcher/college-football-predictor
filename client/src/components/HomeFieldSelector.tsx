interface HomeFieldSelectorProps {
  teamAId: number;
  teamAName: string;
  teamBId: number;
  teamBName: string;
  value: number | null;
  onChange: (homeTeamId: number | null) => void;
}

export default function HomeFieldSelector({
  teamAId,
  teamAName,
  teamBId,
  teamBName,
  value,
  onChange,
}: HomeFieldSelectorProps) {
  const options: { label: string; homeTeamId: number | null }[] = [
    { label: 'Neutral site', homeTeamId: null },
    { label: `${teamAName} at home`, homeTeamId: teamAId },
    { label: `${teamBName} at home`, homeTeamId: teamBId },
  ];

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">Site</span>
      <div className="inline-flex w-full flex-col gap-1 rounded-lg border border-slate-300 bg-slate-100 p-1 sm:flex-row">
        {options.map((option) => {
          const isSelected = value === option.homeTeamId;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.homeTeamId)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isSelected ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
