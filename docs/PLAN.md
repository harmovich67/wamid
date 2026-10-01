# وَمِيض · Wameed — Platform Plan

> A spark of light and knowledge. A coding school that takes a 10‑year‑old with zero experience
> all the way to shipping real software.

This document is the blueprint that the implementation follows: architecture, database design,
user flows, UI structure, and the development roadmap.

---

## 1. Architecture

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) — JavaScript only | Pages + API in one app, server components read the DB directly |
| Styling | **Tailwind CSS v4** + CSS design tokens | Light/dark themes from one token set, RTL-friendly logical utilities |
| UI | `lucide-react` icons, `motion` animations, `sonner` toasts | Modern micro-interactions without a heavy component kit |
| Content | `react-markdown` + `remark-gfm` + `rehype-highlight` | Safe markdown (no raw HTML → no XSS) with code highlighting |
| DB | **SQLite** via **Prisma 6** (`prisma-client-js`) | Zero-ops, single file; Prisma 6 keeps a pure-JS client (Prisma 7+ generates TS) |
| Auth | `jose` (JWT, HS256) in an httpOnly cookie + `bcryptjs` | No external auth service; works in `proxy.js` and route handlers |
| Validation | `zod` | Every API input is parsed before it touches the DB |
| AI | `@google/genai` (Gemini) | Streaming answers; model is configurable by the teacher |

### Request flow

```
Browser ──► proxy.js ──(no/invalid session)──► /login
              │  (verifies JWT, blocks /admin for students)
              ▼
     Server Components (pages)  ──► lib/* (auth, access, gamification) ──► Prisma ──► SQLite
     Client Components ──fetch──► /api/* route handlers ──► same lib/* ──► Prisma
```

* **Reads** happen in server components (fast, no client JS for data).
* **Writes** go through `/api/*` route handlers. Each handler runs through `lib/api.js`
  (`handler({ role }, fn)`), which checks the session, reloads the user from the DB (so
  deactivated accounts are cut off instantly), checks the role and origin, parses the body with zod,
  and turns errors into JSON.
* `proxy.js` is only the first gate. Authorization is **always re-checked** on the server next to the data.

### Folder layout

```
app/
  page.js                  Landing page
  login/                   Sign in
  (student)/               Student area (layout = StudentShell)
    dashboard/ roadmap/ courses/[id]/ lessons/[id]/ tasks/ tasks/[id]/
    achievements/ assistant/ notifications/ profile/
  admin/                   Teacher area (layout = AdminShell)
    page.js (overview) students/ students/[id]/ roadmap/ courses/ courses/[id]/
    lessons/[id]/ tasks/ tasks/[id]/ submissions/ achievements/ ai/ notifications/
  api/                     Route handlers (auth, student, admin, ai, uploads, files)
  icon.svg apple-icon.js manifest.js
components/  brand/ ui/ layout/ lesson/ student/ admin/
lib/         db auth api access gamification notify ai uploads validators utils
prisma/      schema.prisma seed.js
storage/     uploaded files (served through an authenticated route, never public)
```

---

## 2. Database design

```
User 1─1 StudentProfile            User 1─1 TeacherProfile
User 1─* AccessRule  (permissions: LEVEL | COURSE | MODULE | LESSON | TASK)
Level 1─* Course 1─* Module 1─* Lesson 1─* QuizQuestion
Course/Lesson 1─* Task 1─* Submission *─1 User
User 1─* LessonProgress *─1 Lesson
Achievement 1─* UserAchievement *─1 User
User 1─* Notification
User 1─* AIConversation 1─* AIMessage          AISettings (singleton)
User 1─* Upload
```

| Model | Key fields |
| --- | --- |
| **User** | `username` (kids may not have email), `passwordHash`, `role` ADMIN/STUDENT, `isActive` |
| **StudentProfile** | `xp`, `streakDays`, `lastActiveDate`, `birthYear`, `guardianContact`, `aiEnabled`, `notes` |
| **TeacherProfile** | `title`, `bio` |
| **Level** | `order`, `title`, `subtitle`, `color`, `icon` — the roadmap stages |
| **Course** | `levelId`, `order`, `title`, `description`, `icon`, `color`, `difficulty`, `sequential`, `isPublished` |
| **Module** | `courseId`, `order`, `title` |
| **Lesson** | `moduleId`, `order`, `title`, `summary`, `blocks` (JSON: text, video, image, code, attachment, callout), `xpReward`, `durationMin`, `isPublished` |
| **QuizQuestion** | `lessonId`, `question`, `options` (JSON), `correctIndex`, `explanation` |
| **Task** | `type` TASK/HOMEWORK/CHALLENGE/PROJECT, `difficulty`, `skills` (JSON), `deadline`, `points`, `attachments` (JSON), optional `courseId`/`lessonId` |
| **Submission** | `content`, `code`, `links`, `files`, `status` SUBMITTED/NEEDS_REVISION/APPROVED, `grade`, `feedback`, `pointsAwarded` |
| **LessonProgress** | `userId+lessonId` unique, `completedAt`, `quizScore`, `quizTotal` |
| **Achievement** | `criteria` (LESSONS_COMPLETED, TASKS_APPROVED, XP_EARNED, STREAK_DAYS, COURSES_COMPLETED, QUIZ_PERFECT, MANUAL), `threshold`, `xpBonus` |
| **AccessRule** | `userId`, `resourceType`, `resourceId`, `effect` ALLOW/DENY, `availableFrom`, `availableUntil`, `notifiedAt` |
| **AISettings** | `enabled`, `model`, `apiKey?`, `systemPrompt`, `dailyLimit`, `maxOutputTokens`, `temperature`, feature toggles |
| **Notification** | `type` LESSON_UNLOCKED/TASK_ASSIGNED/FEEDBACK/ACHIEVEMENT/SYSTEM, `title`, `body`, `link`, `readAt` |

