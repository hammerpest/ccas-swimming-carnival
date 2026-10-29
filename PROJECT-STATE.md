# PROJECT-STATE: CCAS Swimming Carnival App

Date: 29 October 2026, version j. Replaces 29 October version i and all earlier PROJECT-STATE files.

Changes on 29 October 2026 (version j): Jordan answered question 57: when a race already has a slip, a new photo asks "Replace the Race N slip?" first (decision 117). Built on staging; test mode flow and all 384 screens unchanged apart from the new box.

Changes on 29 October 2026 (version i): Jordan accepted the reader limits it cannot see (decision 115) and said no time-of-day check (decision 116). Check 3 run 4: look PASS; reader gaps fixed except faded race digits (2.22). Main now deploys with version-stamped files too (main app still Swim Opt 2.0). Question 57 open.

Changes on 29 October 2026 (version h): Checks 2 and 3 run on Swim Opt 2.1 (2.21). Check 2 passed. Check 3 ran three times: the look passed every time; the slip reader failed twice and was made much safer each time (2.21). Deploys now version-stamp the app files. Staging data cleared (620 test students kept). Waiting for Jordan to try 2.1 on staging and decide on the residual reader risks (question 56).

Changes on 29 October 2026 (version g): Jordan asked for a way to change marshalling after a race is sent (decisions 113 and 114). Planned as Swim Opt 2.2, after 2.1 is approved. Checks 2 and 3 on 2.1 under way (check 2 waiting for Claude in Chrome to reconnect).

Changes on 29 October 2026 (version f): Jordan approved the 48 px tap sizes (rest of question 55, decision 111), showed how to read the slip (question 30 answered with a simulated sample, decision 110) and asked for Slip added ticks and the slip photo on the Recorder (decision 112). All built as Swim Opt 2.1 on staging (2.20). Checks 2 and 3 on 2.1 still to run.

Changes on 29 October 2026 (version e): Jordan picked S1.39 Option A for the colours (decision 109). Built as Swim Opt 2.1 on the staging branch only (2.19); main stays Swim Opt 2.0. Tap sizes not decided yet. Checks 2 and 3 not yet run on 2.1.

Changes on 29 October 2026 (version d): S1.39 options drawn for question 55 (2.18). Nothing in the app changed; waiting for Jordan to pick.

Changes on 29 October 2026 (version c): Check 3 (fresh-eyes review) PASSED, see 2.17. All three checks now pass on the GitHub Pages build. New question 55: fix the contrast and small tap targets that were already in the approved look?

Changes on 29 October 2026 (version b): Check 2 (Claude in Chrome walk-through) PASSED on the staging link, see 2.16. Decision 108 recorded in version a's second save.

Changes on 29 October 2026 (version a): Jordan made the push token and pushed main and staging to https://github.com/hammerpest/ccas-swimming-carnival. The token is saved in the Mac Keychain, so Claude can push from now on. Repo set up in Chrome: Pages source GitHub Actions, staging allowed in the github-pages environment, email kept private. Question 54 answered by doing: the repo is public (decision 107). GitHub Actions was switched off on the new repo, so nothing published at first; Claude switched it on (Actions tab, Enable Actions on this repository) and ran the workflow. Both links are LIVE: https://hammerpest.github.io/ccas-swimming-carnival/ (main) and https://hammerpest.github.io/ccas-swimming-carnival/staging/ (staging). Both load with the staging Supabase project and no console errors. Swim Opt 2.0-c is DONE apart from checks 2 and 3. Decision 108: main uses the staging Supabase project for now.

Changes on 28 October 2026 (version u): Swim Opt 2.0-c started (2.15). The folder is now a git repo (branch main, first commit, then a staging branch). Added .gitignore and .github/workflows/pages.yml: every push to main or staging publishes main at the site root and staging at /staging/. Tested locally from a sub-folder: six-device flow no errors, Supabase mode loads with no errors. Waiting for Jordan's GitHub steps (account, repo, token, Pages setting). No look change. New question 54 (repo public or private).

Changes on 28 October 2026 (version t): HANDOVER TO A FRESH CLAUDE CODE SESSION. Section 0 and section 7 rewritten for where things stand now. No new decisions. CLAUDE.md updated with the repo layout, how to run and test, and check 1 against baseline-mac/ (decision 101).

Changes on 28 October 2026 (version s, second save): Jordan answered questions 51 and 53 and the two PIN and home screen points (decisions 102 to 105). PIN table bug fixed (103). Question 52 still open (Jordan asked for an example).

Changes on 28 October 2026 (version s): Jordan made the staging Supabase project (ccas-swimming-staging, Sydney ap-southeast-2; a first try landed in Mumbai and was deleted). The app now runs on it. Live tests written (tests/supabase_live.py) and three bugs found and fixed, see 2.14. Test mode still passes check 1 (384 of 384).

Changes on 28 October 2026 (version r): Jordan answered question 50 (decision 101): check 1 runs against baseline-mac/, shot on this Mac from the untouched Swim Opt 1.5. Swim Opt 2.0-a passes check 1 (384 of 384). Swim Opt 2.0-b (Supabase) written and tested locally, see 2.13. Waiting for Jordan to make the staging project (SETUP.md) before the live tests. New questions 51 to 53.

Changes on 28 October 2026 (version q): Swim Opt 2.0-a (port as is) built and tested, see 2.12. Engine tests and the six-device flow pass. The port draws every screen pixel for pixel the same as Swim Opt 1.5 on Jordan's Mac. But check 1 against baseline/ fails for the port AND for the untouched Swim Opt 1.5, by the same amounts, because this Mac smooths text differently from the machine that took baseline/ (problem 15, question 50). Supabase not started.

Changes on 28 October 2026 (version p): first Claude Code session. Jordan answered questions 49, 36 and 3 (decisions 98 to 100): keep the current look (no style option for now); relays and the 200 m freestyle have records (list to come); the next level takes a HY3 file, not RE1. Questions 30, 1 and 2 stay open for later. Out-of-date lines tidied: section 0 next task, the 74-race program, the PIN note in 2.5, and next step 9 (Supabase is set up now with made-up data, decision 97). No app change yet.

Changes on 28 October 2026 (version o): HANDOVER TO CLAUDE CODE. Jordan approved the plan (decision 97): a new GitHub repo, the app moved to Supabase (Sydney) and GitHub Pages with made-up data only, the look kept exactly and checked three times before he sees it. Handover package made (2.11). Swim Opt 1.5 published (test-mode fixes only: each browser tab is its own device, and test mode now shows locks between tabs). The next build is Swim Opt 2.0, in Claude Code.

Changes on 28 October 2026 (version n): Carnival years (decision 95): after the organiser PIN, the organiser picks the year; past years are kept whole and are look only. Start a new carnival now keeps the year before clearing. This changes decisions 6, 41 and 48 (see notes on them) and adds problem 14 (privacy). Event program added to the Announcer page (decision 96). Built and published as Swim Opt 1.4 (same link).

Changes on 28 October 2026 (version m): Jordan answered questions 44 to 48 (decisions 90 to 94). Relays are on the HRIS Team List; the Year 12 novelty race is removed from the app (the program is now 74 races; any older mention of the novelty below is out of date); Times checked stays blocked while a lane has no time; relay points count for house totals only; dead heats are allowed but flagged, and place judges must split the result. Built and published as Swim Opt 1.3 (same link).

Changes on 28 October 2026 (version l): One PIN per job (decision 88, replaces 85 and the switching part of 82). Recorder stays separate from the Carnival Organiser (decision 89). Built and published as Swim Opt 1.2 (same link).

Changes on 28 October 2026 (version k): Jordan asked for style ideas from Dribbble, Mobbin, Tailwind Application UI and shadcn, to compare with the current look. Claude made a style options canvas with the Recorder screen in four styles (2.10). Nothing changes in the app until Jordan picks. New question 49.

Changes on 28 October 2026 (version j): Jordan asked for the Recorder's race buttons above the lane table, with the right side kept for the race overall only (decision 87). Built and published as Swim Opt 1.1 (same link).

Changes on 28 October 2026 (version i): Design doc updated with decisions 11 to 86 (step 3 DONE). Swim Opt 1 built and published (step 4 DONE), see 2.9. The 620 test students are loaded in its shared store. New questions 44 to 48 about choices Claude made in the build.

Changes on 28 October 2026 (version h): Question 42 answered: no changes to Home or Carnival Organiser, both approved, the design canvas is complete (decision 86). Next: update the design doc (step 3), then build Swim Opt 1 (step 4).

Changes on 28 October 2026 (version g): handover brief for a new chat. Section 0 rewritten; canvas table, screens list and Carnival Organiser notes brought up to date. No new decisions.

Changes on 28 October 2026 (version f): Jordan confirmed the Carnival Organiser has its own PIN, different from the one shared helper PIN everyone else uses (decision 85). Already drawn that way; no board change.

Changes on 28 October 2026 (version e): Setup renamed "Carnival Organiser" everywhere (decision 84): home tile, header badge and Job drop-down. Still organiser PIN only; helpers never see it. Drawn S1.38 (Home and the Carnival Organiser board).

Changes on 28 October 2026 (version d): Question 43 answered: keep "Job" (decision 83).

Changes on 28 October 2026 (version c): Jordan liked a "Role: Marshal" drop-down pill for changing jobs. S1.37: the "Change job" link on every job screen is replaced by a "Job: Marshal" pill with a drop-down (decision 82).

Changes on 28 October 2026 (version b): Jordan answered question 41 a to f, all yes (decision 81). Setup S1.36 now uses the 620 test students (columns Surname, Firstname, House, Sex, DOB; 620 ready; first rows Ahmed, Ayla and so on).

Changes on 28 October 2026 (first save): Jordan added "CCAS XC test students 620.xlsx" to Project Knowledge. It is the test student list for this app (decision 80). Checked: 620 made-up students, all rows valid, swim age groups and houses listed in 2.8.

Changes in z12: Question 40 answered: Results link removed from the Recorder (decision 77). Announcer (S1.31), Home (S1.32), Results (S1.28) and Houses (S1.30) approved (78). Question 6 answered: the organiser types the organiser PIN on the same keypad and gets a 6th Setup tile (79). Drawn: S1.33, S1.34, S1.35.

Changes in z7 to z11: Houses board (S1.29, S1.30, decision 68); questions 34 to 37 answered (69 to 72); Announcer added as 5th job (73 to 75); parent live page parked (76).

Earlier (27 October 2026): reviewed S1.21 to S1.23; answered question 31 and review points B, C, D; Record S1.24 and Time Slips S1.25; boards approved; phone 2 by 2 home and wrong PIN message; Results redrawn S1.26; HRIS Team List rename S1.27; records broken in the announcer box S1.28; records upload and carry-forward rules.
Owner: Jordan (PDHPE Head of Department, Central Coast Adventist School, Erina NSW)

## 0. Where things stand (read first)

- Project is ONLY the swimming carnival app. Cross country (Opt 13) is a reference only. Athletics is out of scope.
- The look is approved and must not change (CLAUDE.md, decision 98). Design canvas COMPLETE at S1.38.
- Six PINs, one per job (decision 88). Test PINs: Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444, Announcer 5555, Carnival Organiser 9999. Keep 4 digits (104).
- Made-up data only: the 620 test students (src/test-students.json). No real names until the principal and ICT approve (question 1, problem 14).
- Swim Opt 2.0 is being built in Claude Code, in the folder "SWIM 2027- App/ccas-swimming" on Jordan's Mac:
  - 2.0-a (port as is): DONE (2.12). Plain HTML, CSS and JS; files copied unchanged.
  - 2.0-b (Supabase): DONE (2.13, 2.14). Staging project ccas-swimming-staging in Sydney, URL and publishable key in js/config.js. Live tests 30 of 30, rules tests 49 of 49, check 1 384 of 384 (test mode).
  - 2.0-c (GitHub Pages): DONE (2.15). Live at https://hammerpest.github.io/ccas-swimming-carnival/ (main) and /staging/ (staging). Claude can push (token in the Keychain).
  - Then checks 2 (Claude in Chrome walk-through) and 3 (fresh-eyes review) on the GitHub Pages staging link, then send Jordan the link, a one-page note of what changed and the check results (HANDOVER.md step 5).
