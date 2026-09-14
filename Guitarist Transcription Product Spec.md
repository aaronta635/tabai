# Product Spec — The Whole Thing

**Feedback engine for online music teachers, built on their existing Facebook/Zalo groups.**
Date: 9 Sept 2026. Companion to `build-spec-feedback-engine-mvp.md` (v1). This document describes where v1 goes, in the order it should get there, and the metric that unlocks each step.

---

## 1. What it is

A teacher's curriculum becomes a set of permanent links, one per piece. Students in the teacher's group submit playing videos through those links. The system listens, watches, and — using what it has learned from *this* teacher's past corrections — returns a report to the student. The teacher stays in control of quality, picks exemplary takes, and sees every student's progress. Videos are public inside the teacher's community, so the best takes rise and students learn from each other. Every reply, edit and pick trains the model for that teacher and that piece.

The teacher pays. The teacher grows. We earn as they grow.

---

## 2. Principles that don't change

1. **The teacher owns the students.** We never contact students except to deliver the teacher's feedback. No student subscription, no marketplace poaching, no cross-teacher discovery unless a teacher opts in.
2. **Trust is earned per piece.** AI answers students directly only on pieces where its drafts have proven accurate for that teacher. Everything else goes through the teacher first.
3. **Public by the teacher's rule, private by the student's.** Walls follow the group's norms; any student, and every minor, can opt out.
4. **The data belongs to the loop.** Replies, edits, picks, and student progress train per-teacher models. We don't sell the videos; we sell what the loop makes possible.
5. **Nothing ships without a number that unlocks it.** Every stage below names its gate.

---

## 3. The product in five layers

### Layer 1 — Curriculum as links (v1 → v2)
- Teacher's textbook/curriculum modelled as **pieces**, ordered into **modules** ("Tuần 1", "Điệu slow", "Bài 5"). Each piece: title, notes, reference video (teacher playing it), optional backing track, optional tab/chart (uploaded or generated later).
- One permanent link per piece. A **curriculum page** per teacher lists all pieces so the pinned group post is a single link, not fifty.
- Piece templates the teacher can copy between groups/cohorts. Cohort = a group of students on the same timeline (e.g. "Lớp tháng 9").
- v1 ships pieces + links. v2 adds modules, cohorts, curriculum page.

### Layer 2 — Gated submission (v1 → v2)
- Student registers once: name, age band, contact, consent, public-opt-in. Lands in the teacher's pending tab; teacher approves once.
- v2: rotating **group codes** (teacher posts a code monthly; new students enter it → auto-approved), and per-cohort links so a student is placed automatically.
- v3: the student page becomes a lightweight profile — my pieces, my replies, my progress — still no password, still token-based; optional Zalo login later.

### Layer 3 — The report (v1 draft → v2 AI-direct per piece → v3 multimodal)
The core. Three stages, each gated.

**Stage A — teacher-approved drafts (v1).** Draft from lesson context + light audio metrics + the teacher's voice samples. Teacher approves/edits/rewrites. Logs `edit_distance`.
*Gate to B, per teacher per piece:* ≥100 replies on the piece **and** approve-untouched ≥80% over the last 50.

**Stage B — AI-direct for routine, teacher for uncertain (v2).** On unlocked pieces the student gets the report immediately. A confidence score routes low-confidence or out-of-distribution submissions (unusual duration, very poor tempo stability, first submission from a student, anything the teacher has flagged before) to the teacher's queue. Teacher can spot-check any AI-direct reply and override; overrides re-train and can re-lock a piece.
*Gate to C:* audio-only reports accepted by teachers on ≥3 pieces across ≥2 teachers, and a labelled set of ≥500 teacher-confirmed technique observations from replies (mined from text: "ngón cái", "tay phải", "bấm không chặt"…).

**Stage C — multimodal: audio + video technique (v3).** Reference-aligned pitch/timing (Basic Pitch + DTW, only once phone-audio accuracy is validated against teacher judgement), plus hand/posture observations from video (MediaPipe hand pose; fretting-hand position, thumb placement, excessive movement, picking-hand anchoring). Each observation carries a confidence; the report shows only high-confidence ones and phrases the rest as questions for the teacher.
Report structure (all stages): one specific positive → top 1–2 corrections in plain language → one instruction for the next attempt → (v3) a 10-second clip reference "xem lại đoạn 0:42". Always in the teacher's register.

### Layer 4 — The community wall (v2)
- Each piece has a wall of approved, public-opted-in submissions.
- **Thầy chọn** pins teacher-picked takes to the top. Stage 1 ranking = teacher picks only.
- v2.5: automatic ordering learned from picks + engagement, per teacher, only after ≥50 picks on the piece and the teacher has agreed to let ranking run. Teacher can always override.
- Students can react (one emoji set the teacher chooses) and follow a piece. No comments in v2 — comments move feedback out of the loop and back into thread chaos. Revisit when moderation exists.
- Minors never appear on walls regardless of the checkbox; their videos are teacher-visible only.

### Layer 5 — Progress and retention (v2 → v3)
- Student page: pieces attempted, replies, teacher picks, streak, "next piece" nudge from the curriculum order.
- Teacher dashboard: who submitted this week, who stopped, who's stuck on a piece (3+ attempts without a pick), cohort completion. This is the retention view the Australian school buyer will pay for later.
- Reminders: teacher-configured nudge to students who haven't submitted in N days, sent under the teacher's name via Zalo OA/Messenger Page once connected.

---

