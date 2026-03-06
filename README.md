# VoteSphere

System głosowania jury dla konkursów Fundacji Play Sustain. Aplikacja umożliwia zarządzanie edycjami konkursów, projektami, jurorami oraz przeprowadzanie wieloetapowego głosowania (ONLINE i GALA).

## Tech Stack

- **Runtime:** Node.js 22+, npm 10+
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI / shadcn/ui
- **Backend:** Next.js Server Actions, NextAuth.js 4
- **State:** Redux Toolkit (client-side)
- **Database:** PostgreSQL 15+, Prisma 6 (ORM + migracje)
- **i18n:** next-intl (PL/EN)
- **Tłumaczenia:** DeepL API (automatyczne tłumaczenia treści projektów)
- **Testy:** Jest 30, Testing Library
- **CI:** GitHub Actions (lint, test, build)

## Funkcjonalności

- **Role użytkowników:** Admin, Staff, Juror
- **Zarządzanie edycjami** konkursów z harmonogramem głosowań
- **Projekty:** tworzenie, import z zewnętrznego API, import CSV, automatyczne tłumaczenia PL/EN
- **Głosowanie:** ocena projektów według kryteriów (skala 0-5), dwie rundy (ONLINE, GALA)
- **Finaliści:** jurorzy mogą oznaczać projekty jako finalistów
- **Wyniki:** rankingi z podziałem na kategorie i rundy
- **Autentykacja:** email/hasło (bcrypt) lub Google OAuth

## Getting Started

### Wymagania

- Node.js 22+ (testowane na 22.16)
- PostgreSQL 15+ (dowolny provider — Neon, Supabase, RDS, self-hosted)
- npm 10+

### Instalacja

```bash
git clone <repo-url>
cd VoteSphere2
npm install
```

`postinstall` automatycznie uruchomi `prisma generate`.

### Zmienne środowiskowe

Skopiuj `.env.example` i wypełnij wartości:

```bash
cp .env.example .env
```

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `DATABASE_URL` | Tak | Connection string PostgreSQL, np. `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `NEXTAUTH_SECRET` | Tak | Klucz do podpisywania sesji. Wygeneruj: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Tak | Pełny URL aplikacji, np. `https://vote.example.com` |
| `GOOGLE_CLIENT_ID` | Nie | Google OAuth — Client ID |
| `GOOGLE_CLIENT_SECRET` | Nie | Google OAuth — Client Secret |
| `BLOB_READ_WRITE_TOKEN` | Nie | Token Vercel Blob Storage (tylko przy użyciu Vercel Blob do przechowywania plików) |
| `DEEPL_API_KEY` | Nie | Klucz API DeepL do automatycznego tłumaczenia treści projektów |
| `NEXT_PUBLIC_APP_URL` | Nie | Publiczny URL aplikacji (domyślnie `http://localhost:3000`) |

### Baza danych

Aplikacja używa Prisma z migracjami SQL. Obsługiwany jest dowolny PostgreSQL 15+.

```bash
# Produkcja — zastosuj istniejące migracje (nie tworzy nowych)
npx prisma migrate deploy

# Development — twórz i aplikuj migracje
npm run db:migrate

# Opcjonalnie: załaduj dane testowe
npm run db:seed
```

Dane testowe (seed) tworzą użytkowników z hasłem `Test123!`:

- admin@example.com (ADMIN)
- staff@example.com (STAFF)
- juror@example.com (JUROR)

### Uruchomienie (development)

```bash
npm run dev
```

