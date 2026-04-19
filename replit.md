# Hệ thống Quản lý Đào tạo

## Overview

A full-stack Vietnamese training management system (Hệ thống Quản lý Đào tạo Nội bộ) built with React + Vite frontend and Express + PostgreSQL backend.

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

## Artifacts

- `artifacts/training-management` - Main web app (React + Vite), served at `/`
- `artifacts/api-server` - REST API backend, served at `/api`

## Features

1. **Khóa học** - CRUD for training courses (name, content, duration)
2. **Lớp học** - CRUD for classes with sessions management and student list tabs
3. **Học viên** - CRUD for students with full profile (CCCD, workplace, photo, etc.)
4. **Giảng viên** - CRUD for instructors with academic title, position, specialization
5. **Cấp chứng chỉ** - Certificate management per class with decision number, supervisor, print location

## Database Tables

- `instructors` - Giảng viên
- `courses` - Khóa học
- `classes` - Lớp học
- `sessions` - Buổi học
- `students` - Học viên
- `certificates` - Chứng chỉ (composite PK: studentId + classId)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