## 4. The model (what "our training model" actually is)

Not one model — a per-teacher, per-piece stack that starts as prompts and becomes fine-tunes only when the data justifies it.

- **Voice layer:** curated samples of the teacher's real replies → the draft sounds like them. Refreshed by founders in v1, by an automatic curator (quality-scored edits) in v2.
- **Judgement layer:** the teacher's edits and picks become labels: which corrections they make on which piece, what "good" looks like. Used first as retrieval (show the model the teacher's 5 most similar past replies), then as fine-tuning data per teacher once >1,000 replies exist.
- **Perception layer:** audio metrics (v1) → aligned transcription (v3, gated) → hand/posture features (v3, gated). Perception is only promoted when teachers confirm its outputs are true.
- **Confidence layer:** every report has a confidence; the routing in Stage B depends on it. Calibrated against teacher override rate.

The moat is the judgement layer. Nobody else has teacher-labelled corrections at this volume, per piece, in this register.

---

## 5. Business model by layer

- **Seat + usage (v1):** flat monthly fee per teacher tiered by active students; overage per submission above tier.
- **AI-direct tier (v2):** higher tier once pieces unlock — the teacher is buying the ability to run 2,000 students, not a queue.
- **Payments (v2.5–v3):** students pay the teacher through the same link they submit with; we take a small percentage. This is the layer that scales with the teacher's revenue, not ours. Requires: OA/Page connection, a trusted relationship, and one teacher willing to move billing.
- **School mode (v3, Australia):** the school is the account; teachers are users; the tool is the school-owned channel that enforces no direct contact. Priced per active student to the school. Requires: real consent for minors, Sydney region, deletion SLAs, and the retention dashboard from Layer 5.
- **Licensing (v4):** the judgement model and multimodal perception licensed to platforms that have students but no teachers.

---

## 6. Roadmap with gates

| Stage | Ships | Gate to start | Gate to call it done |
|---|---|---|---|
| **v1** (Sept 2026) | Pieces + links, pending gate, queue, teacher-approved drafts, timestamps, consent, deletion, Thầy chọn stored | — | 2 teachers, drafted time-per-reply < 60 s, approve-untouched ≥ 50% |
| **v2** (Oct–Nov, through IC) | Modules/cohorts, curriculum page, group codes, piece wall with teacher picks, student page, teacher dashboard, OA/Page delivery, AI-direct on unlocked pieces, seat+usage billing | v1 done and teacher #1 retained through week 3 | 8–10 paying teachers, ≥1 piece AI-direct, approve-untouched ≥ 70%, wall used by students weekly |
| **v2.5** (Dec–Jan) | Learned wall ranking, automatic voice curation, reminders, payments through the link | ≥50 picks on a piece; a teacher willing to move billing | First take-rate revenue; ranking override rate < 10% |
| **v3** (Q1–Q2 2027) | Aligned pitch/timing, hand/posture observations, clip references, progress analytics, Australia school mode pilot | Perception validated on 20-video sets by ≥2 teachers; 500 labelled technique observations | Multimodal reports accepted ≥ 70% untouched; one Australian school paying per student |
| **v4** (H2 2027) | Multi-instrument (piano, voice, drums), other markets (ID, PH, IN, then EN-speaking creator-teachers), licensing | 30+ teachers, judgement model outperforming prompt-only on held-out replies | Second market with paying teachers |

---

## 7. What stays out, and why

- **Student-paid subscriptions** — splits the buyer, invites Yousician comparison, dies on Vietnamese price points.
- **Live lessons / video calls** — a different product with worse economics; VIP Peilian died there.
- **Marketplace across teachers** — breaks principle 1; revisit only as a teacher-opt-in referral feature.
- **Free-text comments on walls** — moves feedback out of the loop; needs moderation that doesn't exist yet.
- **Audio-to-chart generation** — parked; the teacher's frustration is real but the buyer is different and incumbents (Klangio, Muse Group) own it. Possible later as "reference video → rough tab" inside a piece.
- **Building on Facebook's API** — links only. Never depend on group APIs or scraping.

---

## 8. Risks the whole product carries

1. **Wrong feedback at scale.** Mitigated by per-piece gates, confidence routing, teacher override, and never showing low-confidence perception. If overrides rise on an AI-direct piece, it re-locks automatically.
2. **Teacher churn once they've "seen the trick".** Mitigated by the dashboard and the wall — the tool has to run their community, not just their inbox.
3. **Minors and privacy.** Vietnam norms are permissive now; Australia and any regulatory change aren't. Consent, deletion, and minors-off-walls are built from v1 so it's a setting, not a rewrite.
4. **Incumbent adds "teacher mode".** Muse Group or Musora could. Our defence is that teachers already run their communities through us and the judgement data is theirs-and-ours; speed to 30 teachers matters more than any feature.
5. **Facebook changes.** We only need a link to be postable. If that breaks, Zalo, Telegram and YouTube descriptions are equivalent.

---

## 9. Metrics that define the product

- Students answered per teacher per day (the headline).
- Median time-per-reply, by source.
- Approve-untouched rate per teacher per piece (the unlock metric).
- Override rate on AI-direct pieces (the trust metric).
- Weekly active students per teacher and 4-week retention (the teacher's business metric, and ours).
- Wall views and pick rate per piece (community health).
- Cost per submission and gross margin per teacher.
- Referral share of new teachers (market pull).

---

## 10. One-line test for any new feature

Does it make more students answered, faster, without a wrong answer reaching a student? If not, it waits.
