# 🏈 College Football Matchup Predictor + Ole Miss Dashboard

A full-stack college football analytics platform that compares any two SEC teams head-to-head, predicts the winner with a **transparent, formula-based model**, and features a dedicated **Ole Miss Rebels dashboard** with season stats, weekly performance charts, and a next-matchup preview.

> **Note on data:** the MVP runs entirely on **seeded demo data** (a simulated 2025 SEC season) so it works with zero API keys. The data layer is isolated in `server/prisma/seed.ts` and can later be swapped for a real sports data source (e.g. the free CollegeFootballData API) without touching the app.

## Screenshots

<!-- Add screenshots here: landing page, predictor with results, Ole Miss dashboard, saved predictions -->

## Tech Stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Frontend  | React 19, Vite, TypeScript (strict), Tailwind CSS v4, Recharts, React Router |
| Backend   | Node.js, Express, TypeScript                                 |
| Database  | PostgreSQL + Prisma ORM                                      |
| Auth      | JWT (jsonwebtoken) + bcrypt password hashing                 |
| Structure | npm monorepo (`client/` + `server/`)                         |

## Features

- **Matchup Predictor** — pick two teams and an optional home field; get the predicted winner, win probabilities, projected score, and a list of key factors explaining *why* (e.g. "Ole Miss is favored (73%) because they have a stronger offensive rating, a higher turnover margin and better recent form.").
- **Team Comparison** — live side-by-side stat comparison (PPG, points allowed, yards, turnover margin, SOS, recent form) with per-category edge indicators, shown before you even click Predict.
- **Ole Miss Dashboard** — season record, key stat cards, full schedule/results, a weekly points-for/points-against chart, and an Egg Bowl preview powered by the same prediction engine.
- **Teams Browser** — team cards and detail pages with full season schedules.
- **Accounts & Saved Predictions** — register/login with JWT, save any prediction, review and delete saved predictions.
- Loading, error, and empty states throughout; typed end-to-end with a shared API contract.

## Prediction Model (explainable by design)

This is deliberately **not** a black-box ML model — every step is a documented formula in [`server/src/prediction/engine.ts`](server/src/prediction/engine.ts):

1. **Normalize** every stat to 0–1 against the rest of the league (min-max).
2. **Composite ratings** per team:
   - `offense = 0.6·norm(PPG) + 0.4·norm(YPG)`
   - `defense = 0.6·(1−norm(PAPG)) + 0.4·(1−norm(YAPG))`
   - `overall = 0.32·offense + 0.30·defense + 0.14·turnovers + 0.12·schedule + 0.12·recent form`
3. **Home field** adds a flat rating bonus (~2.5 points of value) if a home team is selected.
4. **Win probability** maps the rating gap through a logistic curve: `P(A) = 1 / (1 + e^(−diff·7))`, clamped to 3–97% so the model never claims certainty.
5. **Projected score** blends each offense against the opposing defense: `(team PPG + opponent PAPG) / 2`, nudged by the rating gap and home field.
6. **Key factors** compare every category head-to-head and generate the plain-English summary.

The engine is pure TypeScript with no I/O, so it can be swapped for a trained model (e.g. Python/scikit-learn behind a microservice) without changing the API surface.

## Database Schema

Six Prisma models ([`server/prisma/schema.prisma`](server/prisma/schema.prisma)):

