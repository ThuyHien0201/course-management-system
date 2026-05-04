# Hệ thống Quản lý Đào tạo

## Overview

A full-stack Vietnamese training management system (Hệ thống Quản lý Đào tạo Nội bộ) built with React + Vite frontend and Express + PostgreSQL backend, with JWT authentication and QC workflow.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter + react-query
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (`jsonwebtoken` + `bcryptjs`)

## Artifacts

- `artifacts/training-management` - Main web app (React + Vite), served at `/`
- `artifacts/api-server` - REST API backend, served at `/api`

## Features

1. **Đăng nhập / Auth** — JWT-based login with 3 demo accounts, role-based access control
2. **Khóa học** — CRUD for training courses (staff only to edit)
3. **Lớp học** — CRUD for classes with sessions management and student results
4. **Học viên** — CRUD for students with full profile (CCCD, workplace, photo, etc.)
5. **Giảng viên** — CRUD for instructors with academic title, position, specialization
6. **Cấp chứng chỉ** — Certificate management per class (issuer role only can issue)
7. **Quản lý chất lượng (QC)** — Approve/reject 7 entity types with history log
8. **Quản lý tài khoản** — Role/permission documentation page (QC only)

## Demo Accounts

| Username | Password | Role | Permissions |
|---|---|---|---|
| `nhanvien` | `demo123` | staff | CRUD courses/classes/students/instructors/sessions, view certificates |
| `capchungchi` | `issuer123` | issuer | Issue and update certificates |
| `qc` | `qc123` | qc | Approve/reject all entities, manage accounts |

## Role-Based Access

- **staff**: Can create/edit/delete all data modules. Certificate page is view-only.
- **issuer**: Can issue and update certificates. All other modules are view-only.
- **qc**: Can approve/reject in QC module. Has access to QC + Accounts pages. All other modules are view-only.

## QC Workflow

All created/updated data starts with `approvalStatus = "PENDING"`. The QC account reviews and either approves or rejects. Status badges (Chờ duyệt / Đã duyệt / Từ chối) are shown on every module page.

Entity types in QC: `course`, `class`, `student`, `instructor`, `session`, `result`, `certificate`

## Database Tables

- `users` — Auth accounts (username, passwordHash, displayName, role)
- `instructors` — Giảng viên (with approvalStatus)
- `courses` — Khóa học (with approvalStatus)
- `classes` — Lớp học (with approvalStatus)
- `sessions` — Buổi học (with approvalStatus)
- `students` — Học viên (with approvalStatus + resultApprovalStatus)
- `certificates` — Chứng chỉ (composite PK: studentId + classId, with approvalStatus)
- `approval_history` — Log of all QC actions

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run tsx src/seed.ts` — re-seed demo data
- `pnpm --filter @workspace/api-server run dev` — run API server locally