Aplikacja dostępna pod [http://localhost:3000](http://localhost:3000)

## Skrypty

| Polecenie | Opis |
|-----------|------|
| `npm run dev` | Serwer deweloperski (hot reload) |
| `npm run build` | Build produkcyjny |
| `npm run start` | Uruchom build produkcyjny (port 3000) |
| `npm run lint` | Sprawdź linting (ESLint 9) |
| `npm run lint:fix` | Napraw błędy lintingu |
| `npm run format` | Formatuj kod (Prettier) |
| `npm run format:check` | Sprawdź formatowanie bez zmian |
| `npm run test` | Uruchom testy (Jest) |
| `npm run test:watch` | Testy w trybie watch |
| `npm run db:generate` | Generuj Prisma Client |
| `npm run db:migrate` | Utwórz i zastosuj migracje (dev) |
| `npm run db:push` | Wypchnij schemat bez migracji (prototypowanie) |
| `npm run db:studio` | Prisma Studio (GUI bazy, port 5555) |
| `npm run db:seed` | Załaduj dane testowe |

## Deployment

### Produkcja na dowolnym serwerze (VPS, AWS, GCP, etc.)

#### 1. Wymagania serwera

- Node.js 22+
- PostgreSQL 15+ (może być na osobnym serwerze)
- Reverse proxy (nginx, Caddy) do obsługi HTTPS i przekierowania na port aplikacji

#### 2. Build i uruchomienie

```bash
# Zainstaluj zależności
npm ci

# Zastosuj migracje na produkcyjnej bazie
npx prisma migrate deploy

# Zbuduj aplikację
npm run build

# Uruchom (domyślnie port 3000)
npm run start

# Lub z własnym portem:
PORT=8080 npm run start
```

#### 3. Konfiguracja standalone (opcjonalne)

Aby uzyskać mniejszy build do wdrożenia (bez `node_modules`), dodaj `output: 'standalone'` w `next.config.ts`. Wtedy wystarczy skopiować na serwer:

```
.next/standalone/        # Serwer Node.js + zależności
.next/static/            # Pliki statyczne (CSS, JS)
public/                  # Pliki publiczne
```

I uruchomić: `node .next/standalone/server.js`

#### 4. Process manager

Na produkcji zalecane jest użycie process managera:

```bash
# PM2
npm install -g pm2
pm2 start npm --name "votesphere" -- start
pm2 save
pm2 startup

# Lub systemd (plik unit):
# [Service]
# WorkingDirectory=/opt/votesphere
# ExecStart=/usr/bin/npm start
# Restart=always
# Environment=NODE_ENV=production
# Environment=PORT=3000
```

#### 5. Reverse proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name vote.example.com;

    ssl_certificate     /etc/ssl/certs/vote.example.com.pem;
    ssl_certificate_key /etc/ssl/private/vote.example.com.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. Docker (opcjonalne)

Jeśli preferujesz konteneryzację, przykładowy `Dockerfile`:

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

> Uwaga: Docker wymaga `output: 'standalone'` w `next.config.ts`.

### Vercel

Aplikacja jest domyślnie skonfigurowana pod Vercel (`vercel.json` w repozytorium):

1. Połącz repozytorium z Vercel
2. Ustaw zmienne środowiskowe w ustawieniach projektu
3. Vercel automatycznie wykryje Next.js i skonfiguruje build

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) uruchamia lint, test i build przy każdym PR i pushu do `master`.

Wymagane sekrety w GitHub:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

## Struktura projektu

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Strona logowania
│   ├── (dashboard)/        # Chronione strony
│   │   ├── admin/          # Panel admina
│   │   ├── jurors/         # Lista jurorów
│   │   ├── projects/       # Zarządzanie projektami
│   │   └── results/        # Wyniki głosowań
│   └── api/auth/           # NextAuth endpoints
├── components/
│   ├── features/           # Komponenty domenowe
│   └── ui/                 # shadcn/ui
├── i18n/                   # Konfiguracja next-intl
├── lib/
│   ├── actions/            # Server Actions
│   ├── auth/               # Konfiguracja NextAuth
│   ├── db/                 # Prisma Client
│   ├── services/           # Serwisy zewnętrzne (DeepL)
│   └── validations/        # Schematy Zod
├── store/                  # Redux Toolkit store
└── messages/               # Tłumaczenia i18n (pl.json, en.json)

prisma/
├── schema.prisma           # Schemat bazy danych
├── migrations/             # Migracje SQL
└── seed.ts                 # Dane testowe
```

## Licencja

Projekt prywatny Fundacji Play Sustain.