- Small app changes made in 2.0 (all need no design OK, or Jordan has OKed them): PIN checked on the server (ui1.js, ui5.js); new toast "No connection. Try again." (102); PIN table fix (103); refused-save toast now "Not saved. Calling Tech Boy to help you. Enjoy grandstand duty next year." (106).
- Next level export: a HY3 file, not RE1 (decision 100). Waiting for a sample.
- Jordan is new to Supabase and GitHub. Jordan follows numbered click-by-click steps well and checks details like the region.

---

## 1. Project goal

Build an easy web app to run the CCAS swimming carnival (February 2027), replacing the old Excel way:

- Helpers enter the PIN, pick a job (Marshal, Place Judge, Recorder, Time Slips, Announcer) and work on any device, all linked live. The organiser enters the organiser PIN and also gets Carnival Organiser.
- Places, house points, age champions, the HRIS Team List and a newsletter article are worked out automatically.
- Feeds Hy-Tek Meet Manager (MM) for the next level of competition (RE1 file).
- Hosted on GitHub Pages with Supabase so anyone with the link and PIN can use it without a Claude account.

---

## 2. Work completed

### 2.1 Reference: cross country app (Opt 13, NOT part of this project)

- Live (Claude artifact): https://claude.ai/artifact/T2Q1iJZvt36RdPcHrzcTQ4. Source: claude/ccas-xc-app-opt13.html in Project Knowledge.
- Reused only for look and proven features: navy header, CCAS palette, Red Hat Display, subtle house colours, medals, student list import (paste or CSV, preview, problem rows), save lock between devices, offline queue ("X waiting to send"), Edit and Delete of latest entries, results lock, newsletter draft, CSV export, no DOB stored.

### 2.2 Swimming design (agreed)

Design doc (Claude doc): https://claude.ai/artifact/HZ925j4FKGWoxwPeJWE6cS, "CCAS Swimming Carnival App: Design". Updated 28 October 2026 with decisions 11 to 86: purpose, jobs and devices, how the day runs, entering results, points and records, screens, data and hosting, build plan, open questions. One old comment thread (on the timed finals line) was detached when that section was rewritten.

**Venue:** Mingara pool, 8 lanes, 50 m (long course, LCM in MM). Both are Carnival Organiser settings.
**Carnival date:** around 10 February 2027, NOT confirmed.

**Program (default; girls then boys within each event; 74 program events since the Year 12 novelty was removed, decision 91):**

| Start | Event | Groups | Program events | Event numbers |
|---|---|---|---|---|
| 8:55 am | 50 m butterfly | 13 & under, 14, 15, 16, 17, 18+ | 12 | 1 to 12 |
| 9:10 am | Carnival announcements | | | |
| 9:15 am | 50 m backstroke | 13 & under to 18+ | 12 | 13 to 24 |
| 10:00 am | 50 m freestyle | 13 & under to 18+ | 12 | 25 to 36 |
| 10:45 am | 100 m freestyle | 13 & under to 18+ | 12 | 37 to 48 |
| 11:30 am | 50 m breaststroke | 13 & under to 18+ | 12 | 49 to 60 |
| 12:15 pm | 200 m freestyle | Junior, Intermediate, Senior | 6 | 61 to 66 |
| 1:00 pm | 4 x 50 m freestyle relay, 2 teams per house | Junior, Intermediate, Senior (girls and boys alternate) | 6 | 67 to 72 |
| 1:25 pm | 4 x 50 m medley relay, 2 teams per house (if time allows) | Open girls, Open boys | 2 | 73 to 74 |
| 1:50 pm | (Year 12 novelty race REMOVED from the app, decision 91) | | | |
| 2:00 pm | Completion, clean up, presentation | | | |

- Printed program says "12:15am" for the 200 m freestyle; should be 12:15 pm.
- Age groups as at 31 December: 13 & under, 14, 15, 16, 17, 18+. Bands: Junior = 13 & under and 14; Intermediate = 15 and 16; Senior = 17 and 18+.
- Program event numbers (1 to 75) stay behind the scenes only, for MM and for joining heats into one result. On screen, people see RACE numbers, which climb with every heat sent (decisions 40 and 42). The printed program needs no numbers.

**Points (school information sheet, confirmed):**

| Result | Points | Counts for |
|---|---|---|
| 1st | 20 | House and age champion |
| 2nd | 15 | House and age champion |
| 3rd | 10 | House and age champion |
| 4th and below, finished | 5 | House and age champion |
| DQ / DNS | 0 | |
| Relay team (A and B score the same) | 20, 15, 10, 5 | House only |
| Year 12 novelty | No points | |

- Placegetters get only place points (not the 5 as well). All age groups count to house totals; highest total wins the perpetual trophy.
- Age champion = most individual points (no relay points) per age group and sex, plus runner up; equal points = joint champions.
- Equal times share the place and split the points.

**HRIS Team List:** top 2 in every race and group, relays included (top 2 teams) (decision 90). Names only, "Spot open" for gaps. Their times are the seed times.

### 2.3 How the day runs

Changing job (decision 82, S1.37): every job screen header has a pill on the right, "Job: Marshal" with a down arrow. Tap it: a drop-down "CHANGE JOB" lists 1 Marshal, 2 Place Judge, 3 Recorder, 4 Time Slips, 5 Announcer (Carnival Organiser too, only for the organiser), with the current job ticked, and "Sign out (back to PIN)" at the bottom. Picking a job goes straight there with no PIN. Results and Houses show "Job: Announcer". On the phone (Time Slips) the yellow job badge is dropped to make room; the pill shows the job. In the build, leaving the Marshal mid-heat with lanes filled should ask first.

Everything starts with the PIN. Home page "Swimming Carnival" shows 1 Marshal, 2 Place Judge, 3 Recorder, 4 Time Slips, 5 Announcer (decisions 54 and 73). If the organiser PIN is typed instead of the helper PIN, a 6th tile, Carnival Organiser ("Organiser only"), also shows (decisions 79 and 84). Wrong PIN: "That PIN is not right. Try again." (63, drawn S1.34). Any number of people per job, any device, anywhere, all live.

The whole day runs on one sequence: Race 1, Race 2, Race 3 and so on, from the first heat sent to the last. If the program order changes on the day, the marshal just picks the race being run and the sequence carries on (decision 42).

Order for every heat: Marshal sends it, starter starts it, Place Judge taps the top places, the printed time slip is photographed on a phone (or times are typed as a backup), the times appear on the Recorder page under that race number, the recorder checks them and presses Times checked.

1. **Marshal (S1.20, FINISHED; canvas boards (a) and (b)).**
   (a) Start screen, nothing picked at first, no headings, no times anywhere: Race buttons in program order (50 m fly, 50 m back, 50 m free, 100 m free, 50 m breast, 200 m free, Free relay, Medley relay, Year 12 novelty); Boys or Girls (hidden for novelty); Age (13 & under to 18+) or Junior/Intermediate/Senior (200 m free, free relay), Open (medley relay), Year 12 (novelty). Any race can be picked in any order. Check line above Go: large yellow RACE badge (the number this heat will get) plus the full name, for example "50 m backstroke, Girls 14". Missing choices: "NOT READY YET, Still to choose: ..."; pressing Go shows "Not ready yet" box ("You have not selected the race, boys or girls and the age.", "Go back and choose them (marked in yellow), then press Go.", "OK, go back"); missing rows get a yellow dashed outline. Same race and group already open on another marshal iPad: "Already selected" box ("50 m backstroke, Boys 14 has already been selected on another iPad. Please go back and choose another race or group.", Back).
   (b) Lanes screen looks like a pool from above: lanes 1 to 8 down the page, navy starting block with lane number, centre line, lane ropes. Lane 1 opens after Go. Tap a lane: drop-down list of that group's names only, in surname order (or the six house teams for relays); tap a name, it fills the lane and jumps to the next empty lane. List has "+ Not on the list", "Clear lane", "Close". Top bar: Back, RACE badge, race name and group, heat number, lanes filled, and two big buttons:
   - Next heat: sends this heat to the starter as the current race number, the number goes up by one, pool clears for the next heat of the same group. Bar: "Race 15 (Heat 1) sent to the starter". Swimmers in earlier heats greyed and cannot be picked again.
   - New race: if lanes are filled, "Confirm this heat" box ("Race 16 (Heat 2): 5 of 8 lanes filled. It will be sent to the starter, then you go back to choose a new race.", "< Back to lanes" / "Confirm this heat"). Then back to a blank start screen with a green line, for example "Races 15 to 16 sent to the starter (2 heats). Choose the new race below."
   Back returns to the start screen without sending.
2. Starter starts the heat. The pool's Swiss Timing system prints a slip with the race number, lane and time (decision 52). The slip's race numbers go 1, 2, 3 per heat, the same as the app (decision 57). No times are written by hand; the paper slip is kept as the backup (decision 53). The timing system may change later, so the slip reader must be easy to adjust.
3. **Place Judge (S1.20, rules settled).** Opens on the first race sent (Race 1) and shows it like the Marshal pool: names and house dots from the marshal (read only), yellow RACE badge, race name, group, heat. Each filled lane has a place spot at the right (wall) end. Tap spots in the order swimmers touch: first tap 1st, next tap 2nd, then 3rd, 4th (gold, silver, bronze, navy). After the top 4 (or fewer if the heat has fewer swimmers) other lanes show "By time". Tapping a placed spot removes it and later places move up. Dead heat (next tap gets the same place as the last), Undo last, Start again. Prompt line says what to do; turns green when done. Places save on every tap. Top bar:
   - Next race: goes to the next race the marshal has sent (a new heat or a new group). "Waiting for marshal" when nothing new. If fewer places are tapped than the heat needs, a simple "Confirm places" box ("Race 15, Heat 1: 2 of 4 places tapped.", "< Back to lanes" / "Confirm"). Times decide any untapped place.
   - Go to race: list of every race sent (badge, name, heat, "Top 4 done" / "2 of 4 placed" / "Not started"); tap to check or change ("Earlier race: changes save straight away").
   - Back to latest: shows when looking at an earlier race.
