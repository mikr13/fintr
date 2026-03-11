# Fintr - AI Agent Build Guide

## What Is This

Fintr is a self-hosted household finance tracker. It tracks accounts (assets & debts), transactions (income/expense/transfer), budgets by category, and supports multiple household members with separate credentials. It exposes an external API for automation tools (iPhone Shortcuts, Samsung Automation, n8n) to add transactions programmatically.

**No paid third-party services.** Everything is self-hostable.

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TanStack Start + TanStack Router | File-based routing in `src/routes/` |
| Backend/DB | Convex | Real-time, self-hostable. Functions in `convex/` |
| Styling | Tailwind CSS v4 + shadcn/ui (canary) | Dark-first theme. CSS vars in `src/styles/app.css` |
| Auth | `@convex-dev/auth` (Password provider) | Self-contained, no Clerk/Auth0 |
| 2FA | `otpauth` library | TOTP, Google Authenticator compatible |
| Icons | `lucide-animated` | Installed via shadcn CLI, animated with Motion |
| Animation | `motion` (Framer Motion) | Page transitions, micro-interactions |
| Charts | `recharts` | Net worth charts, budget donuts, sparklines |
| Dates | `date-fns` | Formatting, manipulation |

## Project Structure

```
fintr/
├── convex/                     # Convex backend functions + schema
│   ├── schema.ts               # Database schema (all tables)
│   ├── auth.ts                 # Convex Auth config
│   ├── http.ts                 # HTTP Actions (external API)
│   ├── crons.ts                # Scheduled jobs (token cleanup)
│   ├── users.ts                # User queries/mutations
│   ├── households.ts           # Household CRUD + invites
│   ├── accounts.ts             # Account CRUD + balance history
│   ├── transactions.ts         # Transaction CRUD + rules
│   ├── budgets.ts              # Budget CRUD
│   ├── categories.ts           # Category CRUD + defaults
│   ├── tags.ts                 # Tag CRUD
│   ├── merchants.ts            # Merchant CRUD
│   ├── apiKeys.ts              # API key + token management
│   └── _generated/             # Auto-generated (do not edit)
├── src/
│   ├── routes/                 # TanStack Router file-based routes
│   │   ├── __root.tsx          # Root layout (providers, head)
│   │   ├── _authed.tsx         # Auth guard layout (sidebar + content)
│   │   ├── _authed/
│   │   │   ├── index.tsx       # Dashboard
│   │   │   ├── transactions.tsx
│   │   │   ├── budgets.tsx
│   │   │   └── accounts/
│   │   │       └── $accountId.tsx
│   │   ├── _auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── verify-2fa.tsx
│   │   ├── onboarding/
│   │   │   ├── index.tsx
│   │   │   └── preferences.tsx
│   │   └── settings/
│   │       ├── _layout.tsx     # Settings sidebar layout
│   │       ├── profile.tsx
│   │       ├── preferences.tsx
│   │       ├── security.tsx
│   │       ├── api-key.tsx
│   │       ├── categories.tsx
│   │       ├── tags.tsx
│   │       ├── merchants.tsx
│   │       └── rules.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── accounts-panel.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── user-menu.tsx
│   │   ├── dashboard/
│   │   │   ├── net-worth-card.tsx
│   │   │   ├── assets-breakdown.tsx
│   │   │   └── period-selector.tsx
│   │   ├── accounts/
│   │   │   ├── account-type-picker.tsx
│   │   │   ├── account-form.tsx
│   │   │   └── account-card.tsx
│   │   ├── transactions/
│   │   │   ├── transaction-table.tsx
│   │   │   ├── transaction-form.tsx
│   │   │   └── transaction-filters.tsx
│   │   ├── budgets/
│   │   │   ├── budget-chart.tsx
│   │   │   ├── category-row.tsx
│   │   │   └── month-navigator.tsx
│   │   └── settings/
│   │       ├── household-members.tsx
│   │       ├── two-factor-setup.tsx
│   │       └── api-key-manager.tsx
│   ├── lib/
│   │   ├── utils.ts            # cn() helper, formatCurrency, formatDate
│   │   ├── constants.ts        # Account types, subtypes, default categories
│   │   └── validators.ts       # Password validation, shared validators
│   ├── hooks/
│   │   ├── use-current-user.ts
│   │   ├── use-household.ts
│   │   └── use-theme.ts
│   ├── styles/
│   │   └── app.css             # Tailwind + theme CSS variables
│   └── router.tsx              # Router + Convex + React Query setup
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── components.json             # shadcn config
```

