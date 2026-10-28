"""Writes supabase/02-seed-test-students.sql from src/test-students.json (620 made-up students, no DOB).
The rows match what Load the 620 test students and Import do on the Carnival Organiser screen.
Run: python3 tools/make_seed.py"""
import json, os, time
here = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(here, "..", "src", "test-students.json")))["students"]
studs = [{"id": "t" + str(i + 1).zfill(3), "s": r["s"], "f": r["f"], "h": r["h"], "x": r["x"], "g": r["g"], "test": True} for i, r in enumerate(rows)]
at = int(time.time() * 1000)
out = ["-- CCAS Swimming Carnival, Swim Opt 2.0: the 620 made-up test students (no DOB).",
       "-- Paste into the Supabase SQL editor after 01-setup.sql and press Run. Replaces the student list.", ""]
for x in ["F", "M"]:
    doc = json.dumps({"students": [s for s in studs if s["x"] == x], "at": at}, separators=(",", ":"), ensure_ascii=False)
    out.append(f"insert into public.roster (id, doc) values ('{x}', $json${doc}$json$::jsonb)\n  on conflict (id) do update set doc = excluded.doc, updated_at = now();")
open(os.path.join(here, "..", "supabase", "02-seed-test-students.sql"), "w").write("\n".join(out) + "\n")
print(len(studs), "students:", sum(s["x"] == "F" for s in studs), "girls,", sum(s["x"] == "M" for s in studs), "boys")