4. **Time Slips (S1.25; 4th job on the home page, phone screen, decisions 51, 54, 55, 57 to 59).** Shows the current race (yellow RACE badge, name, group, heat), starting at Race 1, with a big camera button. Take the photo: the app reads the lane and time for each lane and files them under that race number; they appear on the Recorder page under that race. A green message flashes for about a second ("Race 1 read, Sent to the Recorder"), then disappears and the Next race button appears. Next race goes to Race 2 with the camera button ready, so the person just rolls through every race. Check race is always available, to go back, check, or replace a slip with a new photo (new photo replaces that race's times). Race overall (all heats of the group) can also be viewed. The photo is kept with the race so the recorder can look at it.
   - Cannot read the photo (decision 58): red box "Could not read the slip. Hold the phone flat over the slip so all lanes and times are in the picture, with no glare. Then take it again." Camera button says "Take again". No Next race until a photo is read.
   - Wrong slip (decision 57): if the race number on the slip does not match the race on screen, red box "Wrong slip? This slip says Race 17. The screen is on Race 16. Find the Race 16 slip and take it again." Take again, no Next race.
   - No signal (decision 59): the photo is read and saved on the phone; amber flash "Saved on this phone. Sends when there is signal"; amber strip at the top "No signal. 1 photo waiting to send. It sends by itself when there is signal."; Next race still allowed. Check race shows "Waiting to send".
   - A slip read with some lanes missing still goes through; those lanes show "Not on slip" on the Recorder page.
5. **Recorder (S1.24, S1.33; rules settled by decisions 43 to 51, 60 and 77).**
   - Opens on Race 1, the first race sent. Shows the marshal's list (lane, name, house dot) plus the Place Judge's places, with the yellow RACE badge, race name, group and heat.
   - Header has the Job pill only. No Results link (decision 77); the Recorder sees the group's overall result in its own right panel.
   - Navigation like the Place Judge: Next race, Go to race (list of every race with its status: Waiting for slip, To check, Checked, On another device), Back to latest (decision 49). View slip photo shows the photo and what was read.
   - Times arrive from the phone photo and fill every lane of that race at once. The recorder can also tap a lane to type a time (digits only: 3412 = 34.12, 10234 = 1:02.34), or DNS / DQ, as a backup or to fix a lane. Each typed time saves straight away.
   - Times checked (decision 60): one big button at the bottom. Pressing it marks the heat as checked and moves to the next race to check. If a time is still marked to check (yellow), a box asks first: "< Back to times" or "Times are right" (keeps them and moves on). Changing a time later takes the race back to "To check". Button is grey when there are no times yet or the race is open on another device; green "Checked" once done.
   - Pink: any time moved by the Place Judge's ruling turns pink straight away, as it is typed or scanned. The slip time shows underneath.
   - Odd times ask for a second check using the starter limits in 2.3a. Never blocks; the recorder taps Keep or Fix. Typing a seconds part of 60 or more with no minutes (for example 7512) shows "Over 60 sec: add minutes" and cannot be saved until fixed (11512 = 1:15.12).
   - On the MacBook, the group's overall result (age, sex, distance, stroke) builds live as each heat comes in, shown beside the heat being entered.
   - Lock per heat: a race open on another Recorder shows "Being entered by another device. You can look, but times cannot be changed here until it is finished." Header shows "Online, all sent" (or the waiting count when offline). Offline queue and Edit as in the cross country reference.
6. **Working out results (two steps).**
   Step 1, each heat: the judge's order decides 1st to 4th. The heat's fastest recorded times go to the judge's top 4 in the judge's order; everyone else keeps the remaining times in time order. Any moved time shows pink. Example: timers have lane 4 22.00 and lane 5 22.05, judges have lane 5 first: lane 5 gets 22.00, lane 4 gets 22.05. A faster time outside the top 4 is a timing mistake and is swapped the same way.
   Step 2, the race overall: places across ALL heats of the group come from the times, using the swapped times (timed finals). Then points, house totals, champions. Live on every device, rebuilt every time a heat comes in or changes. The recorded time is always stored as typed or read; swaps are worked out, not stored.
7. **Results (S1.28 approved, S1.33).** Reached from the Announcer only (Full results link, decision 75). Header: RESULTS badge, Live, Back to Announcer, Job pill. One result per group, made of several races (for example "Races 13 and 14, 2 heats, timed final"). The announcer box "Records broken or equalled in this race" lists only records broken or equalled in that race (decisions 65 and 70): swimmer, house, new time, and the old record with holder and year (or "Shares the record with ..."), marked provisional until all heats are in and checked; otherwise "No records broken". The race header shows the current record. A broken record gets a NEW RECORD tag on the swimmer's row; an equal time gets EQUALS RECORD. Tabs: Race results, HRIS Team List, Newsletter draft; Export CSV.
8. **Records (decisions 65 to 67, 70, 71).** CCAS records (one per race and group) are uploaded in Carnival Organiser at some point before the carnival. When a new carnival is set up the next year, Carnival Organiser asks whether to bring in the updated records from all previous carnivals (old records plus any broken or equalled this year), so records carry forward year to year.
9. **Houses (S1.30 approved, S1.33 back link).** iPad landscape. Header: HOUSES badge, Live, Results, Back to Announcer, Job pill. Reached from the Announcer header (Houses link) and from the "Houses page" link on Results (decision 75). Status chip "Provisional, 26 of 75 results in" (final when every race is in and Times checked). Three house cards in rank order: medal-coloured rank, house dot with letter, name, total points, bar, "Individual 412, relays not swum yet". No points gap shown (decision 68). Left panel "Points by age group": each age group's points per house (girls and boys together), top score in each row bold, a Relays row, and a Total row. Right panel "Age champions": per age group, girls and boys, champion (gold) and runner up (silver) with house dot and points; joint champions and joint runners up both listed; status chip per age group ("Provisional, 2 of 6"). Legend underneath.
10. **Announcer (S1.31 approved; decisions 73 to 75).** 5th job on the home page, same helper PIN, iPad landscape or laptop at the microphone. Header: ANNOUNCER badge, Live, Full results (to Results), Houses, Job pill. Left: navy "In the water now" strip with the RACE badge, race name, group and heat the marshal last sent. Below it "Read out next": the next checked result to read (RACE badges, group name, "Races 15 and 16, 2 heats, timed final", Final chip), top 3 in big type with medal, name, house dot and house name, time, and a NEW RECORD or EQUALS RECORD tag; "2 more ready" or "Up to date" chip; buttons "< Earlier result" and "Next result" ("Waiting for the next result" when none). Checked results only. Right: "Records broken today" cards and House standings (rank, house, points, bar, Provisional, no points gap). No age champions (74).
11. **Carnival Organiser (was Setup; S1.35, S1.36, S1.38 APPROVED; decisions 79, 81, 84, 85, 86).** MacBook. Reached only with the Carnival Organiser PIN (6th tile on Home, "Carnival Organiser"). Header: CARNIVAL ORGANISER badge, "Job: Carnival Organiser" drop-down (lists the 5 jobs plus Carnival Organiser), "Organiser PIN only", "Online, all saved". Left list of 8 sections with a status line under each (warnings in amber):
   1. Carnival details: name, date (marked "Not confirmed yet"), age as at 31/12/2026, pool, lanes (- and + buttons, 4 to 10), pool length (50 m LCM or 25 m SCM), helper PIN and organiser PIN (each with Change), next race number (RACE 1; only goes back to 1 with Start a new carnival).
   2. Students: Paste list or Choose CSV file (columns Surname, Firstname, House B/J/N, Sex F/M, DOB, matching the test file, decision 81f); blue note that DOB is used on this computer only to work out the age group, never saved or sent; preview shows "620 ready", "No problems". A list with problems shows a red count, pink rows (for example "No house. Pick one.", "Sex not M or F. Fix it.") and Fix problems. Import students. Note that "+ Not on the list" still works on the day.
   3. Program: the 9 race types in swim order with up and down buttons, start time, groups, number of races and an on/off switch (medley relay and novelty can be turned off); total line "75 races on the program"; Print program and Print blank lane cards.
   4. Points: editable boxes for 1st 20, 2nd 15, 3rd 10, 4th and below 5, DQ or DNS 0, relay places; notes on relays, age champions (5 age races plus the 200 m freestyle) and novelty (no points).
   5. Odd-time limits: the 2.3a table with editable fast and slow limits; note about the 60-second and digit checks.
   6. Records: Upload records list and + Add one; amber note "Waiting for the CCAS records list"; table (race, group, time, holder, house, year); note that records broken this carnival are added automatically once their race is Final, and next year Start a new carnival asks whether to bring them in.
   7. Export: Meet Manager file (RE1): load the original student list with DOB on this computer, then Write RE1 file (greyed until the sample arrives); Results backup (CSV): every heat, time, place, points, house totals and age champions; note that there are no automatic backups.
   8. Lock and new carnival: Lock results switch (locked = helpers can look but not change anything; Unlock to undo); Start a new carnival (red box): clears the student list, heats, places and results, race number back to 1, keeps settings, program, points, limits and records; "Export the CSV first. This cannot be undone." Two-step box: step 1 lists what is deleted and kept and asks for the organiser PIN ("< Back" / "Clear and continue"); step 2 "Bring in the updated records?" ("No, I will upload a list" / "Yes, bring them in"); then a green line "New carnival ready. Race number back to 1. ...".

**2.3a Starter odd-time limits (Claude's suggestion, accepted by Jordan for now, decision 50; real limits later).** A time outside these asks "Check this time" with Keep or Fix. One set for all ages for now; age-based limits can be added later (for example from CCAS records).

| Race | Check if faster than | Check if slower than |
|---|---|---|
| 50 m butterfly | 26.00 | 1:30.00 |
| 50 m backstroke | 27.00 | 1:30.00 |
| 50 m freestyle | 23.00 | 1:30.00 |
| 50 m breaststroke | 30.00 | 1:45.00 |
| 100 m freestyle | 52.00 | 3:00.00 |
| 200 m freestyle | 1:55.00 | 6:00.00 |
| 4 x 50 m freestyle relay | 1:40.00 | 5:00.00 |
| 4 x 50 m medley relay | 1:50.00 | 5:30.00 |
| Year 12 novelty | No check | No check |

Also always checked: a seconds part of 60 or more without minutes (for example 7512), and a time with too many or too few digits. Limits editable in Carnival Organiser.

Other agreed points:
- Relays: each house has an A and B team (6 teams, one heat). Team = house plus letter; swimmer names optional.
- False start rule: whole heat on a warning; anyone who breaks on a warning is DQ. App only needs DQ.
- Swimmers can be added on the day ("+ Not on the list").

**Screens:** Home (PIN, then job; organiser PIN adds Carnival Organiser), Marshal, Place Judge, Recorder, Time Slips, Announcer, Results (results in swim order, medals, filters, HRIS Team List, Newsletter, Export CSV), Houses (standings, points by age group, age champions), Carnival Organiser (see 2.3 point 11). Each job sees only its own screen. Results and Houses are reached from the Announcer only (decisions 75 and 77). Carnival Organiser is reached only with the organiser PIN (79, 84).

**Data structure:**

| Record | Holds |
|---|---|
| config/main | Carnival name, date, age date, pool, lanes, pool length, points scale, odd-time limits, program order and on/off, lock, next race number |
| roster/F, roster/M | Students: id, name, house, sex, age group (no DOB) |
| extras/{id} | Swimmers added on the day |
| events/{no} | Program event number, age, sex, stroke, distance, relay or not, on or off |
| heats/{race-no} | Race number (given when sent), program event, heat number, lanes (swimmer id or relay team), time, status, time source (typed or photo); marshalled by and when; saved by and when; times checked by and when (cleared if a time changes) |
| slips/{race-no} | Photo of the time slip, the race number and the lanes and times read from it, taken by and when (replaced if a new photo is taken) |
| finish/{race-no} | Place Judge's top places: lane and place, dead heats; saved on every tap |
| years/{year}, archive/{year}-config, archive/{year}-roster, archive/{year}-data, photos/y{year}-{race} | Kept past years, look only (decision 95) |
| records/{event} | CCAS record for each race and group: time, holder(s), house (if known), year. Uploaded in Carnival Organiser; updated records carried into the next carnival (67) |
| entries/{event}/{id} | Pre-entries and seed times (not needed for 2027) |

Places, points, totals, champions and swapped (pink) times are worked out on each device, never stored. PINs are not stored in plain text in the app files.

### 2.4 Meet Manager research

- RE1 = MM registration file (athletes only), File > Import > Registration File. Semicolon-delimited. Header line with 5 fields (file title; date created; creator; software version; optional code). One line per athlete, 10 fields: ID; last name; first name; middle initial; sex (M/F); birth date (MM/DD/YYYY in the US spec); team abbreviation (max 5 characters); team name; preferred first name; registration type (optional). Source: https://hytek.active.com/user_guides_html/swmm8/importathletesfromreg.htm
- Swim MM does NOT import semicolon entry files; only .HY3 or SDIF .SD3. Source: https://hytek.active.com/user_guides_html/swmm7/importmeetentries.htm
- (Changed by 100.) The next level takes a HY3 file, not RE1. HY3 is Hy-Tek's own meet file: it carries the athletes (with DOB) and their entries with seed times, so it can hold the HRIS Team List in one file. The exact layout must be checked against a sample HY3 file (question 3).
- Old note: next level uses RE1 (confirmed). Jordan will send a sample.
- DOB never stored: at export the organiser loads the original student list; DOB is matched on the organiser's computer, the file is written, nothing is kept.

### 2.5 Storage (decided 27 October 2026)

- Supabase (chosen over Firebase), Sydney region (ap-southeast-2). One PIN per job, all typed on the same home keypad (88, which replaced the helper and organiser PINs of 85). Home page asks only for the PIN.
- Jordan sets it up from click-by-click steps Claude will write.
- Principal and ICT have NOT approved real student names yet. Privacy summary (Claude doc): https://claude.ai/artifact/W4ZLx85ckd3h6Y584Yueox, "Carnival Results App: Student Data Summary". Jordan to review and send.
- Supabase facts (checked 27 October 2026): free plan 500 MB per project, 2 active free projects, 200 live connections. Free projects pause after 7 days unused (data kept, one-click restore before the carnival). No automatic backups on free, so export CSV after. Pro US$25 a month (about $38 AUD, check rate), not needed. SOC 2 Type 2, AES-256 at rest, TLS in transit. Account, billing and logs (EU) can leave the region; student data only if support is asked for help. Sources: https://supabase.com/pricing, https://supabase.com/security, https://supabase.com/docs/guides/platform/regions, https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq

### 2.6 Design canvas (S1.1 to S1.38, COMPLETE)

All job boards from S1.37 have the "Job: ..." drop-down in the header. Board files keep their old names (Start.dc.html = Home, Setup.dc.html = Carnival Organiser).

Canvas: "CCAS Swimming App Design", https://claude.ai/artifact/XhQHZdJAwjyhP2K27GApn8 (made-up names only). Built as a Design artifact; boards are project/*.dc.html files plus project/canvas.json. A sticky note beside Home lists the demo PINs.

| Board (file) | Version | Status | Shows |
|---|---|---|---|
| Home (Start.dc.html), top row far left | S1.38 | APPROVED (86) | PIN keypad, then "Swimming Carnival" and 1 Marshal, 2 Place Judge, 3 Recorder, 4 Time Slips, 5 Announcer. Demo PINs: any 4 digits = helper; 9999 = Carnival Organiser PIN, adds a navy 6th tile "Carnival Organiser"; 0000 = red "That PIN is not right. Try again." and the dots clear |
| Place Judge (PlaceJudge.dc.html), top row | S1.20 | APPROVED, rules settled | Race 15, Girls 14 backstroke Heat 1, lane 5 placed 1st and lane 4 2nd (judge overruling times) |
| Marshal (a) (Marshal.dc.html), top row | S1.20 | APPROVED, FINISHED | Start screen, opens blank |
| Marshal (b) (MarshalLanes.dc.html), top row | S1.20 | APPROVED, FINISHED | Lanes screen mid-heat |
| Old Marshal (Main.dc.html) | S1.1 | REPLACED | Kept for comparison |
| Record (Record.dc.html), middle row | S1.33 | APPROVED | MacBook. Lane table with pink lanes, flagged lane, DQ, 7512 check, Times checked button, lock, race overall panel |
| Time Slips (TimeSlips.dc.html), middle row | S1.25 | APPROVED | Phone 390 x 844. Could not read, Wrong slip, No signal demos, Check race list and Race overall sheet |
| Results (Results.dc.html), bottom row left | S1.33 | APPROVED | MacBook. Groups in swim order, filters, tabs, records box with NEW RECORD and EQUALS RECORD |
| Houses (Houses.dc.html), bottom row | S1.33 | APPROVED | iPad landscape 1180 x 820 |
| Announcer (Announcer.dc.html), bottom row | S1.31 | APPROVED | iPad landscape 1180 x 820 |
| Carnival Organiser (Setup.dc.html), bottom row far right | S1.38 | APPROVED (86) | MacBook 1512 x 982. Uses the 620 test students |

Design rules for the pool: tap targets 48 px or more for wet fingers, tap not drag, high contrast light screens, subtle house colours with the house letter in the dot, header badge shows the job, no start times on job screens.

### 2.7 Time slip scanner research (27 October 2026)

- Printing stopwatches: Seiko S149 (about $660 to $970 AUD, check rate and Australian sellers); Ultrak 499 set (about $490 to $610 AUD). Swiss Timing PowerTime II is a pro handheld timer with a built-in printer. Phone timing apps (Swimmingly, Superior Swim Timing, Lane Timer) are another option; could become a Timekeeper job later.
- Sources: https://www.bsnsports.com/p/seiko-s149-stopwatchprinter-system/, https://morleyathletic.com/products/seiko-s149-stopwatch-with-printer, https://www.swim2000.com/products/ultrak-499-stopwatch-and-printer-set, https://nsw.swimming.org.au/sites/default/files/assets/documents/Timekeepers.pdf, https://blog.swimmingly.app/replace-stopwatches-with-the-swimmingly-timing-system
- Decision 3 rules out barcode scanners; reading a time slip with a phone camera is a different thing and is chosen (decision 51).
- The pool's Swiss Timing system prints race number, lane and time, and its race numbers go 1, 2, 3 per heat like the app (decisions 52 and 57). A plain printing stopwatch would not (finish order only, no lanes).
- Reading the photo: planned to run in the browser on the phone (for example Tesseract.js), so no extra service and no names involved. Misreads are caught by the "Could not read" message, the race number match, the odd-time check, the stored photo and the recorder's Times checked step.
- Volume: about 120 races per carnival, so about 120 photos. Kept small (resized on the phone), this should fit the Supabase free plan; confirm in the setup steps.

### 2.8 Test student list (added 28 October 2026)

File: "CCAS XC test students 620.xlsx" in Project Knowledge. All names are made up, so it is safe to load anywhere, including Supabase.

- Tab "Students": columns Surname, Firstname, House (B, J, N), Sex (F, M), DOB (a real date). 620 rows, no blanks or bad values.
- Tabs "Test finish order" and "Counts": cross country only. Not used for swimming.
- Ages as at 31/12/2026 run 12 to 18. Swim age groups from this file:

| Age group | Girls | Boys |
|---|---|---|
| 13 & under (ages 12 and 13) | 88 | 89 |
| 14 | 44 | 44 |
| 15 | 45 | 45 |
| 16 | 45 | 44 |
| 17 | 44 | 44 |
| 18+ | 44 | 44 |

- Houses: Bradman 196, Jackson 202, Newcombe 222.
- Every group has 44 or more swimmers, so tests should enter only some swimmers per race (a real carnival is about 120 races, decision 56).
- Two different students are both called Jack Smith (Bradman, age 13; Newcombe, age 15). The app must keep them apart by id, never by name.

### 2.9 Swim Opt 1 (built 28 October 2026; now at Swim Opt 1.1)

- Swim Opt 1.5 (28 October 2026): test-mode fixes for the handover. Each browser tab gets its own device id (it was shared by every tab in one browser), and in test mode a newly opened tab now hears which devices are on which race, so "Being entered by another device" shows. No change to the look or the rules.
- Swim Opt 1.4 (28 October 2026): carnival years (decision 95). After the organiser PIN a "Which carnival?" screen lists the current year (live) and every kept year (look only, with races and students counted). The header shows the year and a "Change year" button (organiser only). In a past year every screen opens but shows a look-only banner and nothing can be saved; slip photos from that year still open. Start a new carnival (section 8) now: keeps the whole year as archive/<year>-config (settings and records at the time), archive/<year>-roster (students and swimmers added on the day), archive/<year>-data (heats, times, places, slip readings, race counter), slip photos copied to photos/y<year>-<race>, and a years/<year> entry; only then clears the live data; then sets the new year (date +1 year, age as at 31 December of the old year, name year updated, date marked not confirmed). If that year is already kept, it stops and asks the organiser to fix the date first. Announcer page has a Program card (decision 96): each race type in swim order with start time, groups and status (In the water, x of y final, Done, To come). Also fixed: the Carnival Organiser home tile label was drawn outside the tile.
- Swim Opt 1.3 (28 October 2026): relays added to the HRIS Team List (90); Year 12 novelty removed, 74 races (91); dead heat flag (94): the Place Judge's Dead heat button asks "Place judges must split the result" with "Cancel, we can split it" or "Yes, a true dead heat"; the Recorder shows a yellow dead heat message and Times checked asks first ("Keep the dead heat"); Results and the race overall show a yellow DEAD HEAT tag.
- Swim Opt 1.2 (28 October 2026): one PIN per job (decision 88). A job PIN goes straight to that job (no tile screen); its Job pill offers only "Sign out (back to PIN)". The organiser PIN shows the six tiles and the full Job drop-down. Carnival Organiser section 1 has a PIN table: each job, "Test PIN" or "Changed", and a New PIN box with Change; every PIN must be different. Old helper and organiser PINs are no longer used.
- Swim Opt 1.1 (28 October 2026): Recorder layout changed (decision 87). Left column, top to bottom: RACE badge with race name, heat and status; a button row (Go to race, View slip photo, Back to latest, and Next race on the right); the lane table; the help line; Times checked. Right column: Race overall only.

Link: https://claude.ai/artifact/HwqWg91FJcq2coJe2eyiNA (private to Jordan until shared). Source: claude/ccas-swim-opt1.html in Project Knowledge.

- One self-contained page. Runs inside Claude on the shared store (db) plus live presence (room) for the locks. A swappable storage layer: the same calls will point at Supabase later. Opened outside Claude it falls back to "This device only (test)", where tabs on one device stay in step.
- Anyone who opens it must have the page shared with them as Contributor (or Editor) in Claude to save. The PIN only picks the job; Claude sharing is the real lock until Supabase.
- Test PINs until changed on the Carnival Organiser screen: Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444, Announcer 5555, Carnival Organiser 9999 (decision 88). Stored as a hash, not plain text.
- 620 test students already loaded (made-up names, ids t001 to t620, no DOB). "Load the 620 test students" button also on the Students section. "Add made-up test records" button on Records (holders start with "Test:").
- Built to the approved boards: Home (PIN, wrong PIN message, 5 tiles, 6th Carnival Organiser tile, phone 2 by 2 plus full-width tiles); Job pill drop-down with Sign out; Marshal start and pool lanes screens (Not ready yet, Already selected, Next heat, New race, Confirm this heat, + Not on the list, earlier-heat swimmers greyed, leave-mid-heat check); Place Judge (finish-order taps, Dead heat, Undo last, Start again, Confirm places, Go to race, Back to latest); Recorder (typed times, DNS, DQ, pink swaps with slip time underneath, odd-time Keep or Fix, 7512 block, Times checked with the check box, lock per race, race overall panel, View slip photo); Time Slips phone (camera, flash, Next race, Check race, Race overall, Could not read, Wrong slip, No signal); Announcer; Results (filters, HRIS Team List, Newsletter draft, Export CSV); Houses; Carnival Organiser (all 8 sections, Start a new carnival two-step with PIN and records carry-forward).
- Race numbers come from a shared counter with a short lease, so two marshals sending at once get different numbers with no gaps. "Already selected" and the Recorder lock use live presence, so they clear by themselves when an iPad drops out (problem 4).
- Slip reader is in TEST MODE: the photo is saved (shrunk to about 100 to 180 KB) and made-up times are filed, with buttons to test Read OK, Cannot read, Wrong slip and No signal. The real reader waits for slip photos (question 30). Phone OCR (Tesseract) cannot load inside a Claude page; it will work on GitHub Pages.
- Not possible inside a Claude page: printing (program and lane cards come with the GitHub version). RE1 export greyed until the sample arrives.
- Checked by Claude: rules engine tests (judge swap, faster time outside top 4, tie points 12.5, record, houses, 75 program races) and a full run with six devices in a test browser (organiser, marshal, judge, phone, recorder, announcer) with no errors.
- Small rules Claude added in the build: Times checked is blocked while a lane has no time at all (type it or mark DNS or DQ); a group becomes Final when every heat is checked and no marshal still has that group open; dead heat in the judge's order gives both swimmers the faster time; Year 12 novelty lists all 17 and 18+ students (no year level in the student file); HRIS Team List shows individual races only; relay teams 5th and 6th get 5 points. All in questions 44 to 48.

### 2.10 Style options (28 October 2026)

Canvas: "CCAS Swim Style Options", https://claude.ai/artifact/FrNio15kHRpDrY9ifVozzp. Same Recorder screen, same race (Race 15, Girls 14 backstroke) and made-up names in each, so they compare like with like. The gallery sites need a login (Dribbble shots, Mobbin, Tailwind Plus), so the options follow each site's well-known patterns, not copies of any one design.
- A. shadcn style: white, grey borders, left sidebar with the jobs and a "Races to check" list, small outline buttons, Geist font. Very calm; less school colour.
- B. Tailwind Application UI stacked shell: navy top bar with the jobs as tabs (yellow underline on the current job), white page heading with the actions on the right, a row of four status tiles, then table and race overall. Red Hat fonts. Closest to the current look.
- C. Dribbble style poolside scoreboard: dark navy, big condensed numbers (Barlow Condensed), each lane a coloured bar, podium cards for the top 3. Most striking; dark screens can be hard to read in bright sun.
- D. Mobbin real-app pattern: race list down the left (To check / All), lane entry in the middle with Times checked fixed at the bottom, race overall on the right. IBM Plex Sans. Fastest for a recorder working through many races.

### 2.11 Handover package for Claude Code (28 October 2026)

Saved to Project Knowledge as handover/ and given to Jordan as one zip (ccas-swimming-handover.zip):
- CLAUDE.md: rules for the repo (writing style, Swim Opt numbering, PROJECT-STATE updates, the look must not change, the triple visual check, privacy, devices).
- HANDOVER.md: what exists (files, data paths, test PINs), the decisions that shape the code, the build steps (2.0-a port as is, 2.0-b Supabase, 2.0-c GitHub Pages, Jordan's setup steps, triple check), the tests, known quirks, open questions and the first prompt to paste into Claude Code.
- PROJECT-STATE.md: this file.
- src/: the Swim Opt 1.5 source (core.js, store.js, ui1.js to ui5.js, styles.css, build.py) and test-students.json (620 made-up students, no DOB). build.py rebuilds the live app byte for byte.
- tests/: engine.test.js (rules engine, all pass), flow.py (six devices, full carnival, dead heat, new year, past year), baseline_shots.py (makes the screenshots), visual_diff.py (check 1, 0.1% threshold), slip.jpg.
- baseline/: 384 screenshots (48 screens and states x iPad landscape, iPad portrait, MacBook, phone x light and dark), taken with the real Red Hat fonts. A full retake matched with 0 differences, so the pixel check can be trusted.
- Known quirks in the baseline (not to be "fixed" without Jordan's OK): full-page shots can show the sticky header or a toast mid-page; on a phone a selected Recorder time box scrolls the lane table sideways; date fields follow the browser's language.

Triple visual check before Jordan sees any build: (1) pixel diff against baseline/; (2) Claude in Chrome walk-through of the full carnival at every device size in Jordan's Chrome; (3) a separate fresh-eyes review agent. A failure goes back to the build, never to Jordan.

### 2.12 Swim Opt 2.0-a: port as is (28 October 2026)

Repo layout (in the ccas-swimming folder; not a git repo yet, that comes with 2.0-c):
- index.html: the page shell from build.py with the head and fonts unchanged, plus a doctype, charset and viewport line (the Claude page added these around it).
- css/styles.css; js/core.js, js/store-local.js (was store.js), js/ui1.js to js/ui5.js: copied unchanged.
- js/test-students.js: the 620 test students, made from src/test-students.json exactly as build.py did.
- src/ is kept as the Swim Opt 1.5 reference for now.
- tests/engine.test.js now loads js/core.js (was src/core.js). No other test change.
- The files load as separate scripts. They were checked first: no two files declare the same name, and no name clashes with the browser's own.

Tools on Jordan's Mac (no Homebrew, no admin): a Python environment in SWIM 2027- App/.venv with Playwright, Chromium and Pillow. Node comes from Playwright's own copy for now.

Results:
- tests/engine.test.js: all pass (time parser, judge swap, faster time outside the top 4, tie points 12.5, record and house totals, age champions, student parser, 74 races).
- tests/flow.py (six devices: full carnival, dead heat, new year, past year): no errors. It checks that every step runs, not the results on screen.
- Port against the untouched Swim Opt 1.5, both shot on this Mac: 384 of 384 screens match with 0 pixels different. One full run had a one-off text smoothing change on every iPad portrait dark shot; two re-runs of both pages matched exactly.
- Check 1 against baseline/: 384 of 384 over the 0.1% limit (0.25% to 3.71%), only at the edges of letters. The untouched Swim Opt 1.5 gets the same 384 failures by the same amounts on this Mac, so it comes from the screenshot machine, not the port (problem 15).
- Check 1 against baseline-mac/ (decision 101): 384 of 384 pass.

### 2.13 Swim Opt 2.0-b: Supabase (28 October 2026, not yet run on a real project)

Files:
- supabase/01-setup.sql: one table per collection (id, doc, updated_at), row-level security, the PIN functions, next_race(), doc_update() (deep merge, the same as test mode), the private "slips" photo bucket, and live updates. Safe to run again.
- supabase/02-seed-test-students.sql: the 620 test students (made by tools/make_seed.py).
- js/store-supabase.js: the same calls as store-local.js. Loads the Supabase library (js/vendor/supabase.js, version 2.117.3) only when js/config.js is filled in, so test mode runs exactly as before. ?mode=local still gives test mode.
- js/config.js: the project URL and public key (empty until Jordan's setup).
- SETUP.md: Jordan's click-by-click setup steps.
- tests/sql_test.py: tests 01-setup.sql on a throwaway Postgres on this Mac with stand-ins for Supabase's own parts. 49 checks, all pass.

How it works:
- Each browser tab signs in anonymously on its own, so each tab is its own device (as in test mode).
- The PIN is checked on the server: claim_role() compares the PIN hash with a private table and records the device's job. No job can read a PIN hash. When the organiser changes a PIN, the server keeps the hash and config/main only shows "set" for that job.
- Rules: Marshal writes heats and swimmers added on the day; Place Judge writes places; Recorder writes times; Time Slips writes times, slip readings and photos; Announcer reads only; Organiser writes everything. Nobody reads anything without a job. When results are locked only the organiser writes. A past year cannot be written. The organiser cannot write while a past year is open.
- Race numbers: next_race() locks the counter row, so two marshals at once get different numbers with no gaps (tested with 50 at once).
- Wrong PINs: 5 wrong in 5 minutes and that device must wait; 100 wrong in 10 minutes in total and every device must wait.
- Presence ("Already selected", the Recorder lock) uses a private Realtime channel that only a device with a job can join. A device that drops out is removed by Realtime.
- Offline queue kept from store.js; queued changes show on the device straight away.

Small logic changes in the screens (only when Supabase is on; test mode unchanged, check 1 passes):
- ui1.js: connect() tries Supabase first; the PIN keypad asks the server; Sign out tells the server; picking a year tells the server; a job the server does not know is forgotten on load.
- ui5.js: Start a new carnival checks the organiser PIN on the server.

Tested so far: rules (sql_test.py, 49 of 49), engine tests, six-device flow in test mode, check 1 (384 of 384), and the page loads with Supabase turned on and no errors.

### 2.14 Swim Opt 2.0-b on the staging project (28 October 2026)

- Project: ccas-swimming-staging, Sydney (ap-southeast-2), free plan. URL and publishable key in js/config.js. Anonymous sign-in on, limit 100 per hour. 01-setup.sql and the 620 test students loaded.
- tests/supabase_live.py (staging only): clears the carnival data, runs the six-device flow and checks what it saved (kept year with its heats, times, places and photos; live data cleared; race number back to 1), then two marshals at once (30 numbers, no gaps or repeats), a heat showing live on another iPad, presence, two Recorders on one race (second locked, freed when the first drops out), the phone offline (photo waits, header shows the count, sends by itself, Recorder sees it live and can open the photo), and the security rules over the API (no PIN, wrong PIN, Marshal cannot write times or photos, Announcer cannot write, past year cannot be written, signed out reads nothing). It puts the 620 test students back at the end.
- Bugs found by the live tests, all fixed:
  1. The Supabase library shares a sign-in between tabs in one browser, so a new tab took over the other tabs' sign-in and their live updates stopped. Each tab now has its own.
  2. A PIN typed while the page still said "Connecting" was checked the old test-mode way, then thrown away. The keypad now waits for the connection.
  3. Fast taps (Place Judge) could be undone for a moment by the server's echo of an earlier tap, so Next race could show a wrong "Confirm places" box. A device now ignores echoes of its own saves still on the way, then reads the record again.
- Result (28 October 2026, after all fixes, decisions 103 and 106 in): tests/supabase_live.py 30 of 30 pass on staging. Test mode: flow passes, check 1 384 of 384. Swim Opt 2.0-b is DONE apart from checks 2 and 3 of the triple check, which run on the GitHub Pages build (2.0-c).
- Each run of the live tests signs in about 25 test devices, so only about 3 runs fit in an hour (the limit is per hour, per internet address). At the carnival each device signs in once per browser tab, so 100 an hour is plenty; raise it if many devices show "Connecting" at once.

### 2.15 Swim Opt 2.0-c: git and GitHub Pages (28 October 2026, in progress)

- git repo in the ccas-swimming folder. Branches: main (live link) and staging (test link), both on the same first commit. GitHub account hammerpest, repo https://github.com/hammerpest/ccas-swimming-carnival (public). Commits use the GitHub no-reply email (email kept private on GitHub). Pages source is GitHub Actions; staging is allowed in the github-pages environment.
- .gitignore: .DS_Store, Python caches, diff-report/, flow-shots/, shots/, _site/.
- .github/workflows/pages.yml: runs on every push to main or staging. Puts main at the site root and staging at /staging/ (index.html, css/, js/ only; tests, baselines, src and docs are never published) and deploys with GitHub Actions.
- Links once set up: https://hammerpest.github.io/ccas-swimming-carnival/ (main) and https://hammerpest.github.io/ccas-swimming-carnival/staging/ (staging).
- Both links use the Supabase project in js/config.js (staging) until the live project exists (step 2 in section 7).
- Pushing uses HTTPS with a fine-grained token that only reaches this repo. Jordan pastes the token in the Terminal; Claude never sees it. macOS keeps it in the Keychain.
- Checked locally: the site served from a sub-folder (as Pages does) runs the six-device flow with no errors, and Supabase mode loads with no console errors.

### 2.16 Check 2: Claude in Chrome walk-through (29 October 2026, PASSED)

Run in Jordan's Chrome on https://hammerpest.github.io/ccas-swimming-carnival/staging/ with the staging Supabase project. Jordan's Chrome window could not be resized (it stays 1512 x 670), so each device was a tab holding the app in a frame of the exact device size; the app lays out to the frame's size.
- Organiser, MacBook 1512 wide: wrong PIN 0000 and organiser PIN 9999 checked on the server; year pick; 6 tiles; student import; test records (48); all 8 sections; lock and unlock.
- Marshal, iPad landscape 1180 x 820: Not ready box, Race 3 (8 lanes, Girls 14 backstroke), Next heat, Race 4 (3 lanes), Confirm this heat, green sent line.
- Place Judge, iPad portrait 820 x 1180: places 5, 4, 1, 2 on Race 3; Dead heat box and a true dead heat on Race 4.
- Time Slips, phone 390 x 844: Check race, Cannot read, Read OK, Next race, Wrong slip, No signal.
- Recorder, MacBook 1512 x 982: phone times and judge places arrived live; pink swaps; 7512 "Over 60 sec"; 2100 "Check this time" with Keep and Fix; a second Recorder (organiser tab) was locked out of Race 3 ("On another device"); Times checked on Race 3; dead heat box and Keep on Race 4.
- Announcer, Results (all three tabs) and Houses, iPad landscape: Race 3 and 4 final result, NEW RECORD, DEAD HEAT, HRIS tags, house standings, age champions, program; the results lock showed live.
- Compared with baseline-mac: Home PIN, organiser Students, Marshal lanes, Place Judge placed, Time Slips read OK and No signal, Recorder odd time, Announcer. Same layout, text and colours. Only expected differences: the header pill says "Online, all sent" (not "This device only (test)"), race numbers start at 3 (staging already had Races 1 and 2), names and times differ where the test slip times are random, and staging already had the 620 students loaded.
- No sideways scroll on any screen at phone width (390) or iPad portrait (820): Home, year pick, tiles, all 6 jobs, all 8 organiser sections, Results (3 tabs), Houses.
- Console: no errors in any tab. Network: every request 200 (app files, Red Hat fonts, PIN check, all Supabase reads and saves).
- Not covered here: dark theme (it follows the Mac's own setting, which Claude may not change; check 1 covers dark pixel for pixel); Start a new carnival and past years (skipped so the staging year was not archived; tests/supabase_live.py covers them on staging); the main link (same files as staging).
- Staging now holds test Races 1 to 4 from this walk-through. tests/supabase_live.py clears them.

### 2.17 Check 3: fresh-eyes review (29 October 2026, PASSED)

- 384 new screenshots taken from the live staging link in test mode (tests/baseline_shots.py). Against baseline-mac: 0 different (so check 1 also passes on the published build).
- A separate agent that did not build the app compared them with baseline/. Verdict: PASS, the look has not changed. Only differences: text edge smoothing (problem 15) and the date fields showing in Australian order (the known "date fields follow the browser's language" quirk). It also rebuilt the untouched Swim Opt 1.5 and shot the live page itself: pixel-identical.
- No sideways scroll at phone width on any of the 48 screens, both themes. Dark theme fully dark on every screen.
- Found, but ALREADY IN THE APPROVED LOOK (same in Swim Opt 1.5; css/styles.css is unchanged), so not fixed without Jordan's OK (question 55):
  - Dark theme contrast below WCAG AA: white text on the green buttons (Go, Confirm this heat, Times are right, the slip flash) 1.83:1; white on the red Start a new carnival button 2.24:1; house dot letters 2.03 to 2.80:1.
  - Both themes: bronze medal number 3.14:1; NEW RECORD tag 3.44:1.
  - Tap targets under 48 px: the Job pill and header links (39 to 40 tall), Sign out link (31), organiser fields and small buttons (30 to 45), Recorder time boxes (43), DNS and DQ (40), Keep and Fix (36), Results tabs and filters (44), Marshal list buttons on a phone (36), Time Slips test buttons (44).
- Not covered: real iPads and Safari (step 6), hover and focus states.

### 2.18 S1.39 options: contrast and tap sizes (29 October 2026, waiting for Jordan)

Canvas "CCAS Swim S1.39 Options": https://claude.ai/artifact/4RQVvLyyJjPp9REjWEBwnS. Four boards:
- Now (approved S1.38), dark theme: green buttons 1.8:1, red Start a new carnival 2.2:1, house dot letters 2.0 to 2.8:1, bronze 3.1:1, NEW RECORD 3.4:1.
- Option A, dark letters on bright colours (dark theme only): letters on the green and red buttons and the house dots turn near-black #0b1222; the fills stay as now. Green 10.2:1, red 8.4:1, dots 6.7 to 9.2:1.
- Option B, white letters on deeper colours (dark theme only): buttons and house dots use the light-theme colours (green #17744a, red #ad2a20, houses #c8302a, #23824a, #2f5fc4). Green 5.8:1, red 6.7:1, dots 4.8 to 5.9:1.
- Both options, both themes: bronze medal #9a5b1c (5.4:1) and NEW RECORD tag #b83a0c (5.8:1).
- Tap sizes (with either option): header links and Job pill 48 px (header 8 px taller), Recorder time box, DNS, DQ, Keep and Fix 48 px (lane rows about 5 px taller), Results tabs, Marshal list buttons, organiser fields and small buttons 48 px.
- Light theme buttons and dots already pass and do not change.
- Once Jordan picks: build as Swim Opt 2.1, new baseline-mac and baseline shots for the changed screens, all three checks.

### 2.19 Swim Opt 2.1: S1.39 Option A (29 October 2026, on staging only)

- Branches from now on: new work goes on staging first; main only gets it after Jordan approves on the staging link.
- css/styles.css: new tokens --on-ok, --on-bad, --on-house (white in light, #0b1222 in dark), used by the green buttons and slip flash, the red button and pressed DNS/DQ, and the house dots. --bronze is now #9a5b1c and the NEW RECORD tag uses a new --rec #b83a0c (both themes); --flame stays for the orange record borders. index.html comment says Swim Opt 2.1.
- Check 1 against baseline-mac: 218 of 384 screens identical; 166 differ, none changed size. The 48 light-theme changes are only screens with a bronze medal or NEW RECORD tag; the dark changes are those plus the green and red buttons and house dots. Checked by eye before and after (Recorder dark, Results light, Marshal Go dark).
- Contrast measured on the page: light 4.8 to 6.7, dark 5.4 to 10.2. All pass 4.5.
- Still to do before Jordan approves: checks 2 and 3 on 2.1; then new baseline-mac and baseline shots once Jordan approves, so check 1 compares with the new look.

### 2.20 Swim Opt 2.1, more (29 October 2026, on staging only)

- 48 px tap sizes (111): header links and Job pill, small buttons (min 48 x 48), DNS and DQ, inputs and selects, Results tabs, the Marshal name search, Time Slips test buttons, the Date confirmed row. The on/off switches keep their look with an invisible 48 px tap area. Audit on all 384 screens and states: nothing under 48 px, no sideways scroll.
- Slip reader (110): js/core.js parseSlip() turns the slip text into race, lanes, finish order, and "unsure" lanes (time does not match the clock check). js/slip-reader.js reads the photo on the phone with Tesseract.js 5.1.1 (js/vendor/tesseract, about 11 MB, loaded only on the Time Slips phone in live mode): reads in grey first, then a black and white second look if anything is missing or doubtful. Engine tests for the text, including 1:12.34 and common misreads.
- Tested on Jordan's simulated sample and 5 harder copies (blurred, tilted 4 degrees, shadowed, small, on a bench): all 6 read exactly, nothing silently wrong, under 1 second each on the Mac. A phone will be slower, and the first read downloads the reader.
- Live mode: the phone reads the photo for real ("Read the photo", picked by default); the four practice buttons stay. Test mode (?mode=local) is unchanged. An unsure lane is filled but shows the yellow "Check this time: slip hard to read" on the Recorder with Keep and Fix, and counts for the Times checked box.
- Tested on staging: the sample slip on Race 2 gave "Wrong slip? This slip says Race 1"; on Race 1 it filled lanes 2, 3, 4 and 6, with lanes 1 and 5 "Not on slip"; the Recorder showed the photo under Race overall; no errors.
- Ticks and slip photo (112): built as asked. Only the 7 Recorder screens change in the baseline set.
- Noticed, not changed: on the Recorder, the "Not on slip" placeholder is cut to "Not on sl" in the time box (same in 2.0); "Not on slip" shows in full underneath.

### 2.21 Checks 2 and 3 on Swim Opt 2.1 (29 October 2026)

- Check 2 (Claude in Chrome, staging link, frames at each device size): PASSED. Marshal sent Race 11 (iPad landscape), Place Judge tapped places (iPad portrait), the phone read a drawn slip for real (390 wide) with the green tick, Recorder (MacBook) had every lane's own time, the photo and the lane 8 warning; Announcer, Results (3 tabs) and Houses counted Race 11. Sweep of 18 screens at 390 and at 820 wide: no sideways scroll, nothing under 48 px, no errors, no failed requests.
- Found in check 2 and fixed: after a deploy, Chrome kept old app files for up to 10 minutes and could mix old and new. .github/workflows/pages.yml now adds ?v=<commit> to every script and the stylesheet in index.html.
- Check 3, run 1 (fresh agent): look PASS; reader FAIL. Slip times for lanes with no swimmer were used in the judge swap (a wrong time on Sophie Brooks); a hard photo could be wrong with no warning. Fixed: only marshalled lanes count; the Recorder warns "The slip has a time for lane N, but no swimmer was marshalled"; a lane whose clock check cannot run is unsure.
- Check 3, run 2 (new agent): look PASS; reader FAIL on 82 copies: a smudged lane digit moved a time to another lane; warnings lost when the two readings were combined; a stop line with no time dropped silently; race number disagreement ignored. Fixed: the photo is always read twice (grey and black and white) and compared; the reader's own confidence (0 to 100) for each lane number, time and the race number is used (a smudged digit scored 17, clean ones about 90; under 70 is unsure); a lane twice or found by one reading only is unsure; a disputed race number asks for the photo again; empty lanes say "Not read: check the photo" when any of the slip was in doubt.
- Check 3, run 3 (new agent): look PASS (every difference is an approved change; tap, scroll, contrast and dark theme all pass); reader FAIL on 15 of 118 new attacks. Fixed: a photo showing two slips (a continuous roll) is refused ("This photo shows more than one slip..."); a "sec" line with no readable time is reported; when the slip's lanes do not match the marshalled lanes (some slip lanes with no swimmer and some swimmers with no slip time), the phone gives an amber "check it is the Race N slip" and the Recorder shows "Lanes do not match marshalling" and "Not read: check the photo".
- Graded after the fixes, on all 208 hard slips from the three testers (truth known for each): 33 exact, 125 flagged, 42 refused. The other 8 cannot be seen in the photo: a lane fully covered or cut off (3; Times checked stays blocked for a marshalled lane with no time, decision 92), a pen stroke turning 3 into 8 (2; caught by the lane-match warning when marshalling is right), a torn race digit read as another race (3; the phone says "Wrong slip?" unless it is on that exact misread race). Check 3 has not been run a fourth time on these last fixes (question 56).
- Speed: about 0.8 to 1.3 seconds per photo on the Mac (two readings). A phone will be slower; not yet measured.
- Staging data cleared with the reset step of tests/supabase_live.py: no races, times, slips, records or kept years; 620 test students; race counter back to 1. PINs unchanged.

### 2.22 Check 3, run 4, on Swim Opt 2.1 (29 October 2026)

- New agent, test mode only, nothing written to the staging database. Look: PASS (DOM and style compared element by element with main: only the approved changes).
- Reader: FAIL on 147 new attacks. Fixed: two slips side by side (joined on one line), or any printed lane or time above the "LANE MODE" line (a cut roll), are refused; a race number found by only one of the two readings, or with more than one number after the slash (a number written on the slip), asks for another photo. A start-time check was built, then removed at Jordan's request (decision 116).
- Graded on all 355 hard slips from the four testers: 41 exact, 208 flagged, 85 refused, 3 lanes fully covered (accepted, decision 115; Times checked stays blocked), 5 lane digits half covered to look like another clean digit (lane-match warning fires), 13 faded or torn race digits read as another race (for example 23 read as 3). Those 13 are safe in the normal flow (the phone is on Race 23, so it says "Wrong slip?") and only a risk if the phone has been taken back to the misread race (question 57).
- Found by the tester: main's deploy did not version-stamp the files. Fixed: .github/workflows/pages.yml is the same on main and staging now.
- Engine tests 34 of 34; six-device flow in test mode no errors. Live slip test on staging not re-run (Jordan may be testing there).

---

## 3. Important decisions (all kept)

1. A web app, not Excel.
2. Boys and girls in one system, with filters.
3. No barcode scanners.
4. Times recorded; places from time across all heats (timed finals), except the Place Judge decides the top 4 in each heat (28, 37, 38).
5. Offline safety net and results lock, as in the cross country reference.
6. Privacy: DOB used only on the organiser's computer, then discarded. Only name, house, sex and age group stored. (Changed by 95: each year's student list and results are now kept, look only, after the carnival. Needs principal and ICT approval, problem 14.)
7. Hosting: GitHub Pages plus Supabase (Sydney), helper PIN plus organiser PIN, Jordan sets up. Real names only after principal and ICT approve.
8. Points, bands, relays, champion and next-level rules as in 2.2.
9. Next level: RE1 file, top 2 per event, all except novelty. (File type changed to HY3 by 100.)
10. Designed for iPad (Marshal, Place Judge, Houses, Announcer, Home), MacBook Pro (Recorder, Results, Carnival Organiser) and phone (Time Slips); every screen must also work on the others.
11. PIN first, then pick a job: 1 Marshal, 2 Place Judge, 3 Recorder (4 Time Slips added by 54, 5 Announcer by 73, Carnival Organiser for the organiser by 79 and 84). All linked live.
12. Home page minimal: PIN, "Swimming Carnival", the jobs. Nothing else.
13. Marshal flow from Jordan's sketch: pick the group, Go, tap each lane, pick from that group's list.
14. Any number of people per job, any device, anywhere; link plus PIN; all live.
15. Scope is swimming only.
16. Marshal start screen includes a race choice; after sending, the marshal goes back to the top for the next race.
17. Marshal start screen plain: no step headings, no times on buttons; keep the check line and Go.
18. Go with anything missing shows a warning naming what is missing; start screen opens blank.
19. Marshal lanes screen looks like a pool; tap a lane, drop-down names, pick, move to the next lane.
20. Age buttons "13" and "18" mean 13 & under and 18+.
21. Same race and group already open on another marshal iPad: Go blocked with a reason and Back.
22. After a heat: "Next heat" and "New race". New race returns to a blank start screen, no pre-picking.
23. Name lists in surname order. Any current iPad, landscape or portrait.
24. Next heat stays on the pool screen for the same group; New race goes back to the blank start screen.
25. New race asks "Confirm this heat" when lanes are filled; Next heat does not ask.
26. The race number is shown large (yellow RACE badge) on every job screen so everyone matches it with the announcer.
27. No start times on any Marshal or Place Judge screen.
28. The Place Judge's order beats the times for the top 4 only; times decide the rest; times are handed out in the judge's order (22.00 / 22.05 example).
29. Recorder sees lane, name, place and time; times changed by the judge's ruling show in PINK.
30. Place Judge screen looks like the Marshal pool, with a place spot at the wall end of each lane.
31. Place Judge navigation: opens on Race 1 once sent, records places on the same screen, Next to the next race, a way back to any earlier race, and Back to latest.
32. Any number of Place Judges; places save on every tap and show live on all devices.
33. Place Judge Next button is one general button ("Next race"), because the next race may be a new heat or a new group.
34. Word "event" replaced by "race" on all screens (RACE badge, Next race, Go to race, New race).
35. Race wording everywhere, including Results.
36. Place Judge taps in finish order: one tap for 1st, one tap on the next lane for 2nd, and so on.
37. Top places judged in each heat; overall result from times across all heats, using the swapped times.
38. A faster time outside the judge's top 4 is a timing mistake, swapped the same way, shown pink. Rule: in each heat the fastest recorded times go to the judge's top 4 in the judge's order; others keep the rest in time order.
39. Simple "Confirm places" box when Next race is pressed with fewer places than the heat needs; a heat with 3 swimmers needs only 3.
40. Race numbers climb with every heat sent: first heat of the day = Race 1; each heat any marshal sends gets the next free number, shared live across all marshal iPads, fixed when sent. Program event numbers kept behind the scenes for MM and grouping.
41. (Changed by 95: Start a new carnival first keeps the whole year, then clears.) When the organiser clears the students and the list (Start a new carnival), the race number goes back to 1. The same button also clears heats, places and results, asks to confirm, organiser PIN only.
42. The Race 1, Race 2, Race 3 sequence is essential and runs all day without a break. Program event numbers are never shown. If the program order changes on the day, the marshal picks whatever race is being run and it takes the next race number. The printed program needs no numbers.
43. Recorder opens on Race 1 (the first race sent), showing the marshal's list plus the Place Judge's places.
44. Times can also arrive from the time slip photo, filling every lane of a race number at once (settled by 51).
45. Pink swapped times show straight away, as the time is typed or scanned.
46. Odd times: checked against time limits by distance and stroke (age limits possible later). Claude's starter limits (2.3a) used for now.
47. Overall results build live: each heat updates the group's overall result. The Recorder sees the overall result building beside the heat.
48. The student list is never cleared during a carnival. Race numbers keep running all day; the race number only goes back to 1 on a full clear for a new carnival. Swimmers can still be added on the day with "+ Not on the list".
49. Recorder moves between races like the Place Judge: Next race, Go to race, Back to latest.
50. Starter odd-time limits in 2.3a are fine for now.
51. Time slips are photographed on a phone: screen shows the race (starting at Race 1), Photo button, the app reads lane and time and files them under that race number. Race overall also viewable. Next race only after the photo is taken. Check race always available. Typing times stays as a backup.
52. The pool currently uses a Swiss Timing system that prints a slip with the race number, lane and time. The slip reader must be easy to adjust to a new slip layout.
53. Timekeepers do not write times by hand. The printed slip is kept as the paper backup. If a slip arrives before the Place Judge finishes, the times still go in and pink appears when the places arrive.
54. The photo screen is a 4th job on the home page, "4 Time Slips", part of the Recorder role.
55. After the photo, a short message flashes for about a second, then Next race appears. No review step on the phone.
56. About 120 races (heats) in a carnival; the app and photo storage must handle that comfortably.
57. The race number printed on the slip goes 1, 2, 3 per heat, the same as the app. Mismatch shows "Wrong slip?" with Take again, and no Next race.
58. If the photo cannot be read, the phone shows a red "Could not read the slip" message with Take again, and no Next race until a photo is read.
59. If the phone has no signal, the photo is saved on the phone and sends by itself later. Next race is still allowed.
60. The Recorder has one button at the bottom, "Times checked". If a time is still flagged, a box asks "Back to times" or "Times are right" first.
61. Home (S1.23), Record (S1.24) and Time Slips (S1.25) boards approved as drawn.
62. On a phone, the home page shows the job tiles as a 2 by 2 grid (see problem 9 for 5 and 6 tiles).
63. Wrong PIN shows "That PIN is not right. Try again." and clears the dots.
64. The next-level team (top 2 per group) is called "HRIS Team List" on every screen and file. The tag on a top-2 swimmer's row says "HRIS".
65. The announcer box on Results lists only records broken (or equalled) in that race.
66. Records are uploaded in Carnival Organiser at some point (format to come, question 36).
67. When a new carnival is set up (the next year), Carnival Organiser asks whether to bring in the updated records from all previous carnivals.
68. House cards show no points gap.
69. A group shows Provisional until every heat is in and Times checked, then Final. Same rule on the HRIS Team List tab and the Houses page.
70. A swimmer who equals a record time shares the record (joint record). Both holders are kept.
71. Jordan will send the CCAS records list on another day.
72. 200 m freestyle points count toward each swimmer's own age group champion, for now.
73. Announcer is a 5th job on the home page, "5 Announcer", using the same helper PIN.
74. The Announcer screen shows the latest checked result to read out (top 3, house, time), records broken today, house standings and the race in the water now. NOT age champions.
75. Job screens get no Results link. Results (and Houses) are for the Announcer only.
76. Parent live results page parked for now. Notes kept in problem 11.
77. The Results link is removed from the Recorder header. Results and Houses say "Back to Announcer".
78. Announcer (S1.31), Home with 5 tiles (S1.32), Results (S1.28) and Houses (S1.30) approved as drawn.
79. The organiser types the organiser PIN on the same home keypad. That shows the 5 jobs plus a 6th tile (now "Carnival Organiser"). Helpers never see it.
80. "CCAS XC test students 620.xlsx" is the test student list. Use it whenever Jordan is testing or using any part of the site: Swim Opt 1 demo data, the test file (step 6), multi-device tests and any redrawn board's names.
81. Setup assumptions all confirmed: (a) helper and organiser PINs can be changed; (b) pool length 25 m (SCM) or 50 m (LCM); (c) Start a new carnival keeps settings, program, points, limits and records, and asks for the organiser PIN; (d) records broken or equalled are added automatically once their race is Final; (e) once results are locked, helpers can look but not change anything until the organiser unlocks; (f) student file columns are Surname, Firstname, House, Sex, DOB.
82. Changing job uses a header pill drop-down ("Job: Marshal") on every job screen. Lists the jobs with the current one ticked, plus "Sign out (back to PIN)". Drawn S1.37.
83. The header pill says "Job", not "Role".
84. The Setup screen is called "Carnival Organiser" on the home tile, the header badge and the Job drop-down. Drawn S1.38.
85. (REPLACED by 88.) Two PINs only: one shared helper PIN for everyone else (all 5 jobs), and a separate Carnival Organiser PIN. Both can be changed on the Carnival Organiser screen.
86. (Answers question 42, 28 October 2026) No changes to Home or Carnival Organiser (S1.38). Both approved. The design canvas is complete.
87. (28 October 2026) Recorder: the race buttons (Go to race, View slip photo, Back to latest, Next race) sit directly above the lane table where names and times are entered. The right side shows only the race overall. Built in Swim Opt 1.1.
88. (28 October 2026, replaces 85 and the free switching in 82) One PIN per job. Each PIN opens only its own job: Marshal, Place Judge, Recorder, Time Slips, Announcer (the Announcer PIN also opens Results and Houses). The Carnival Organiser PIN opens every job. With a one-job PIN the Job pill shows the job and offers only Sign out; to change job, sign out and type another PIN. All six PINs can be changed on the Carnival Organiser screen and must be different. Built in Swim Opt 1.2.
89. (28 October 2026) The Recorder stays a separate job from the Carnival Organiser, so other staff can be given the Recorder PIN to help check times. The organiser PIN still opens the Recorder, so the organiser can also act as chief recorder.
90. (Answers question 44, 28 October 2026) The HRIS Team List includes relays as well as individual races (top 2 teams per relay group).
91. (Answers question 45, 28 October 2026) The Year 12 novelty race is removed from the app. It is not timed and its result does not matter. The program is now 74 races.
92. (Answers question 46, 28 October 2026) Times checked stays blocked while a lane has no time: type it from the paper slip, or mark DNS or DQ.
93. (Answers question 47, 28 October 2026) Relay points count for house totals only, never for individual points or age champions. Relay teams use the same scale (20, 15, 10, then 5 for 4th to 6th).
94. (Answers question 48, 28 October 2026) A dead heat tapped by the Place Judge is allowed: both swimmers get the faster time and share the place and points. It must be flagged: place judges HAVE TO split the result if they can, so the Dead heat button asks them to confirm, the Recorder gets a dead heat check before Times checked, and Results show a DEAD HEAT tag.
95. (28 October 2026) Carnival years. Only the organiser picks the year, right after the organiser PIN; every other job PIN always works on the current carnival. Past years are look only (Results, Houses, HRIS Team List, Announcer, records, Export CSV); nothing can be changed. Everything is kept for each year: students, heats, places, times, slip photos, results and the records as they were. Start a new carnival keeps the year first, then clears the live data and starts the next year. Built in Swim Opt 1.4.
96. (28 October 2026) The Announcer page shows the event program: each race type in swim order with its start time, groups and status. Start times show only here, not on the Marshal or Place Judge screens (decision 27 still holds). Built in Swim Opt 1.4.
97. (28 October 2026) The app moves to a Claude Code project: a new GitHub repo, hosted on GitHub Pages, with Supabase (Sydney) set up now using the 620 made-up test students only. Plain HTML, CSS and JS (no framework), so the look and rules move across unchanged. Security moves into Supabase: anonymous sign-in plus a PIN check sets each device's job, and row-level security decides what each job can read and write. The look must stay exactly as Swim Opt 1.5 and pass the triple visual check before Jordan sees it. First Claude Code release: Swim Opt 2.0.
102. (Answers question 51, 28 October 2026) With Supabase on, a PIN typed with no signal shows the toast "No connection. Try again."
103. (Answers question 53, 28 October 2026) Fix the PIN table: only a job whose PIN was changed shows "Changed". Fixed in ui5.js (Change now saves only that job's PIN; the table compares with the test PIN). Checked in test mode. No baseline screen changes a PIN, so check 1 is not affected.
104. (28 October 2026) Keep 4-digit PINs. The server limits wrong tries (5 in 5 minutes per device, 100 in 10 minutes in total).
108. (29 October 2026, answers section 7 step 2) The main link uses the staging Supabase project (ccas-swimming-staging) for now, the same as the staging link. Testing on either link changes what both show. Make the live project (SETUP.md, then change js/config.js on main only) when real names are approved or before the term 1 staff run-through, whichever comes first, and change all six PINs on it.
107. (29 October 2026, answers question 54) The repo is public, so GitHub Pages is free. All data in it is made up. Change all six PINs before any real names go in.
106. (Answers question 52, 28 October 2026) The refused-save message is now "Not saved. Calling Tech Boy to help you. Enjoy grandstand duty next year." (was "Not saved. This page needs Contributor access to save."). Changed in ui1.js and ui5.js and checked on staging. The no-signal message "Not saved. Check the connection and try again." is unchanged. Anonymous sign-in limit stays at 100 per hour.
109. (29 October 2026, answers part of question 55) S1.39 Option A for the colours: in the dark theme, near-black letters on the bright green, red and house colours; in both themes, a deeper bronze medal and a deeper orange NEW RECORD tag. The tap sizes part of question 55 is still open.
110. (29 October 2026, answers question 30 for the layout) Reading the slip: "LANE MODE x/ N": ignore x; N is the race number for the day (1, 2, 3 all day). Ignore "start" and the clock times. Each "stop L" line gives lane L; the "sec" line under it is that lane's time. Lines are in finish order; a lane with no stop line is not on the slip. A time over a minute prints as 1:12.34. Claude also uses the clock times as a check (stop minus start should equal the time).
111. (29 October 2026, answers the rest of question 55) Every tap target 48 px or more (S1.39 tap sizes).
112. (29 October 2026) Time Slips Check race list and the Recorder's Go to race list show a big green tick and "Slip added" for every race with a slip. The Recorder shows the slip photo under Race overall, so times, result and slip are on one screen ("View slip photo" stays for a bigger view).
113. (29 October 2026) Marshal start screen: a small, out-of-the-way "Change an earlier race" at the bottom. It lists every race already sent; picking one opens that race's pool screen to fill a missed lane, change a swimmer or clear a lane. Changes save straight away; the race keeps its number and is not sent to the starter again. A time already in a lane stays with the lane. A race already checked goes back to "To check". Swim Opt 2.2.
114. (29 October 2026) Recorder alert when something does not add up, for example "Lane 7 has a time on the slip but no swimmer", with an "Add swimmer to lane 7" button that opens the Marshal's name list on the Recorder (option A). The time drops in and the alert clears. The server rule changes so the Recorder can fill or change lanes, but only on races already sent. The Carnival Organiser can do both (113 and 114). Swim Opt 2.2.
115. (29 October 2026, answers question 56) Accepted: the reader cannot see a lane whose lines are fully covered or cut off, a pen stroke that turns one digit into another clean digit, or a race digit torn off. Other safeguards cover them (Times checked blocked, lane-match warning, Wrong slip).
116. (29 October 2026) No time-of-day check on slips: the slip's clock time is never compared with when the race was sent.
117. (29 October 2026, answers question 57) When a race already has a slip, a new photo is read and then the phone asks "Replace the Race N slip?" ("Race N already has a slip. This photo will replace its times. Check the race number on the paper slip says N.") with "< Back" and "Replace the slip". So a slip read as the wrong race after going back to an earlier race never overwrites a good one without a yes. Built in Swim Opt 2.1.
105. (28 October 2026) Before a PIN is typed, the home screen header shows the default carnival name. That is fine.
101. (Answers question 50, 28 October 2026) Check 1 runs against baseline-mac/: screenshots shot on Jordan's Mac from the untouched Swim Opt 1.5. baseline/ stays as the record of the approved look and is still used by check 3.
98. (Answers question 49, 28 October 2026) Keep the current look. None of the four style options (2.10) is used for now.
99. (Answers part of question 36, 28 October 2026) Relays and the 200 m freestyle have CCAS records. Jordan will upload the records list later.
100. (Answers question 3, 28 October 2026) The file for the next level is a HY3 file, not RE1. This replaces the RE1 plan in 2.4 and the Write RE1 file button on Carnival Organiser section 7 (to be renamed once the sample is checked; the board label stays until Jordan OKs the change). DOB is still matched on the organiser's computer at export and never stored.

---

## 4. Rules and constraints

### 4.1 Technical
- Cross country reference uses Claude's shared store, which does not work outside Claude. Swimming uses Supabase with a swappable storage layer so it can start in Claude with made-up data.
- Only people with the PIN read data; only the organiser changes settings and the student list. Names stay private.
- Age-as-at date 31/12/2026.
- Layouts: iPad landscape 1180 x 820 and portrait 820 x 1180; MacBook Pro 14 at 1512 x 982; phone 390 x 844. Touch targets 48 px or more.
- Several devices on the same job must not overwrite each other: live updates, a lock per heat, "Being entered by another device".
- Race number counter must be shared and safe when two marshals send at once (no repeats, no gaps), and must never go backwards or restart during the day.
- Time entry goes through one input step that accepts typed times and photographed times, matched to a race number and lane.
- Time Slips phone must keep photos when offline and send them later.
- Results lock: when locked, every job can look but nothing can be changed until the organiser unlocks.

### 4.2 Branding
- Logo: navy #1d3160, grey #989a9b. Primary: #1d3160, #2f50a3, #0989b8, #5ebeeb. Accent: #ffc907, #f15627, #a7b463.
- Houses: Bradman #c8302a (red), Jackson #23824a (green), Newcombe #2f5fc4 (blue). Subtle, house letter in the dot.
- Medals: gold #d4af37, silver #c0c4ca, bronze #cd7f32. Motto: Nihil sine Deo. Fonts: Red Hat Display (headings), Red Hat Text.

### 4.3 Writing style (chat, files, app text)
- Australian spelling. Simple, direct language. No em dashes (en dashes fine in ranges). No emojis. Avoid Jordan's banned words.
- Money in AUD, rounded to the nearest dollar.
- Number every design change S X.Y (next is S1.39). The working app is numbered Swim Opt 1, Swim Opt 1.1 and so on (next is Swim Opt 2.0, in Claude Code).
- Use the 620 test students for all testing and demo data (80).
- Ask outstanding questions each time. Remind Jordan of the handover routine when a chat gets long.
- Update PROJECT-STATE straight away after any decision and save it to Project Knowledge with today's date and a version letter.

### 4.4 School data
- Check with the principal or ICT before loading real student data into any hosted tool.
- Check newsletter permissions before naming students publicly.

---

## 5. Current problems

1. Supabase not set up yet; until then the app only works inside Claude.
2. HY3 layout (decision 100) must match Jordan's sample: team code, athlete ID, date format, event codes and seed times.
3. SOLVED (79): organiser way in.
4. SOLVED in Swim Opt 1: "Already selected" and the Recorder lock use live presence, released on New race or Back and automatically when a device drops out. Test on real iPads (step 7).
5. SOLVED (28 October 2026): design doc updated.
6. The slip reader needs real Swiss Timing slip photos to be built and tested (question 30), and must be easy to adjust if the timing system changes.
7. Phone photos need storage in Supabase (one photo per race, kept small). Check it fits the free plan once the setup steps are written.
8. Records file layout not known until Jordan sends the list (71).
8b. Each age champion is out of 6 individual races (5 age races plus the 200 m freestyle, decision 72).
9. SOLVED in Swim Opt 1: phone home is a 2 by 2 grid plus full-width Announcer and Carnival Organiser tiles.
10. Files are named by date (this is PROJECT-STATE-2026-10-28o.md). A second save on the same day adds the next letter.
11. PARKED (76). Parent link clashes with decisions 6 and 7: only people with the PIN read data, names stay private, real names need principal and ICT approval, and students without media consent must never show publicly.
14. NEW (decision 95): keeping every year's student names and results goes further than the privacy summary (which says the list can be deleted after the carnival). The privacy summary must be updated and approved by the principal and ICT (question 1) before real names go in. Records holders' names were already kept.
12a. Swim Opt 1 needs everyone to have the page shared with them in Claude (Contributor) to save. Until Supabase, that means every helper needs a Claude account. Fine for testing, not for the carnival.
15. SOLVED by 101 (28 October 2026): baseline/ was shot on a different machine. On Jordan's Mac, text is smoothed differently, so every screen is 0.25% to 3.71% off, even for the untouched Swim Opt 1.5. Check 1 cannot pass here against baseline/ as it is (question 50).
12. PARKED with 11. Supabase free plan allows 200 live connections. A parent page should poll every 30 to 60 seconds instead of holding a live connection, or be kept separate.

---

## 6. Unresolved questions (ask Jordan)

Ask now:

Still open (Jordan will send or answer later, 28 October 2026):
- 36. Records list, including relays and the 200 m freestyle (decision 99). Jordan uploading later.
- 30. (Partly answered, decision 110: the layout, from a simulated sample.) Still wanted: a few photos of real slips taken at the pool, to tune the reader.
- 1. Principal and ICT approval for real names in Supabase (privacy summary still to send; it now needs updating to say each year's names and results are kept, decision 95). Later.
- 2. Confirmed carnival date (around 10 February 2027). Later.
- 3. Sample HY3 file from the next level (decision 100).
- 55. Check 3 found low contrast in the dark theme (white on the green and red buttons, house dot letters), the bronze medal and NEW RECORD tag, and several tap targets under 48 px (2.17). All were already in the approved look. Fix them (a design change, S1.39, needs Jordan's OK) or keep as is? Options drawn (2.18). Colour: Option A chosen (109). Tap sizes: yes (111). Closed.
- (Closed by 115) 56. The slip reader cannot see what is not in the photo (a fully covered lane, a pen stroke that changes a digit, a torn race digit). Each is covered by another safeguard (2.21). Accept these, run check 3 a fourth time on the last fixes, or both? Real slip photos at the pool remain the best test (question 30).
- (Closed by 117) 57. A faded race digit can make a slip read as another race (23 read as 3). Safe in the normal flow; a risk only if the phone has gone back to that earlier race. Option: when a race already has a slip, a new photo asks "Replace the Race 3 slip?" first. Add that, or accept as is?
- 39 (parked, 76). Parent live link. Ask again only if Jordan brings it back.
- (Closed by 107) 54. Repo public or private? Free GitHub Pages needs a public repo. Everything in it is made-up data, but the test PINs (1111 and so on) are visible in these notes, so anyone could open the staging data. Private needs GitHub Pro (about $6 AUD a month). Suggest public now; change all six PINs before any real names go in.

Closed: question 52 (106); questions 51 and 53 (102, 103); 4-digit PINs (104); home screen name (105); question 50 (101); question 49 (98); question 3 file type (100, sample still wanted); questions 44 to 48 (decisions 90 to 94); question 42 (decision 86, design canvas complete); question 43 (83); question 41 (81); questions 40 and 6 (77, 79); board reviews (78); question 38 (73 to 75); questions 34, 35, 37 (69, 70, 72); question 22 (42); Recorder gaps (43 to 47); reset check (48); questions 23 to 29 (49 to 55); question 31 and review answers B, C, D (57 to 60); questions 32 and 33 (62, 63); HRIS Team List name (64); records rules (65 to 67). All Marshal and Place Judge questions closed (14 to 41).

---

## 7. Exact next steps

1. DONE: Swim Opt 2.0-c (2.15). Both links live.
2. DONE (decision 108): main uses the staging Supabase project until the live project is made.
3. DONE (2.16): Check 2, Claude in Chrome walk-through on the staging link. PASSED.
4. DONE (2.17): Check 3, fresh-eyes review. PASSED.
5. Swim Opt 2.2 (decisions 113 and 114) once 2.1 is approved and promoted to main.
6. NEXT: Send Jordan the staging link, a one-page note of what changed, and the check results.
6. Try the app on real iPads and a phone at school (two marshals, two Recorders, the phone losing signal).
7. When the slip photos arrive (question 30), build and test the real slip reader (Tesseract.js) to the Swiss Timing layout, easy to adjust.
8. When the HY3 sample arrives (question 3), build the HY3 export to match it exactly (DOB matched on the organiser's computer, never stored).
9. When the records list arrives (question 36), load it in Carnival Organiser section 6.
10. Send the privacy summary (updated for kept years, problem 14); real names only once approved.
11. Staff run-through in term 1, before the carnival. Wake the free Supabase project the day before (it pauses after 7 days unused).

---

## 8. Files and links

- PROJECT-STATE.md in the repo, version t (this file; the latest)
- CLAUDE.md (repo rules, how to run and test), HANDOVER.md (original handover), SETUP.md (Jordan's Supabase steps)
- Supabase staging: https://uutmoyqpynfllhacwhok.supabase.co (project ccas-swimming-staging, Sydney)
- Handover package: handover/ in Project Knowledge and ccas-swimming-handover.zip
- Style options canvas: https://claude.ai/artifact/FrNio15kHRpDrY9ifVozzp
- Swim Opt 1 (working app): https://claude.ai/artifact/HwqWg91FJcq2coJe2eyiNA. Source: claude/ccas-swim-opt1.html
- CCAS XC test students 620.xlsx (test student list, decision 80)
- claude/ccas-xc-app-opt13.html (cross country reference only)
- Swimming design doc: https://claude.ai/artifact/HZ925j4FKGWoxwPeJWE6cS
- Design canvas S1.1 to S1.38: https://claude.ai/artifact/XhQHZdJAwjyhP2K27GApn8
- Student data summary for principal and ICT: https://claude.ai/artifact/W4ZLx85ckd3h6Y584Yueox
- Jordan's program sheet and sketches: IMG_8474 to IMG_8476 and two screenshots (27 October 2026) in Project Knowledge
