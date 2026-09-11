# MeetingFlow AI

Interview-ready prototype for automating post-meeting work: an employee pastes or uploads a meeting transcript, AI structures the content, a human reviews and confirms, and only then does data flow through a mock business-system API into Supabase. A demo page proves the transfer succeeded. Follow-up email stays a draft (copy / mailto only).

UI copy is **Slovenian**; code, types, and APIs are **English**. Authentication, billing, and multi-tenancy are out of scope.

## Business problem

After client meetings, staff manually read transcripts, extract requirements and action items, assign owners and deadlines, enter data into an internal system, and draft follow-up email. That work is repetitive and error-prone.

## Solution

1. Provide a digital transcript (paste, upload `.txt` / `.pdf` / `.docx`, or use a built-in sample).
2. **POST `/api/analyze`** calls the OpenAI Responses API with structured output, then validates with Zod.
3. The user reviews and edits all fields on `/`.
4. On **Potrdi in prenesi v poslovni sistem**, the app sends the **current form values** to **POST `/api/business-system/meetings`** (mock internal API).
5. Validated data is persisted in Supabase (mock internal database).
6. **`/business-system`** loads **GET `/api/business-system/meetings`** and shows compact cards so an interviewer can verify the end-to-end path.
7. Follow-up subject/body can be regenerated from confirmed JSON via **POST `/api/follow-up`**; the app never sends email.

## Architecture

```
Digital transcript
        ↓
Next.js frontend
        ↓
POST /api/analyze  (optional: POST /api/extract-transcript first)
        ↓
OpenAI Responses API → structured output → Zod
        ↓
Human review / correction
        ↓
Human confirmation
        ↓
POST /api/business-system/meetings → Zod → Supabase
        ↓
GET /api/business-system/meetings
        ↓
/business-system (proof view)
```

The browser **never** talks to Supabase directly. All persistence goes through server routes using the Supabase **service role** key.

## Why human confirmation exists

Structured AI output is a draft, not a source of truth. Owners, deadlines, and client commitments affect real work. The prototype requires explicit confirmation before any write to the business system, matching how a production tool would gate integration with internal APIs.

## Hallucination protection

- Strict system prompts (no inventing facts; use `null` when unknown).
- OpenAI **Structured Outputs** (`json_schema`) plus a second **Zod** validation pass.
- Explicit **uncertainties** and auto-derived notes (e.g. ambiguous owner, missing deadline).
- Full **human review** with editable lists and action-item table.
- **No direct AI write** to the business system—only the human-confirmed payload is transferred.

## API failure handling

**Prototype:** If transfer fails (including a demo **Simuliraj napako API-ja** switch that returns 503 without writing), reviewed data stays on screen. The user can **Poskusi znova** without re-running AI analysis.

**Production (not implemented):** Retries with exponential backoff, a durable queue, dead-letter handling, structured logging, and monitoring—so transient outages do not lose confirmed payloads and operations can alert on repeated failures.

## Prototype simplifications

| Prototype | Production |
| --- | --- |
| Textarea / file upload for transcripts | Teams, Zoom, CRM, or transcription pipelines |
| Hardcoded demo employees | Employee directory from the internal system |
| First-name match heuristic + uncertainty notes | Authoritative identity resolution |
| Supabase as mock internal system | Real business-system API and database |
| `/business-system` as proof UI | Existing internal application |
| No authentication | Company SSO / identity provider |
| Manual retry after failure | Automated retries, queue, DLQ, observability |
| Follow-up draft (copy / mailto) | Approved send flow via company email or CRM |
| Configurable `OPENAI_MODEL` (default `gpt-5.6-sol`) | Approved production model |
| Best-effort PDF/DOCX extract (5 MB, paste fallback) | Dedicated ingestion pipeline |

## Local setup

1. Install dependencies (if not already):

   ```bash
   npm install
   ```

2. Copy environment template and fill in secrets (server-only; never use `NEXT_PUBLIC_` for these):

   ```bash
   cp .env.example .env.local
   ```

   ```bash
   OPENAI_API_KEY=
   OPENAI_MODEL=gpt-5.6-sol
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

3. In Supabase, run the SQL in [`supabase/migrations/001_meetings.sql`](supabase/migrations/001_meetings.sql). Enable RLS with **no** anonymous policies; the app uses the service role on the server only.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). Use **Uporabi primer** → **Analiziraj z AI** → review → **Potrdi in prenesi v poslovni sistem** → **Odpri poslovni sistem** or the header link to verify data on `/business-system`.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Security notes

- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are used only in server code and environment variables.
- API routes return generic Slovenian error messages; no stack traces or secrets in responses.
- Row Level Security is enabled on `meetings` and `action_items` without public policies; only the server service role performs reads and writes.

## Reference

Product requirements and acceptance criteria: [`PRD-SOW.md`](PRD-SOW.md).
