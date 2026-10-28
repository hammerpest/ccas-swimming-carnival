# Handover: CCAS Swimming Carnival app to Claude Code

Date: 28 October 2026.

From: the "Carnival Website" Claude Project, Swim Opt 1.5 (PROJECT-STATE version o).

To: a new GitHub repo (suggested name `ccas-swimming-carnival`), hosted on GitHub Pages, with data in Supabase (Sydney).

Read `CLAUDE.md` first, then `PROJECT-STATE.md`, then this file.

## 1. What exists today

**Swim Opt 1.5** is a working app.

It runs inside Claude as a published page, using Claude's shared store (`db`) and live presence (`room`). It also has a one-device test mode, which uses browser storage and `BroadcastChannel`.

The source is 7 plain files in `src/`. `build.py` joins them into one HTML file:

| File | What it does |
|---|---|
| `core.js` | The rules engine, with no screen code: race types and groups, program events (74), the time parser (3412 = 34.12, 10234 = 1:02.34, 7512 is blocked), odd-time limits, the judge swap for each heat, timed finals across heats, tie points split, records (NEW or EQUALS), the HRIS Team List, house totals, age champions, and the student file parser (DOB used, never kept) |
| `store.js` | The storage layer. The same calls are used everywhere: `onDoc`, `onCol`, `get`, `set`, `update`, `del`, `nextRace`, `presence`, `onPeers`, `pending`. It holds `claudeStore` (Claude), `localStore` (test mode) and an offline queue |
| `ui1.js` | The shell: state, PINs (one per job), header, Job pill, home keypad, year picker, past years, modals |
| `ui2.js` | Marshal and Place Judge |
| `ui3.js` | Recorder and Time Slips |
| `ui4.js` | Announcer (with the program card), Results (race results, HRIS Team List, newsletter, Export CSV) and Houses |
| `ui5.js` | Carnival Organiser (8 sections), render, all click actions (`ACT`), boot |
| `styles.css` | All styling. CSS tokens for light and dark |

**Data paths** (each holds a JSON document):

| Path | Holds |
|---|---|
| `config/main` | Settings and the six PIN hashes |
| `roster/F`, `roster/M` | Students |
| `extras/<id>` | Swimmers added on the day |
| `heats/r0001` | One heat, with its race number |
| `times/r0001` | Lane times for that race |
| `finish/r0001` | The Place Judge's places |
| `slips/r0001` | What was read from the slip |
| `photos/r0001` | The slip photo |
| `records/all` | CCAS records |
| `counter/race` | The race number counter |
| `years/<year>` | A kept year |
| `archive/<year>-config`, `archive/<year>-roster`, `archive/<year>-data` | The kept year's data |
| `photos/y<year>-r0001` | The kept year's slip photos |

Places, points, totals, champions and pink times are worked out on each device. They are never stored.

**Test PINs** (change them on the Carnival Organiser screen):

| Job | PIN |
|---|---|
| Marshal | 1111 |
| Place Judge | 2222 |
| Recorder | 3333 |
| Time Slips | 4444 |
| Announcer | 5555 |
| Carnival Organiser | 9999 |

## 2. Decisions that shape the code (full list in PROJECT-STATE)

- **Race numbers:** one sequence all day, Race 1, 2, 3. Each heat sent takes the next number. There are never gaps, repeats or a restart during the day (40, 42).
- **The Place Judge** decides the top 4 in each heat. The heat's fastest times go to those places in the judge's order, and any moved time shows pink. Places across the heats come from times (timed finals) (28, 37, 38).
- **Dead heats** are allowed, but the judges must confirm. They are flagged for the Recorder and tagged DEAD HEAT (94).
- **Points:** 20, 15, 10 for the top three, then 5 for everyone else who finishes. DQ and DNS get 0. Ties split the points. Relays use the same scale but count for house totals only (93).
- **Age champion:** the most individual points, counting the 5 age races plus the 200 m freestyle. Equal points make joint champions (72).
- **HRIS Team List:** the top 2 in every race and group, relays included (90).
- **The Year 12 novelty race is removed** (91).
- **Times checked:** blocked while a lane has no time (92). Odd times ask "Keep or Fix" (50, 60).
- **One PIN per job** (88). The organiser PIN opens every job, and the Recorder stays a separate job (89).
- **Years:** only the organiser picks the year. Past years are look only, and everything is kept (95).
- **The program shows on the Announcer page** (96). There are no start times on job screens (27).
- **Time slips:** a phone photographs the Swiss Timing slip (51 to 59).
  - The slip reader is still in **test mode**: it saves the photo and makes up the times. The real reader needs real slip photos (question 30).
  - OCR (Tesseract.js) will work on GitHub Pages; it can't load inside a Claude page.

## 3. Build steps (as approved by Jordan, 28 October 2026)

