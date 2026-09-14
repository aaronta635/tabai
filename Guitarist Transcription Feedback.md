# Build Spec v2 — Feedback Engine for Online Music Teachers (v1 / MVP)

*Companion document: `product-spec-full.md` describes the whole product this v1 is the first slice of.*

**Date:** 9 Sept 2026 · **Track Out:** ~25 Sept 2026
**Team:** Aaron (build), Phong (teachers, onboarding, pilots, deck)
**Market:** Vietnam-first. Guitar. Teachers running paid Facebook/Zalo groups with hundreds to thousands of students.
**New repo.** Do not inherit anything from earlier projects.

---

## 0. The one sentence

A teacher posts one link in their group; students upload a playing video through it; the teacher answers from a queue, with an AI-drafted reply from week 2; the student sees the reply on their page. Teacher pays. Students never pay us.

**Only number that matters:** teacher time per reply, manual (week 1) vs drafted (week 2), measured from the same timestamps.

**Phase 1 is not sold as "faster."** It is sold as "no student goes unanswered," and it exists to capture the baseline. Do not claim time savings until week-2 numbers exist.

---

## 1. Precondition (Phong, before any code matters)

- Teacher #1 must be **running an active lesson this fortnight** with students who submit. If the group is quiet, the pipeline is empty and Track Out is a demo of two founders. Confirm the lesson, the date he'll post the link, and roughly how many videos he expects. If he isn't running one, find a teacher who is.
- Confirm which channel his students actually open: Zalo or Messenger. Confirm the two most common phone models in the group.

---

## 2. Scope

### Phase 1 — the queue (by Sun 14 Sept, no AI)
Invite-link sign-in for two teachers · create lesson + link · student upload (record second) · queue · reply · timestamps · consent · deletion.

### Phase 2 — the draft (by Fri 19 Sept)
Per-submission draft in the teacher's voice from lesson context + curated voice samples + light audio metrics (tempo stability, duration). **No reference alignment, no pitch flags, until the teacher confirms flags are true on 20 videos.**

### Phase 3 — second teacher + pilot data (by Mon 22 Sept)
Second teacher live · per-teacher voice · dashboard · deck export.

### Out of scope until after Track Out
Student accounts · native apps · payments · OTP/OAuth sign-in · video hand-tracking · reference alignment (unless gated in) · leaderboards/folders/community · Australian school mode · other instruments · multi-region storage · RLS · separate services.

---

## 3. Flows

### 3.1 Teacher onboarding — founder-operated, on a call
1. Phong sends a provisioned invite link. Opens a session tied to `teacher_id`. No OTP, no OAuth.
2. Phong pastes 10–20 of the teacher's real Facebook replies into `voice_samples` **on the call**. This is the draft quality. A settings textarea will produce three generic sentences; don't rely on it.
3. Create first lesson. Copy link. Teacher posts it in the group with the sentence: "Gửi video qua link này để được thầy nhận xét."

### 3.2 Create a lesson
Title · optional note to students · optional reference video (upload only) · generates `/l/<code>`. One link per lesson, works for every student.

### 3.3 Student submission
1. Opens link from Facebook/Zalo. Works in the in-app WebView by design: **upload-first** (`<input type="file" accept="video/*" capture>`), record-in-browser only if `MediaRecorder` is available. If record fails, upload still works.
2. Sees teacher avatar, lesson title, optional reference, one big **Tải video lên** button.
3. First time: name, age band (<18 / 18+), Zalo phone or Messenger link, consent line (§7), and a checkbox "Cho phép hiện video trong nhóm" (default on; forced off if <18). Stored in a local token; repeat submissions are two taps.
3a. New students land in the teacher's **Chờ duyệt** (pending) tab. Unapproved submissions are stored but not analysed or answered. One tap approves the student for all future submissions. This is the gate: only people the teacher recognises from the group get through.
4. Upload (≤90 s / ≤60 MB). Confirmation: "Đã gửi. Thầy sẽ trả lời sớm."
5. Later: opens `/s/<token>` to see their video and the reply. Notification is a bonus, not the path.

