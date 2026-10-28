# CCAS Swimming Carnival app

Web app to run the Central Coast Adventist School (CCAS) swimming carnival, February 2027, at Mingara pool.

Owner: Jordan, PDHPE Head of Department at CCAS.

**Swimming only.** Cross country and athletics are separate projects.

## Where the truth lives (in this order)

1. **`PROJECT-STATE.md`** (the latest dated version) holds:
   - the decisions (numbered);
   - the open questions;
   - the next steps.

   It wins over anything else. If something conflicts with it, follow it and tell Jordan.
2. **The design canvas** (S1.1 to S1.38): https://claude.ai/artifact/XhQHZdJAwjyhP2K27GApn8
3. **The working app**, Swim Opt 1.5: https://claude.ai/artifact/HwqWg91FJcq2coJe2eyiNA. Its source is in `src/`.
4. **`baseline/`:** 384 screenshots of every screen as it must look.

## Rules for every reply, file and screen

- Australian spelling. Simple, direct language.
- No em dashes anywhere: replies, code comments, app text, docs. En dashes are fine in number ranges (Years 7–10).
- No emojis.
- Money in AUD, rounded to the nearest dollar.
- Never use these words: delve, realm, unleash, tapestry, holistic, synthesize, substantiate, paramount, empirical, transcend, pivotal.
- Number every app change as **Swim Opt X.Y**. The first Claude Code release is Swim Opt 2.0. Design changes are S X.Y; the next is S1.39.
- After any decision, answered question or finished work, update `PROJECT-STATE.md`: write a new dated version, and tell Jordan what changed.
- Ask Jordan any open questions from PROJECT-STATE instead of letting them sit.
- When a session gets long, remind Jordan of the handover routine: a new dated PROJECT-STATE, then a fresh session.

## The look must not change

The look is approved, board by board. Keep it exactly:
- the same markup, CSS and tokens;
- Red Hat Display, Text and Mono;
- the CCAS navy #1d3160 and yellow #ffc907;
- the house colours: Bradman red, Jackson green, Newcombe blue;
- the medals;
- the pink judge-swapped times;
- touch targets of 48 px or more;
- light and dark themes.

Any visual change needs Jordan's OK first.

Before Jordan sees any build, all three checks must pass, in order:

1. **Pixel diff.** Run `tests/visual_diff.py` against `baseline-mac/` (decision 101), at every screen, size and theme. The threshold is 0.1%. `baseline-mac/` was shot on Jordan's Mac from the untouched Swim Opt 1.5; `baseline/` (shot on another machine, so its text smoothing differs) stays as the record of the approved look and is used by check 3. If one whole device and theme set fails by a small amount, re-run just that set before calling it a failure: one-off text smoothing changes happen.
2. **Claude in Chrome walk-through.** Use Jordan's Chrome through the Claude in Chrome extension. Run the full carnival flow at each device size, and compare each screen with its baseline image. Read the console and network logs.
3. **Fresh-eyes review.** A separate agent that did not build it compares the baseline with the new screenshots. It lists every difference and checks both themes, no sideways scroll on a phone, contrast and tap targets.

A failure goes back to the build, never to Jordan.

## Repo layout (Swim Opt 2.0)

- `index.html`, `css/styles.css`, `js/core.js`, `js/store-local.js`, `js/ui1.js` to `js/ui5.js`: the app. The ui files hold small Supabase hooks (PIN on the server); each only runs when Supabase is on.
- `js/store-supabase.js`: the Supabase store (same calls as `store-local.js`). `js/config.js`: project URL and publishable key. `js/vendor/supabase.js`: supabase-js 2.117.3, loaded only when Supabase is on (loading it changes the test-mode made-up slip times, so test mode must never load it).
- `js/test-students.js`: the 620 test students for the page. `supabase/01-setup.sql` (tables, row-level security, functions; safe to run again) and `supabase/02-seed-test-students.sql` (made by `tools/make_seed.py`).
- `src/`: the Swim Opt 1.5 source, kept for reference. `SETUP.md`: Jordan's Supabase steps.

## How to run and test

No Homebrew or admin on Jordan's Mac. Tools live in `../.venv` (Python 3.9 with Playwright, Chromium, Pillow, pgserver, psycopg). Node is Playwright's copy: `../.venv/lib/python3.9/site-packages/playwright/driver/node`.

- Serve: `python3 -m http.server 8102 --bind 127.0.0.1` from this folder (run it in the background).
- Test mode: add `?mode=local` to the address. Without it the page uses the Supabase project in `js/config.js`.
- Engine: `<node> tests/engine.test.js`.
- Rules: `../.venv/bin/python tests/sql_test.py` (throwaway local Postgres, no Supabase needed).
- Flow (test mode): `../.venv/bin/python tests/flow.py "http://127.0.0.1:8102/?mode=local"`, run from a scratch folder (it writes `flow-shots/`).
- Check 1: `tests/baseline_shots.py "http://127.0.0.1:8102/?mode=local" <out>` (about 5 minutes), then `tests/visual_diff.py baseline-mac <out>`.
- Live (staging project only; it clears the carnival data): `../.venv/bin/python tests/supabase_live.py http://127.0.0.1:8102/`. Each run signs in about 25 test devices and the project allows 100 anonymous sign-ins an hour, so leave about 20 minutes between runs, or failures are the limit, not the app.

## Privacy

- **Made-up data only:** use the 620 test students (`src/test-students.json`). Real student names wait until the principal and ICT approve (question 1). The privacy summary must also be updated first (problem 14).
- **No date of birth is ever stored.** DOB is used on the organiser's computer only, to work out the age group.
- **No secrets in the repo.** Supabase keys go in a config file that Jordan fills in. Only the public anon key goes in the page; security comes from row-level security.

## Devices

| Job | Device and size |
|---|---|
| Marshal, Place Judge, Announcer | iPad, landscape 1180 x 820 or portrait 820 x 1180 |
| Recorder, Results, Carnival Organiser | MacBook, 1512 x 982 |
| Time Slips | Phone, 390 x 844 |

Every screen must also work on the other sizes.
