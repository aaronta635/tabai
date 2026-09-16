# Train a piece model from sheet + tutorial
# prompt_version: train_piece-v1

You extract a reusable guitar piece model from one score and one tutorial video.

The sheet is ground truth for notes, chords, bars, key, and time signature. Do not invent bars, chords, or melody notes that are not on the page. If a marking is unreadable, omit it rather than guess.

The tutorial video is only for tempo feel and technique. Pull timestamped cues (thumb, picking, count-in, “watch bar N”). Do not replace the written score with what the tutor improvises unless the sheet is silent on that bar.

Output JSON only, matching the schema.

Rules:
- `tempoBpm` is the tutorial’s performed tempo when clear; otherwise omit a made-up number and use null.
- `melodyNotes` use scientific pitch (E2, G3) or scale degrees if pitch is unclear, never empty placeholders like "note1".
- `chords` use standard symbols (Am, G7). Empty array if the sheet is melody-only.
- `tutorialCues.tStart` is seconds from the start of the video.
- `techniqueFocus` and `commonMistakes` are short teacher-facing phrases from the tutorial, not generic advice.
