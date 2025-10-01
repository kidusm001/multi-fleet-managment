# Agent Instructions for Multi-Fleet Management

## Build/Lint/Test Commands
- `pnpm dev` - Start all dev servers (client: vite, server: ts-node)
- `pnpm build` - Build all packages (client: tsc + vite, server: tsc)
- `pnpm start` - Start production servers
- `pnpm test` - Run server tests with Vitest
- `pnpm test:watch` - Run server tests in watch mode
- `npx vitest run <file>` - Run single test file
- `pnpm lint` - Lint client code with ESLint

## Code Style Guidelines
- **TypeScript**: Strict mode, no unused vars/locals/parameters, ES2020 (server) / ES2022 (client)
- **Modules**: CommonJS (server), ESNext (client), JSX with react-jsx
- **Imports**: External first, then local (blank line separator)
- **Naming**: camelCase vars/functions, PascalCase types, SCREAMING_SNAKE_CASE constants, kebab-case files
- **Error Handling**: Try/catch with proper error typing and dev-only stack traces
- **Testing**: Vitest with globals, supertest for API, jest-mock-extended for mocks
- **Database**: Prisma ORM - run `npx prisma generate` after schema changes
- **Linting**: ESLint with TypeScript, React hooks, and React refresh rules

## Project Rules
- Do not edit client code in `packages/server`