### 3.4 Teacher queue
- Oldest unanswered first, grouped by lesson, count badges.
- Card: student name, lesson, time waiting, inline player with 1.5× toggle, [Phase 2: draft in an editable box].
- Actions: **Gửi** (send as-is), edit → send, rewrite, **Bỏ qua** (with reason), **Thầy chọn** (mark as an exemplary take — stored now, displayed on the piece wall in v2).
- Tabs: Chưa trả lời · Chờ duyệt · Đã trả lời.
- `space` play/pause · `enter` send · `e` edit. Next card loads automatically.
- Timestamps: `opened_at` when the card is focused, `sent_at` on send. Time-per-reply = the difference. Nothing else.

### 3.5 Reply delivery
- **v1:** reply is saved and visible on the student's `/s/<token>` page. Teacher optionally taps a Zalo/Messenger deep link to nudge the student ("Thầy đã nhận xét, xem tại link"). Accept that in week 1 this is more steps than typing in the thread; that's the baseline we're measuring, not the product.
- **v1.5 (only if it doesn't threaten the dates):** Zalo OA or Messenger Page send. Evaluate on Sat 13. Never a blocker.

---

## 4. Screens

Student (3): `/l/<code>` · `/s/<token>` · inline consent.
Teacher (4): lessons + create · queue · submission edit · settings (delivery handle; voice samples read-only, edited by founders in admin).
Admin (2): teachers + metrics · voice-sample curation + prompt version.

Mobile-first everywhere.

---

## 5. Data model (one Postgres)

```
teachers(id, name, avatar_url, delivery_type, delivery_handle, invite_token, created_at)
voice_samples(id, teacher_id, text, source: pasted|curated_from_reply, active bool, created_at)
lessons(id, teacher_id, code, title, note, reference_media_id, archived bool, created_at)
students(id, teacher_id, name, age_band: under18|adult, contact_type, contact_handle, token, consent_at, consent_version, public_ok bool, approved_at, created_at)
media(id, kind, storage_path, duration_s, size_bytes, created_at)
submissions(id, lesson_id, student_id, media_id, submitted_at, status: new|drafted|answered|skipped, skip_reason)
analyses(id, submission_id, pipeline_version, metrics_json, cost_cents, latency_ms, created_at)
drafts(id, submission_id, prompt_version, model, text, created_at)
replies(id, submission_id, teacher_id, text, source: approved_draft|edited_draft|manual, edit_distance, teacher_pick bool, opened_at, sent_at)
events(id, actor_type, actor_id, name, props_json, created_at)
```

Rules:
- `drafts` and `replies` are **append-only**. Never overwrite a draft with the edit. `edit_distance` is the learning signal and the IC chart.
- Access control = service role + `teacher_id` filter in every query. RLS when a third teacher exists.
- Single region: Singapore. Sydney when an Australian teacher joins.

---

## 6. Phase 2 — the draft

### 6.1 Metrics (ffmpeg worker, runs inside the Next.js host or a cron; no separate service yet)
Extract audio → duration, RMS envelope, onset-based tempo estimate and tempo stability (std of inter-onset intervals over the piece), silence ratio. That's it. Log `cost_cents`, `latency_ms`. Target < 20 s.

**Not in v1:** Basic Pitch note transcription, DTW alignment, pitch/chord flags. Phone guitar video (polyphony, buzz, compression, room noise) will produce wrong flags, and a wrong red chip destroys trust faster than no chip. Gate: run alignment on 20 stored videos offline, show the flags to the teacher, add it only if he says they're true.

### 6.2 Draft (LLM)
Inputs: lesson title + note, the student's name and their previous reply (continuity), the light metrics (used softly: "nhịp hơi không đều ở đoạn cuối" only when stability is clearly poor), and the teacher's **curated** voice samples.
Rules: Vietnamese; teacher's register; 40–90 words; one specific positive, one thing to fix, one instruction for the next attempt; no lists, no English, emoji only if samples use them; never claim to have heard something the metrics don't support — when in doubt, write the "I listened, keep going, focus on X from the lesson" reply.
Prompt in `/prompts/draft_reply_vi.md`, versioned.

### 6.3 Review
Draft in the queue's editable box. On send, log `source` and `edit_distance`.

### 6.4 Learning loop — curated, not automatic
Each night, surface the day's `edited_draft` and `manual` replies in admin. A founder marks the good ones `curated_from_reply` → active voice samples (cap 40 active, founder-chosen). No FIFO; "ok" and theory dumps never enter the prompt. Approve-untouched rate over time is the IC chart.

---

## 7. Consent, privacy, deletion — honest, not dressed up

- First submission: name, contact, and one line in Vietnamese: video is shared with this teacher and used to improve feedback; can be deleted on request. Store `consent_version`.
- Under-18 line: "Tôi trên 18 tuổi hoặc có sự đồng ý của phụ huynh." Unverified. Say so internally and on any Australia slide. Do not describe this as COPPA-grade. Login/OAuth would not fix it and would make us a party to someone else's age flow.
- Videos visible only to submitting student and their teacher. No public pages.
- Deletion: admin action removes a student's media, analyses, drafts, replies; keeps an anonymised metrics row.
- Raw video never leaves our storage. The LLM receives text and numbers only.

---

## 8. Stack — minimum that produces the number

- Next.js (App Router) + TypeScript + Tailwind. Vietnamese default, English toggle. No PWA until asked.
- One Postgres (Supabase for hosting + Storage). Service role from server routes.
- ffmpeg on the host for transcode + metrics; a Python script only if librosa is needed for tempo stability (it probably is — keep it a script, not a service).
- Anthropic API for drafts; verify Vietnamese quality on 5 samples day one.
- Deep links for nudges. OA/Page send later.

Repo: new. `/app` · `/scripts` (ffmpeg/metrics) · `/prompts` · `/docs` (this spec, `decisions.md`, metric definitions).

---

## 9. Build order

| Day | Build | Done when |
|---|---|---|
| Wed 10 | Repo, schema, invite-link sessions, create lesson + link | Link opens on a phone |
| Thu 11 | Student upload (record if available) in FB + Zalo WebViews on the two known phones; consent; queue lists submissions | Real student video in the queue |
| Fri 12 | Queue actions, reply saved to `/s/<token>`, deep-link nudge, `opened_at`/`sent_at`, admin metrics | Teacher #1 answers 10 real videos; time-per-reply computed |
| Sat 13 | Fixes; student page; OA/Page feasibility (timebox 2 h) | Teacher works queue without you present |
| Sun 14 | **Go/no-go**: is he still using the queue, or back in the thread? If go: metrics script on 20 stored videos | Metrics JSON for 20 videos |
| Mon 15 | Draft prompt v1 with curated samples; drafts on 20 videos reviewed with him | He says ≥10 of 20 read like him |
| Tue 16 | Drafts live in queue; `source`/`edit_distance` logging; admin curation view | He approves drafts live |
| Wed 17 | Teacher #2 onboarded on a call (samples pasted by Phong) | Two teachers live |
| Thu 18 | Dashboards; deck export endpoint | Numbers pull with one call |
| Fri 19 | Freeze. Bugs only | Drafted time-per-reply beats manual, or drafts leave the demo |
| Sat 20 – Mon 22 | Pilot runs; data; deck | Two weeks of data |
| Tue 23 – Wed 24 | Rehearse twice; backup video | Runs clean twice |
| Thu 25 | Track Out | — |

Cut order: OA/Page send → curation loop (fall back to pasted samples only) → metrics (fall back to context-only drafts) → teacher #2's drafts (keep them on manual queue). Never cut: timestamps, append-only drafts/replies, consent, deletion.

---

## 10. Acceptance criteria for Track Out

- 2 teachers live; ≥1 paying (collected, invoiced — and **not** a substitute for the time chart).
- Teacher #1 still using the queue in week 2 without prompting.
- Real submissions from a live lesson (target ≥100; the number depends on his group, not on code).
- Median time-per-reply, manual vs drafted, from identical timestamps. Target < 60 s drafted.
- Draft approve-untouched ≥ 50% by week 2.
- Cost per submission logged.
- Demo: student uploads on a phone → queue → draft → **Gửi** → student refreshes `/s/<token>` and the reply is there. Rehearsed. A push notification is extra credit, never the path.

---

## 11. Rules

- Nothing gets built unless a teacher asked for it aloud; log in `/docs/decisions.md` with date and who asked.
- `prompt_version` and `pipeline_version` on every row. 20 fixed videos as a regression set.
- `main` always demoable. Tag `trackout-2026-09-25` at freeze.
- If teacher #1 keeps answering in the Facebook thread after Sunday, there is no product. Say it out loud on the Monday call and decide what changes — the product, or the teacher.
