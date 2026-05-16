# Rialo Temple

Rialo Temple is a Vite React app for Arc Testnet rituals: profile setup, daily Grialo check-ins, food and film review stamps, leaderboard rankings, and the no-wallet Rialo City simulator.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS with local Rialo Temple theme styles
- wagmi, RainbowKit, viem
- Foundry smart contract in `contracts/src/RialoTemple.sol`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set your WalletConnect/Reown project id:

```bash
VITE_RIALO_TEMPLE_ADDRESS=0x677D6d43C8F235a22Fec0efE8A571447E30D0f72
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

3. Run the app:

```bash
npm run dev
```

The Vite server is configured for `http://localhost:3000/`.

## Build

```bash
npm run build
```

The production files are emitted to `dist/`.

## Contract

```bash
npm run contracts:build
npm run contracts:test
```

The frontend defaults to the deployed address in `src/config/contracts.ts`, but `VITE_RIALO_TEMPLE_ADDRESS` overrides it for another deployment.
