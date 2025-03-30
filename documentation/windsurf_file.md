---

# .windsurfrules

## Project Overview
- **Type:** Self-Hosted File Storage and Sharing Application
- **Description:** A modern, clean UI application for self-hosted file storage and sharing, featuring one-click backup, file sharing functionalities, and role-based management.
- **Primary Goal:** To provide a simplified, scalable, and secure file management solution for self-hosters, enabling easy backups, efficient file sharing, and streamlined user account management.

## Project Structure
### Framework-Specific Routing
- **Directory Rules:**
  - Next.js 14 (app router): Enforce use of the `app/` directory with nested route folders following the `app/[route]/page.tsx` conventions.
  - Example 1: "Next.js 14 (App Router)" → `app/[route]/page.tsx` conventions
  - Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern
  - Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter`

### Core Directories
- **Versioned Structure:**
  - app/api: Next.js 14 API routes with Route Handlers for backend integrations (e.g., Supabase functions).
  - Example 1: `app/api` → "Next.js 14 API routes with Route Handlers"
  - Example 2: `src/views` → "Vue 3 composition API components (as an example for other tech stacks)"

### Key Files
- **Stack-Versioned Patterns:**
  - app/dashboard/layout.tsx: Root layout file for the dashboard module in Next.js 14.
  - Example 1: `app/dashboard/layout.tsx` → "Next.js 14 root layouts"
  - Example 2: `pages/_app.js` → "Next.js Pages Router customization"

## Tech Stack Rules
- **Version Enforcement:**
  - next@14: App Router is required; legacy methods like `getInitialProps` are disallowed.
  - Tailwind@3+: Utilize utility-first CSS with Tailwind for consistent UI styling.
  - shadcn UI: Follow component-based design patterns per the library's recommendations.

## PRD Compliance
- **Non-Negotiable:**
  - "Backups should be compressed (ZIP) and stored either locally on a separate partition/drive or offsite (cloud, external drive).": Must incorporate both one-click manual backups and scheduled backup functionality.
  - "File Sharing must support both temporary (expiring) and permanent links.": Ensure link generation adheres to role-based access controls and expiration logic.

## App Flow Integration
- **Stack-Aligned Flow:**
  - Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses server actions and Supabase authentication.
  - Dashboard Flow → `app/dashboard/page.tsx` provides an overview of files, storage, and backup status.
  - File Manager Flow → `app/files/[...slug]/page.tsx` handles file upload, organization, one-click backups, and sharing functionalities.
  - Settings & Admin Panel Flow → Separate modules under `app/settings/` and `app/admin/` for user settings and administrative operations.

---