- **User** — registered accounts (email + bcrypt hash)
- **Team** — the 10 seeded SEC programs, colors included
- **Game** — full simulated 2025 round-robin (weeks 1–8 final, week 9 upcoming, arranged so the Egg Bowl is Ole Miss's next game)
- **TeamSeasonStats** — per-team season aggregates, derived from the seeded games so records and PPG are internally consistent
- **Prediction** — every computed matchup (inputs, probabilities, factors)
- **SavedPrediction** — join table linking users to predictions they saved

## API Routes

| Method | Route                     | Auth | Description                              |
| ------ | ------------------------- | ---- | ---------------------------------------- |
| POST   | `/api/auth/register`      | —    | Create account, returns JWT              |
| POST   | `/api/auth/login`         | —    | Login, returns JWT                       |
| GET    | `/api/auth/me`            | ✅   | Current user                             |
| GET    | `/api/teams`              | —    | All teams with season stats              |
| GET    | `/api/teams/:id`          | —    | One team                                 |
| GET    | `/api/teams/:id/games`    | —    | Team's season schedule/results           |
| POST   | `/api/predictions`        | —    | Run + persist a matchup prediction       |
| POST   | `/api/predictions/save`   | ✅   | Save a prediction to your account        |
| GET    | `/api/predictions/saved`  | ✅   | List your saved predictions              |
| DELETE | `/api/predictions/:id`    | ✅   | Delete a saved prediction                |
| GET    | `/api/olemiss/dashboard`  | —    | Everything the Ole Miss page needs       |

## Running Locally

**Prereqs:** Node 18+, PostgreSQL running locally (e.g. `brew install postgresql@17 && brew services start postgresql@17`).

```bash
# 1. Install everything
npm run install:all

# 2. Create the database
createdb cfb_predictor

# 3. Configure env vars
cp server/.env.example server/.env   # set DATABASE_URL + JWT_SECRET
cp client/.env.example client/.env
# e.g. DATABASE_URL=postgresql://<your-user>@localhost:5432/cfb_predictor

# 4. Migrate + seed
npm run db:migrate
npm run seed

# 5. Run both apps (client on :5173, API per server/.env PORT)
npm run dev
```

A demo account is seeded: **demo@cfb.dev / password123**.

> ⚠️ **macOS note:** AirPlay Receiver occupies port 5000. Use `PORT=5001` in `server/.env` and `VITE_API_URL=http://localhost:5001/api` in `client/.env` (this repo's local `.env` files already do).

## Smoke Test

With both servers running, this should all succeed:

```bash
curl http://localhost:5001/api/health                 # {"status":"ok"}
curl http://localhost:5001/api/teams | head -c 200    # JSON array of 10 teams
curl http://localhost:5001/api/olemiss/dashboard | head -c 200
```

Then open http://localhost:5173, run a prediction on `/predictor`, and log in with the demo account.

## Troubleshooting

| Symptom | Cause & fix |
| --- | --- |
| API won't start / `EADDRINUSE` on 5000 | macOS AirPlay Receiver owns port 5000. Set `PORT=5001` in `server/.env` and `VITE_API_URL=http://localhost:5001/api` in `client/.env`. |
| `P1001: Can't reach database server` | PostgreSQL isn't running: `brew services start postgresql@17`. If the DB doesn't exist: `createdb cfb_predictor`. |
| `Environment variable not found: DATABASE_URL` | You haven't created `server/.env` — copy `server/.env.example` and fill in `DATABASE_URL` + `JWT_SECRET`. |
| Frontend loads but every page shows an error state | The API isn't running or the client's `VITE_API_URL` port doesn't match `server/.env` `PORT`. Restart Vite after changing `client/.env`. |
| Logged out unexpectedly / `401` on `/api/auth/me` | Expected after `npm run seed` — reseeding wipes users, so old JWTs are invalid. The app clears the stale token automatically; just log in again (`demo@cfb.dev` / `password123`). |
| Teams/dashboard return empty or 404 | The database was migrated but not seeded. Run `npm run seed` from the repo root. |

## Future Improvements

- Connect a real data source (CollegeFootballData API) behind the existing service layer
- Replace the formula engine with a trained model (logistic regression / gradient boosting) and compare calibration
- Historical backtesting: score the model against past seasons
- All 136 FBS teams, conference filters, and search
- Head-to-head history and player-level stats
- Deploy (Render/Fly/Railway + Neon/Supabase Postgres) with CI

## Resume Bullet

> Developed a full-stack college football analytics platform using React, TypeScript, Node.js, PostgreSQL, and Prisma, featuring team comparison dashboards, user authentication, saved predictions, and an explainable matchup prediction engine.