SQLite has no enums or JSON columns in Prisma, so enums are validated strings and JSON is stored as text
(parsed in `lib/`).

### Access resolution (the permission engine)

Students see **only what is assigned**. For a lesson, the engine walks from most specific to
least specific and the **first rule found wins**:

```
LESSON rule → MODULE rule → COURSE rule → LEVEL rule → (none) = locked "unassigned"
```

* `DENY` → locked, even if the course is allowed (e.g. "Python course ✓, lesson 7 ✗").
* `ALLOW` with `availableFrom` in the future → **scheduled** (shows an "opens on …" date).
* `ALLOW` past `availableUntil` → **expired**.
* Unpublished content is invisible to students regardless of rules.
* `Course.sequential` adds Duolingo-style gating: the next lesson opens once the previous one is completed.
* Tasks: an explicit TASK rule wins; otherwise a task inherits access from its lesson, then its course.

"New lesson unlocked" notifications for scheduled rules are generated lazily: when a student
loads the app, any rule whose `availableFrom` has passed and hasn't been announced yet
(`notifiedAt = null`) triggers a notification. No cron job is needed.

---

## 3. User flows

**Teacher (Super Admin)**
1. Sign in → overview (students, activity, submissions waiting for review).
2. Build the roadmap: levels → courses → modules → lessons (block editor + quiz) → tasks.
3. Create a student account (username + generated password), optionally assign whole levels right away.
4. Open a student → **Access** tab: tree of levels/courses/modules/lessons/tasks, each set to
   *inherit / allow / deny* with optional open/close dates. Or bulk-assign from the students list.
5. Review submissions → grade, write feedback, approve or request a revision → the student is notified and XP is awarded.
6. Configure the AI assistant: on/off, model, daily limit, temperature, instructions; test the connection; see usage.
7. Manage achievements, award them manually, broadcast announcements.

**Student**
1. Sign in → dashboard: rank, XP, streak, continue-learning card, pending tasks, upcoming challenges, badges.
2. Roadmap → pick an unlocked course → lesson list with locked, scheduled and completed states.
3. Lesson: read/watch → take the quiz → "Complete lesson" → XP + celebration → next lesson.
4. Tasks: read the brief → submit text/code/links/files → get feedback → resubmit if asked.
5. AI assistant: explain / review code / hint / debug modes; ask about the current lesson or task in context.
6. Notifications, achievements gallery, profile + password change.

---

## 4. UI structure

* **Language:** Arabic-first, full **RTL** (`dir="rtl"`), with code always rendered LTR.
* **Theme:** light + dark tokens. Brand violet `#7C5CFF` (knowledge), spark amber `#FFB547` (light),
  mint `#22C5A0` (success), coral `#FF6B81` (attention). Font: *Readex Pro* (Arabic + Latin), *JetBrains Mono* for code.
* **Student shell:** sidebar on desktop, **bottom tab bar on mobile** (Home, Roadmap, Tasks, AI, Profile), top bar with XP, streak and notifications.
* **Admin shell:** collapsible sidebar (drawer on mobile), with a dense but clean Linear-style layout.
* **Components:** Card, Button, Input, Select, Switch, Badge, ProgressBar, ProgressRing, Tabs, Modal, EmptyState, StatCard.
* **Gamification:** XP ranks that follow the brand story — شرارة Spark → وهج Glow → شعلة Flame → نجم Star →
  مذنّب Comet → مجرّة Galaxy. Streaks, badges, and a celebration animation when a lesson is completed.

---

## 5. Development roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Plan, scaffold, schema, auth, proxy, design system, brand (logo/favicon) | ✅ |
| 2 | Content model: levels, courses, modules, lessons (blocks + quiz), admin editors | ✅ |
| 3 | Permission engine + per-student access tree + bulk assign | ✅ |
| 4 | Student experience: dashboard, roadmap, lesson player, progress, XP, streaks | ✅ |
| 5 | Tasks, submissions, file uploads, review and feedback | ✅ |
| 6 | Achievements + notifications | ✅ |
| 7 | Gemini AI assistant + admin AI controls and usage | ✅ |
| 8 | Seed curriculum (Arabic), polish, build verification | ✅ |
| 9 | Scroll-animated landing page (GSAP: robot story, input→process→output, typing code, horizontal journey), professional admin overview (KPIs + weekly trend, activity chart, attention list), per-student AI access panel | ✅ |
| Next | Team projects (groups + shared repos), GitHub integration, in-browser code runner, parent reports, English UI, PWA offline, Postgres for multi-server deploys | Planned |
