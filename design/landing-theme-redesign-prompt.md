# Prompt: redesign the swimming pages to match the onlinecarnivals.au landing page

Written 12 November 2026 (PROJECT-STATE version e). Paste everything below the line into a fresh Claude Code session opened in the `ccas-swimming` folder. Athletics and cross country are separate projects: give each of their sessions a copy of this prompt with the page list in part 3 changed to suit.

---

## 1. What I want

The landing page for onlinecarnivals.au is built and approved (Swim Opt 2.21, `landing/index.html`, design D "The Track", decisions 176 and 177). I want the rest of the swimming site to look like it belongs to the same family. **Design only in this session: draw it, do not build it.** Nothing in `index.html`, `css/`, `js/` or `parents/` changes until I have seen the designs and said OK.

## 2. Read first, in this order

1. `CLAUDE.md` (rules, devices, the three checks).
2. `PROJECT-STATE.md`, the newest dated version: section 0, the newest "Changes on" notes, then sections 6 and 7. It wins over anything else, including this prompt; tell me if they conflict.
3. `landing/index.html`, all of it. It is the source of the new theme.
4. The current app: `index.html`, `css/styles.css`, `parents/`. Serve it with `python3 -m http.server 8102 --bind 127.0.0.1` and open `?mode=local` (test mode, made-up data). Look at every screen at every device size, both themes.
5. `baseline-mac/` and the newest check 1 shots named in PROJECT-STATE section 0: how every screen looks now.

## 3. Pages in scope

Draw each in light and dark, at its main device size plus a phone (390 x 844):

- **A. Parents results page** (`parents/`), iPhone first. Closest to the landing page in purpose; do this first.
- **B. App home and PIN sign-in**, MacBook 1512 x 982, iPad 1180 x 820 and iPhone.
- **C. Job screens:** Marshal (iPad landscape and portrait), Place Judge, Time Slips and Announcer (iPhone), Recorder and Results (MacBook), Carnival Organiser, all 9 sections (MacBook).

Show A and B first and stop for my OK before drawing C.

## 4. The landing page theme, to carry across

Take the exact values from `landing/index.html`; this is a summary.

- **Fonts:** Red Hat Display 900 for big headings (uppercase, tight letter spacing), Red Hat Text for body, Red Hat Mono for labels, times, race numbers and the ticker. The same three fonts the app already uses.
- **Colours (tokens on `:root`, light theme under `[data-theme="light"]`):**
  - dark: background #0b1226, text #ffffff, muted #b9c2de, lines rgba(255,255,255,.28);
  - light: background #f3f5fb, text #14203f, muted #4a5573, lines rgba(20,32,63,.3);
  - CCAS navy #1d3160 and yellow #ffc907; in light theme, yellow text becomes #8a6c00 (contrast);
  - lane colours blue #1f5fbf, gold #d4a300 (light #b8920a), green #1a8a4a (light #15783e).
- **Pieces:**
  - the yellow ticker strip, Red Hat Mono 14 px, 36 px tall;
  - the brand bar "ONLINE**CARNIVALS**.AU" with the Light/Dark button;
  - the big uppercase headline with one outlined word and one yellow word;
  - 3 px dashed lane lines;
  - big outlined numbers that fill on hover;
  - the yellow "runner" dot with its trail;
  - yellow primary buttons and outlined secondary buttons, 12 px corners, 48 px tall;
  - focus rings that show on every background (#8db6ff dark, #1d3160 light, white or navy on coloured lanes).
- **Effects:** film grain, a glow that follows the pointer, magnetic buttons, letters that scramble into names, a glitch on hover, a headline wipe. All of them stop under reduced motion.

## 5. What must not change

- **What the app does.** Same buttons, same order, same words (any change to app text needs my OK), same flow, same data. No change to JavaScript logic, the stores, Supabase, the SQL, PINs or test mode. The test scripts (`tests/flow.py`, `tests/flow27.py`, `tests/engine.test.js`, `tests/sql_test.py`) must still pass after the build, unchanged apart from screenshot names.
- **Colours that carry meaning:**
  - house colours: Bradman red, Jackson green, Newcombe blue;
  - gold, silver and bronze medals;
  - the pink judge-swapped times;
  - the yellow "check this" slips;
  - the NEW RECORD tag.
  These keep their meaning, and stay clear from the new lane colours. In particular, Jackson green and Newcombe blue must not be mixed up with the cross country green and swimming blue.
- **CCAS names and colours.** Selling to other schools is parked (decision 175), so no per-school settings.
- **Touch targets of 48 px or more**, light and dark themes, no sideways scroll on a phone.

## 6. Rules for the job screens (part C)

The landing page is a shop window. The job screens are tools used fast, outdoors, by volunteers, on battery, on 3 February 2027. So:

- **Readable in sunlight at Mingara.** Body text contrast at least 4.5:1, large text and buttons at least 3:1; aim higher on the Place Judge, Time Slips and Marshal screens. Say which theme you suggest outdoors.
- **No moving effects on job screens:** no grain, glitch, scramble, magnetic buttons or pointer glow. They cost battery, distract, and the pointer ones do nothing on a touch screen. The ticker and runner only where they add something, and never over a button. Offer them as an option, off by default.
- **Nothing moves under a finger.** No hover-only information (iPads and iPhones have no hover). No layout shift when a race loads.
- **Times, lanes and places stay large and in Red Hat Mono**, the same size or bigger than now.
- **Speed.** No new libraries, no new web fonts beyond the three, nothing that slows a cheap phone. The pages must still work with patchy signal.

## 7. How to draw it

- Make a new design, numbered **S1.46** (the next free number; check PROJECT-STATE). Publish it as a private claude.ai artifact, like the design canvas (S1.1 to S1.38).
- Use the app's real markup and CSS with a theme layer on top, and the made-up test students. Do not redraw from scratch.
- For each screen, put the current look (from the newest shots) beside the new one.
- Under each screen, list every change in plain words, and the lowest contrast on that screen.
- Check each drawing: both themes, every size in part 3, no sideways scroll, no button cut off, tap targets, reduced motion.

## 8. What to give me at the end

1. The S1.46 link.
2. A short list of choices for me to make, each with your suggestion. For example:
   - how far to go: parents page only, parents plus home, or every screen;
   - effects on or off on job screens;
   - which theme outdoors;
   - whether the ticker shows on the app.
3. The risks, plainly:
   - staff who have already practised on the current look;
   - time left before 3 February 2027;
   - check 1 needs a new set of reference shots after the change;
   - anything that could break the flow.
4. A build plan: which Swim Opt numbers, in what order, and how each passes checks 1 to 3 when the look changes on purpose. Check 1 then compares against new reference shots taken from the approved design, not the old ones.

## 9. House rules

- Australian spelling, simple direct words, no em dashes, no emojis. Money in AUD to the nearest dollar.
- Never use: delve, realm, unleash, tapestry, holistic, synthesize, substantiate, paramount, empirical, transcend, pivotal.
- After my answers, write a new dated PROJECT-STATE version and tell me what changed.
- Commit on `staging` only. Never push without my word.
- Made-up data only. No date of birth stored. No secrets in the repo.
