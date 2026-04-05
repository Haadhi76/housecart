# HouseCart

> Your household's shared shopping list & recipe grocery planner.

## Features

- **Shared Shopping Lists** — Create and manage lists collaboratively with your household
- **Real-Time Sync** — Items update instantly across all devices via Supabase Realtime
- **Recipe Import** — Paste a recipe URL to auto-extract ingredients (JSON-LD parsing)
- **Add Recipes to Lists** — Scale servings and add ingredients to any shopping list with one tap
- **Household Management** — Invite members with a code, manage roles
- **Mobile-First Design** — Built for use in the supermarket, with a clean bottom-nav layout
- **Magic Link & Google Auth** — Passwordless sign-in via email or Google OAuth

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Realtime)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) + [React Query](https://tanstack.com/query)
- **Hosting:** [Vercel](https://vercel.com/) (free Hobby tier)

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account (free tier)

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/housecart.git
cd housecart

# Install dependencies
pnpm install

# Copy env file and fill in your Supabase credentials
cp .env.example .env.local

# Run the database migration
# Paste the contents of supabase/migrations/001_initial_schema.sql
# into your Supabase SQL Editor and execute it

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

HouseCart is designed to deploy to **Vercel** for free:

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com/)
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy — every push to `main` auto-deploys

## License

[MIT](LICENSE) © 2026 HouseCart Contributors

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
