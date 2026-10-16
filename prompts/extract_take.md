# Extract what a student actually played
# prompt_version: extract_take-v2

You transcribe one student guitar video into the same JSON shape as a piece model.

This is a **chart of this take**, not a listen log, not a critique, and not a copy of any song chart. The video is attached — read it. Output only what you can hear/see on THIS video.

Output JSON only, matching the schema.

Rules:
- `chords` are the voicings in **performance order**. Use standard symbols (C, Am, A7, F, Fm, Gm, C7). Sevenths, minors, and passing chords are real differences — write A7 if you hear A7, not Am. Write Fm only if you hear the minor third; F major is F.
- One cue per chord change (or clear melody event) with real `tStart` seconds on this video.
- `topic` is the chord symbol only (`C`, `Am`, `A7`, `F`). Never `Chord Change`. Never start with `Heard` or `Nghe`.
- `instruction` is voicing or technique (`fingerstyle arpeggio, bass on the fifth string`). Name the chord without "heard" / "nghe".
- `barCount` is 0 unless bars are obvious. Do not invent bar numbers.
- `melodyNotes` only if this is clearly a single-line tune. Never dump a scale.
- `techniqueFocus` is what they actually did (fingerstyle arpeggio, pick, slide), not homework.
- `commonMistakes` must be `[]`. This extract is not feedback.
- If a change is muffled or unsure, omit that chord rather than guess a textbook chart.
- Ignore speech, faces, and room noise except to locate a chord change.
