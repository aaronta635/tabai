# Score catalog

Drop one folder per song. Training is additive: song 4 is the same path as song 1.

```
catalog/<slug>/
  meta.json        required
  sheet.pdf        optional (or .png / .jpg / .webp / .musicxml)
  tutorial.mp4     optional (or .webm / .mov / .m4v)
```

Need at least one of sheet or tutorial. Both is better.

`meta.json`:

```json
{
  "title": "Bài dễ 1",
  "code": "song1",
  "note": "Chơi chậm, đúng nhịp."
}
```

Then:

```
npm run db:seed          # once, so a teacher exists
npm run catalog:train    # uploads folders that have a sheet or a tutorial and enqueues train_piece
npm run worker           # worker extracts the PieceModel via Gemini
```

Incomplete folders (missing **both** sheet and tutorial) are skipped. A folder with only a tutorial or only a sheet is trained on that file. Pass `--retrain` to rebuild a ready model.

The teacher invite page writes the same files: upload on **catalog/song-1** saves `sheet.*` and `tutorial.*` there, creates piece code `song1`, and trains. Song 2 and 3 follow.

Sheet and tutorial binaries are gitignored. Only `meta.json` is committed.
