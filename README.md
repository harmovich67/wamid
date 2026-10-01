# وَمِيض · Wameed

An interactive programming academy for ages 10–25. Students follow a structured roadmap from
computer basics to real projects, and the teacher controls everything: students, content,
per-student access, tasks, reviews, and the Gemini AI assistant.

The blueprint (architecture, database design, user flows, UI structure, roadmap) is in [docs/PLAN.md](docs/PLAN.md).

## Stack

Next.js 16 (App Router, JavaScript) · Tailwind CSS 4 · Prisma 6 + SQLite · jose + bcrypt auth ·
zod · GSAP (landing page) · motion · Google Gemini (`@google/genai`).

## Getting started

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (and optionally GEMINI_API_KEY)
npm run setup               # creates the SQLite DB and seeds the starter curriculum
npm run dev
```

Open http://localhost:3000.

| Account | Username | Password |
| --- | --- | --- |
| Teacher (super admin) | `admin` | `Wameed@2026` |
| Students | `sara`, `omar`, `lina` | `spark123` |

Passwords come from `SEED_ADMIN_PASSWORD` / `SEED_STUDENT_PASSWORD`. **Change them before going live.**

`npm run db:seed` **wipes and re-seeds** the database. `npm run db:reset` also rebuilds the schema.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run setup` | Create the DB and seed it (first run) |
| `npm run db:push` | Apply `prisma/schema.prisma` to the DB (keeps data) |
| `npm run db:seed` | Wipe and seed demo data |
| `npm run db:studio` | Browse the DB in Prisma Studio |

## AI assistant (Gemini)

Set the key in `.env` (`GEMINI_API_KEY`) or from **Admin → المساعد الذكي**, then press **اختبار** to verify
the key and model. The default model is `gemini-3.6-flash`. Google no longer offers `gemini-2.5-flash`
to new API accounts, so it stays in the list only for older keys. The teacher can:

- turn the assistant on/off for everyone, or per student (the student list on the same page);
- choose the model, daily message limit, answer length, temperature, and system instructions;
- allow or block code review and full solutions;
- draft submission feedback with AI (the teacher edits it before sending).

**AI content studio (teacher only).** Gemini fills the editors for review; nothing is saved until the teacher presses Save:

- **Lesson editor → "إنشاء بالذكاء الاصطناعي"**: topic, age group, length, code language and quiz count produce the explanation, code examples, tips, common mistakes, an exercise, and the quiz. It knows the course and the previous lessons.
- **Quiz tab → "توليد"**: writes questions from the lesson's current content.
- **Task form**: describe the task, and the AI writes the story, requirements, sample run and grading criteria (never the solution), plus skills and points.
- **Course editor → "اقترح خطة الدورة"**: proposes modules and lessons, which you can edit or prune before adding them as draft lessons.

**Smart editors** (`components/editor/`):

- `RichTextEditor` (TipTap) is a WYSIWYG editor that loads and saves Markdown: real headings, bold, lists, tables, quotes and highlighted code blocks (always LTR, with a language picker) while writing, with no Markdown symbols. Each block gets the direction of its own text. It has a toolbar, a floating menu on selection with AI actions, Markdown shortcuts (`## `, ` ``` `, `- `), code-paste detection, and an "MD" toggle for the raw source.
- `SmartTextEditor` is a Markdown source editor with a toolbar and shortcuts, and write / split / preview modes. Each line takes its own direction (Arabic RTL, English/code LTR). Pasted code is detected and wrapped in a fenced block with its language. For the teacher it adds an "حسّن بالذكاء" menu (rephrase, simplify, expand, analogy, shorten, fix spelling, continue, or a custom request) that works on the selection or the whole text; the suggestion is previewed before it is accepted.
- `CodeEditor` / `CodeField` is always LTR, with live syntax highlighting, line numbers, smart indentation, auto-closing brackets and Tab/Shift+Tab. Its AI actions are fix, add Arabic comments, improve, simplify, or write code from a description. Students get the same editors in their submissions, without AI.

Output is requested as JSON Schema and re-validated with the app's zod schemas. Transient 503 errors are retried; quota errors are reported clearly.

## Project layout

```
app/(student)/   student area: dashboard, roadmap, courses, lessons, tasks, AI, achievements…
app/admin/       teacher dashboard: students & access, curriculum editors, tasks, reviews, AI, announcements
app/api/         route handlers (all validated with zod, role-checked in lib/api.js)
components/      ui/ brand/ layout/ lesson/ student/ admin/ landing/
lib/             auth, access (permission engine), rewards, ai, uploads, validators…
prisma/          schema.prisma, seed.js, curriculum.js (starter Arabic curriculum)
storage/         uploaded files (git-ignored, served only through /api/files/:id)
```

## Deploying

SQLite and local file storage need a single server with a persistent disk (a VPS, Railway, Fly.io
with a volume, and so on). Set `AUTH_SECRET`, run `npm run build && npx prisma db push && npm start`, and put
it behind HTTPS so the session cookie is sent `Secure`.
