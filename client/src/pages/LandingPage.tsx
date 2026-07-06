import { Link } from 'react-router-dom';

const howItWorks = [
  {
    title: 'Pick two teams',
    description: 'Choose any two of the ten SEC teams and set the game location — neutral site or home field.',
  },
  {
    title: 'Transparent formula',
    description: 'Our model weighs scoring, yardage, turnovers, schedule strength, and recent form — no black box.',
  },
  {
    title: 'Explainable results',
    description: 'See win probability, a projected score, and the exact factors that drove the prediction.',
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm sm:px-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          College Football Matchup Predictor
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Compare any two SEC teams head-to-head and get a win-probability prediction from a transparent,
          formula-based model — every factor explained, no hidden math.
        </p>
        <div className="mt-8">
          <Link
            to="/predictor"
            className="inline-block rounded-lg bg-navy px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-navy-light"
          >
            Try the Predictor
          </Link>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div
          className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left"
          style={{ backgroundColor: '#14213D' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#CE1126' }}>
              Featured
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">Ole Miss Rebels Dashboard</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">
              Season stats, week-by-week performance charts, full schedule, and a next-matchup prediction —
              all in one place.
            </p>
          </div>
          <Link
            to="/olemiss"
            className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: '#CE1126' }}
          >
            View Ole Miss Dashboard
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {howItWorks.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
              {index + 1}
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{step.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