## Conventions

### TypeScript
- Strict mode. No `any` types. Use Convex's `v.*` validators for all function args.
- Path alias: `~/` maps to `src/`. Use it for all imports from src.
- Export types alongside implementations. Prefer `type` imports with `import type`.

### Convex Functions
- One file per domain: `accounts.ts`, `transactions.ts`, etc.
- Every query/mutation that accesses household data MUST verify the user belongs to that household.
- Pattern for household-scoped queries:
  ```typescript
  const user = await getAuthUser(ctx);
  const householdId = user.householdId;
  // All queries filter by householdId
  ```
- Use indexes for all frequent query patterns. Define them in schema.ts.
- Mutations validate all inputs with `v.*` validators.

### React Components
- Functional components only. Use hooks for state and effects.
- shadcn/ui components live in `src/components/ui/` (auto-managed by shadcn CLI).
- Custom components organized by feature domain in `src/components/<domain>/`.
- Use `cn()` from `~/lib/utils` for conditional class merging.
- Use lucide-animated icons (from `~/components/ui/<icon-name>`) instead of plain lucide-react.

### Styling
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (no PostCSS config needed).
- Dark-first design. Use CSS custom properties defined in `app.css` for theme colors.
- Color semantics: `--color-positive` (emerald/green) for gains, `--color-negative` (coral/red) for losses, `--color-accent` for interactive elements.
- No inline styles. No CSS modules. Tailwind utility classes only.

### Routing
- File-based routing with TanStack Router.
- `_authed.tsx` is the auth guard layout — checks session, redirects to `/login` if unauthenticated.
- `_auth/` prefix is for public auth pages (login, register, 2fa).
- `settings/` uses a `_layout.tsx` for the settings sidebar.

### Auth & Security
- `@convex-dev/auth` Password provider handles registration, login, sessions.
- TOTP 2FA is custom-built on `otpauth` library, runs in Convex actions.
- All secrets (TOTP, API keys) stored server-side only, hashed.
- External API uses short-lived tokens (6h) authenticated via bearer header.

### Data Model
- All financial data is scoped to a `householdId`. No cross-household data access.
- Amounts stored as numbers (cents for precision where needed).
- Dates stored as ISO strings or Unix timestamps.
- Soft delete where appropriate (transactions keep audit trail).

## Design Direction

**Aesthetic: "Refined Utility"**

- Dark charcoal backgrounds (`#09090b` base), with a polished light mode.
- Font pairing: **Instrument Sans** (headings) + **DM Sans** (body). Import from Google Fonts.
- Color palette: emerald for positive values, coral/red for negative, muted slate-blue for neutral interactive elements.
- Subtle depth: 1px borders with `rgba(255,255,255,0.06)`, soft shadows, frosted glass on modals via `backdrop-blur`.
- Motion: staggered fade-in on page loads, smooth accordion expansions, chart animations. Use `motion` library for React component animations.
- Icons animate on hover and on significant state changes (e.g., check animates on save).

## Key Patterns

### Household Scoping (CRITICAL)
Every query and mutation that touches financial data must:
1. Get the authenticated user via Convex Auth
2. Read the user's `householdId`
3. Filter all DB queries by that `householdId`
4. NEVER accept `householdId` from the client

### Account Balance Tracking
When a transaction is created/updated/deleted, the associated account's `balance` must be updated and a new `accountBalanceHistory` entry created for the current date.

### Transaction Rules
When a transaction is created (from UI or API), check `transactionRules` for the household. If conditions match (merchant name, amount range, description pattern), auto-apply the actions (set category, add tags).

### External API Flow
1. User generates a long-lived API key in Settings > API Key
2. Automation tool calls `POST /api/token` with API key → gets 6h temp token
3. Automation tool calls `POST /api/transactions` with temp token → creates transaction
4. All API access logged in `apiAuditLog`

## What NOT To Build
- No AI features (no ChatGPT, no LLM integration)
- No cryptocurrency tracking (skip crypto account type)
- No bank API integration (Plaid, etc.) — manual entry + CSV import only
- No mobile app — web only, responsive
- No email sending for now (password reset via admin, not email flow)
