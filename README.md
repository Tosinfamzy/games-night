# Games Night

A real-time interactive platform for organizing and managing game nights with friends, family, or colleagues. Built with Next.js and WebSockets for live updates and interactivity.

## Features

- **Session Management**: Create and manage game night sessions with unique join codes
- **Player Management**: Track participants, assign them to teams, and manage their game participation
- **Real-time Updates**: Live scoring, leaderboards, and game state updates
- **Game Analytics**: Track performance, strategies, and statistics across games
- **Team Formation**: Create random or custom teams for competitive play
- **QR Code Joining**: Allow players to join sessions via QR codes
- **Mobile-friendly Interface**: Play and participate from any device

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **State Management**: Zustand
- **Real-time Communication**: Socket.io
- **Charts & Visualization**: Chart.js
- **QR Code Generation**: qrcode.react
- **Animation**: Framer Motion

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The application will be available at [http://localhost:5173](http://localhost:5173) (note the custom port in package.json).

## Project Structure

- `/src/app`: Next.js App Router pages and layouts
- `/src/components`: Reusable React components
  - `/analytics`: Analytics dashboards and charts
  - `/games`: Game-related components
  - `/sessions`: Session management components
  - `/ui`: UI components like buttons, modals, etc.
- `/src/lib`: Utility functions, hooks, and schemas
- `/src/services`: API service functions
- `/src/store`: Zustand state management
- `/src/types`: TypeScript type definitions

## API Reference

The application communicates with a backend service that provides the following endpoints:

- **Games**: Create, manage, and configure games
- **Sessions**: Create and manage game night sessions
- **Players**: Add and manage players in sessions
- **Teams**: Create and organize teams
- **Scoring**: Track points and manage leaderboards
- **Analytics**: View game statistics and player performance

For detailed API documentation, see `src/lib/schemas/api.schema.json` which contains the OpenAPI specification.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
