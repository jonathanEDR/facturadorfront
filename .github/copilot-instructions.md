
# Copilot Instructions for Facturador Frontend (Next.js)

## Project Overview
- **Framework:** Next.js 15 (App Router, `src/app/`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Clerk (see `.env.local`, `src/app/layout.tsx`)
- **UI:** Radix UI, custom UI in `src/components/ui/`
- **Domain:** Electronic invoicing for Peruvian businesses (SUNAT integration)

## Architecture & Patterns
- **App Structure:**
  - `src/app/`: Next.js App Router pages (e.g., `/dashboard`, `/invoices`, `/clients`)
  - `src/components/`: Reusable UI/domain components, grouped by feature (e.g., `clients/`, `empresas/`, `sunat/`)
  - `src/hooks/`: Custom React hooks for data/state logic
  - `src/services/`: API and business logic (e.g., `clientes.ts`, `facturas.ts`, `consultas.ts`)
  - `src/types/`: TypeScript domain models
  - `src/utils/`: Utilities (formatting, validation, date/time)
  - `src/contexts/`: React Context providers for global/shared state
- **Data Flow:**
  - **Global State:** Use React Context (e.g., `ClientesProvider` in `src/contexts/ClientesContext.tsx`) for shared data
  - **API Calls:** All data mutations/queries go through `src/services/`
  - **Forms:** Use local state and validation helpers from `useFormValidation` and `utils/validations/`
  - **SUNAT Integration:** Service modules (see `src/services/consultas.ts`), test with `public/test-ruc.js`
- **State Management:**
  - **Always use context providers** for shared state (e.g., `useClientesContext()` not `useClientes()`)
  - Context providers are registered in `DashboardLayout` (`src/components/layout/DashboardLayout.tsx`)
- **Auth:**
  - All protected routes/components use Clerk's `SignedIn` and `useUser`
  - Main layout (`src/app/layout.tsx`) wraps content with `ClerkProvider`

## Developer Workflows
- **Start Dev Server:** `npm run dev` (see `README.md`)
- **Environment:** Configure `.env.local` with Clerk and other API keys
- **Hot Reload:** Edit files in `src/app/` or `src/components/` for instant updates
- **Testing SUNAT:** Use `public/test-ruc.js` in browser console for RUC queries
- **Deploy:** Use Vercel (see `README.md`)

## Project-Specific Conventions
- **Component Grouping:** Feature folders in `src/components/`; UI primitives in `src/components/ui/` (Radix-based, Tailwind-styled)
- **State Management:** Always use context providers for shared state; register in `DashboardLayout`
- **Type Safety:** All domain data uses types from `src/types/`
- **Error Handling:**
  - User-facing errors: UI feedback (status messages, badges)
  - Console logs: Emoji prefixes for clarity (e.g., `❌ [ClientList] Error...`)
- **SUNAT Integration:** Test/production modes supported; see `src/components/sunat/SunatConfig.tsx`
- **Performance:** Use `useCallback` for event handlers and async functions to prevent infinite re-renders
- **Form State:** Avoid direct state mutations; always use provided update functions from hooks
- **Component Memoization:** Separate update functions for different form sections to minimize re-renders

## Common Issues & Solutions
- **Infinite Re-renders:** Check useEffect dependencies and wrap functions with useCallback
- **Select/Dialog Warnings:** Radix UI components need proper ref forwarding and description attributes
- **API Loading States:** Always implement loading indicators for async operations
- **Form Validation:** Use custom validation hooks rather than inline validation logic
- **Keys in Lists:** Use stable, unique keys (avoid index-based keys like `key={item-${item}-${index}}`)
- **Client State Updates:** Memoize update functions with useCallback to prevent unnecessary re-renders
- **Component Optimization:** Use useMemo for derived values and useCallback for event handlers

## Integration Points
- **Clerk:** Auth flows, user context, and route protection
- **SUNAT:** RUC/DNI validation, document submission (see `src/services/consultas.ts`)
- **API Services:** All data mutations/queries go through `src/services/`

## Examples
- **Client CRUD:** `src/components/clients/ClientList.tsx`, `ClientForm.tsx`
- **Company Config:** `src/components/empresas/EmpresaForm.tsx`
- **SUNAT Config:** `src/components/sunat/SunatConfig.tsx`

## References
- [README.md](../README.md) — Setup, environment, deployment
- [src/types/](../src/types/) — Domain models
- [src/services/](../src/services/) — API/service logic

---
For new patterns or changes, update this file to keep AI agents productive.
