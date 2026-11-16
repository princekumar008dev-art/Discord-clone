# Discord Clone

A full-featured Discord clone built with:
- **Next.js 15** (App Router, React 19, TypeScript)
- **Supabase** (PostgreSQL, Auth, Realtime)
- **LiveKit** (Voice/Video calls)
- **Tailwind CSS** (Discord-like styling)
- **Zustand** (State management)

## Features

✅ **Text Chat**
- Servers with categories and channels
- Real-time messaging via Supabase Realtime
- Direct messages
- Message reactions
- File attachments (UI ready)

✅ **Voice & Video**
- Voice channels with LiveKit
- Video calls
- Screen sharing
- Mute/Deafen controls

✅ **Authentication**
- Email/password
- OAuth (GitHub, Google, Discord)
- JWT session management

✅ **UI/UX**
- Discord-like dark theme
- Responsive layout
- Collapsible sidebars
- Member list with roles
- Pinned messages panel

## Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings → API to get your URL and anon key
3. Run the SQL in `supabase-schema.sql` in the SQL Editor
4. Enable Realtime for tables: messages, channels, server_members, voice_states, dm_messages

### 2. Create LiveKit Project
1. Go to [livekit.io](https://livekit.io) or [cloud.livekit.io](https://cloud.livekit.io)
2. Create a new project
3. Get your API Key, API Secret, and WebSocket URL

### 3. Configure Environment
Copy `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Auth callback
│   ├── dm/                # Direct messages
│   ├── login/             # Login page
│   ├── register/          # Register page
│   ├── server/[id]/       # Server pages
│   └── settings/          # Settings page
├── components/
│   ├── chat/              # Chat components
│   ├── layout/            # Layout components (sidebars, etc.)
│   ├── ui/                # Reusable UI components (shadcn-style)
│   └── voice/             # Voice/video components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── livekit.ts         # LiveKit utilities
│   ├── store.ts           # Zustand store
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
└── middleware.ts          # Auth middleware
```

## Key Technologies

- **Supabase**: Handles auth, database, and realtime subscriptions
- **LiveKit**: WebRTC infrastructure for voice/video
- **Zustand**: Lightweight state management
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first styling

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## License

MIT