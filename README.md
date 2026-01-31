# OOCAA DMS Mock App

Next.js App Router + Prisma + PostgreSQL mock document management system with RBAC and branch isolation.

## Stack
- Next.js App Router (TypeScript strict)
- PostgreSQL (Docker)
- Prisma ORM + seed
- JWT auth (HttpOnly cookie)
- shadcn/ui + lucide-react

## Demo Credentials
- HQ Admin: `hq@oocaa.local` / `Passw0rd!`
- Branch Admin (Adama): `adama@oocaa.local` / `Passw0rd!`
- Auditor: `audit@oocaa.local` / `Passw0rd!`

## Setup
1) Start Postgres
```bash
docker-compose up -d
```

2) Install dependencies
```bash
npm install
```

3) Configure env
```bash
cp .env.example .env
```

4) Prisma migrate + seed
```bash
npx prisma migrate dev
npx prisma db seed
```

5) Run app
```bash
npm run dev
```

## App Notes
- JWT stored in HttpOnly cookie `access_token`.
- RBAC enforced server-side; auditors are read-only.
- Branch isolation: branch admins see only their branch data.
- Mandatory payment rule enforced for status changes to REVIEWED/APPROVED.
- File uploads stored locally under `/uploads` (gitignored).

## Demo Script
1) Login as Branch Admin (adama@oocaa.local).
2) Create a new document and upload a payment receipt.
3) Mark the document as REVIEWED.
4) Login as HQ Admin (hq@oocaa.local) and APPROVE or REJECT with reason.
5) Visit Audit Logs and Reports to verify entries and totals.

## Commands
```bash
npm run dev
npm run build
npm run start
npm run lint
```