1. **Swim Opt 2.0-a: port the app as is.**
   - Make a plain HTML, CSS and JS repo with no framework:
     - `index.html`, holding the page shell from `build.py`, with the head and fonts unchanged;
     - `css/styles.css`;
     - `js/core.js`;
     - `js/store-local.js`;
     - `js/ui1.js` to `js/ui5.js`.
   - Copy the files verbatim.
   - Pass check 1 (pixel diff against `baseline/`) before anything else.
2. **Swim Opt 2.0-b: Supabase (Sydney, ap-southeast-2).**
   - Write `js/store-supabase.js`, which makes the same calls as `store.js`.
   - **Tables:** one table per collection, plus `counter`. Each row holds `id text primary key, doc jsonb, updated_at timestamptz`, so the `ui*.js` files need no changes.
   - **`next_race()`:** a Postgres function with a row lock (`select ... for update`). Numbers come out in arrival order, with no gaps or repeats.
   - **PINs:**
     - Each device signs in anonymously (Supabase Auth).
     - `claim_role(pin)` (security definer) compares the PIN hash with a private `pins` table, and writes `sessions(user_id, role, year)`.
     - Row-level security reads `sessions`:
       - Marshal: writes `heats` and `extras`.
       - Place Judge: writes `finish`.
       - Recorder: writes `times`.
       - Time Slips: writes `times`, `slips` and the photo bucket.
       - Announcer: reads only.
       - Organiser: writes everything.
       - Everyone: read only when `config.locked`, and read only on `archive` and `years`.
     - Nobody reads anything without a role.
   - **Live updates:** Supabase Realtime row changes take over from `onSnapshot`. Realtime presence takes over from the room. It must still drive "Already selected" and the Recorder lock, and still free a lock when a device drops out.
   - **Photos:** a private Storage bucket `slips`.
   - **Offline:** keep the offline queue from `store.js`.
   - **Seed** the 620 test students only (`src/test-students.json`).
   - Keep `?mode=local` for one-device test mode.
3. **Swim Opt 2.0-c: GitHub Pages.**
   - A GitHub Actions deploy on every push to `main`.
   - A `staging` branch, with its own Supabase project, for tests.
4. **Jordan's setup steps.** Write them click by click, in simple language:
   - create the Supabase project (Sydney, free plan, $0);
   - run the migrations;
   - copy the URL and anon key into `js/config.js`;
   - turn on GitHub Pages;
   - change the PINs.
5. **Triple visual check** (see `CLAUDE.md`), then send Jordan:
   - the staging link;
   - a one-page note of what changed;
   - the check results.

## 4. Tests in this package

- `tests/engine.test.js` (run with `node tests/engine.test.js`). It covers:
  - the time parser;
  - the judge swap and a faster time outside the top 4;
  - tie points 12.5;
  - a record and the house totals;
  - age champions;
  - the student parser;
  - 74 program races.
- `tests/flow.py` (Playwright). It plays six devices in one browser (organiser, marshal, judge, phone, recorder, announcer), through:
  - a full carnival;
  - a dead heat;
  - starting a new year;
  - opening the past year.

  For Supabase, extend it with:
  - two marshals sending at once, getting different race numbers;
  - two Recorders on one race, where the second is locked;
  - the phone offline;
  - row-level security: the Marshal PIN can't write times, no PIN can't read, and a past year can't be written.
- `tests/baseline_shots.py` makes the screenshots. `tests/visual_diff.py` compares two folders.
- The Red Hat fonts must load from Google Fonts (or be bundled the same) for the diff to pass.
- `baseline/` holds 384 PNGs: 48 screens and states, at 4 sizes, in light and dark. The file names follow the pattern `<screen>-<state>-<device>-<theme>.png`.

**Known quirks in the baseline** (do not "fix" them without asking Jordan):
- **Full-page shots:** they can show the sticky header or a toast message mid-page. That comes from how the screenshot is taken.
- **Recorder on a phone:** a selected time box scrolls the lane table sideways.
- **Date fields:** they follow the browser's language. The baseline browser was set to en-AU but still drew US order.

## 5. Open questions (ask Jordan)

- **49:** which style option, A, B, C or D (or a mix, or keep the current look)? See https://claude.ai/artifact/FrNio15kHRpDrY9ifVozzp. Keep the current look until he picks.
- **1:** principal and ICT approval for real names. The privacy summary needs updating for kept years (problem 14).
- **36:** the CCAS records list. Also, do relays and the 200 m have records?
- **30:** real Swiss Timing slip photos, including empty lanes and a DQ or DNS.
- **2:** the confirmed carnival date (around 10 February 2027).
- **3:** a sample RE1 file from the next level, so the export matches it exactly.

## 6. First prompt to paste into Claude Code

> Read CLAUDE.md, PROJECT-STATE.md and HANDOVER.md in full. Confirm in a few lines where the project stands. Then start step 1 (Swim Opt 2.0-a): port the app as is into the repo layout in HANDOVER.md, run tests/engine.test.js and tests/flow.py, and run tests/visual_diff.py against baseline/. Do not change the look. Show me the results before starting Supabase.
