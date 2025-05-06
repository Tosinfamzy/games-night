# Games Night

A real-time interactive platform for organizing and managing game nights with friends, family, or colleagues. Built with Next.js and WebSockets for live updates and interactivity.

## Features

- **Session Management**: Create and manage game night sessions with unique join codes
- **Player Management**: Track participants, assign them to teams, and manage their game participation
- **Real-time Updates**: Live scoring, leaderboards, and game state updates
- **Game Analytics**: Track performance, strategies, and statistics across games
- **Team Formation**: Create random or custom teams for competitive play
- **Team Chat**: Real-time team communication through WebSockets for strategy discussions
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
    - `TeamChat.tsx`: Team-specific real-time chat component
  - `/ui`: UI components like buttons, modals, etc.
- `/src/lib`: Utility functions, hooks, and schemas
  - `websocket.ts`: WebSocket service for real-time communication
- `/src/services`: API service functions
- `/src/store`: Zustand state management
- `/src/types`: TypeScript type definitions

## API Reference

The application communicates with a backend service that provides the following endpoints:

- **Games**: Create, manage, and configure games
- **Sessions**: Create and manage game night sessions
- **Players**: Add and manage players in sessions
- **Teams**: Create and organize teams with real-time chat capabilities
- **Scoring**: Track points and manage leaderboards
- **Analytics**: View game statistics and player performance

For detailed API documentation, see `src/lib/schemas/api.schema.json` which contains the OpenAPI specification.

## Socket Implementation

The application uses Socket.io for real-time communication with structured socket rooms:

- **Session Rooms** (`session_${sessionId}`): For session-wide communications
- **Team Rooms** (`team_${teamId}`): For team-specific communications

Players join both session rooms and their respective team rooms when applicable, enabling:

- Real-time score updates
- Team chat messages
- Notifications when players join or leave teams
- Game state changes
