export const CONTRACT_ADDRESS = '0xd833eDF5bC48BF4aE788D39798911Cd62f02FeBD' as const;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;

export const ARC_TESTNET = {
  id: 5042002,
  name: 'ARC Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
} as const;

export const VIBECHECK_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "_usdc", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "username", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "followers", "type": "uint256" }
    ],
    "name": "XAccountLinked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "day", "type": "uint256" },
      { "indexed": false, "internalType": "uint8", "name": "crypto", "type": "uint8" },
      { "indexed": false, "internalType": "uint8", "name": "weather", "type": "uint8" },
      { "indexed": false, "internalType": "uint8", "name": "market", "type": "uint8" },
      { "indexed": false, "internalType": "uint8", "name": "trending", "type": "uint8" }
    ],
    "name": "Predicted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "day", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "totalPool", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "predictorCount", "type": "uint256" }
    ],
    "name": "Settled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "currentDay",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakeAmount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "keeper",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "users",
    "outputs": [
      { "internalType": "string", "name": "xUsername", "type": "string" },
      { "internalType": "uint256", "name": "followerCount", "type": "uint256" },
      { "internalType": "bool", "name": "isVerified", "type": "bool" },
      { "internalType": "uint256", "name": "predictions", "type": "uint256" },
      { "internalType": "uint256", "name": "correct", "type": "uint256" },
      { "internalType": "uint256", "name": "streak", "type": "uint256" },
      { "internalType": "uint256", "name": "lastDay", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "name": "usernameToWallet",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "daySettled",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "username", "type": "string" },
      { "internalType": "uint256", "name": "followerCount", "type": "uint256" },
      { "internalType": "bool", "name": "verified", "type": "bool" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "linkXAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "cryptoChoice", "type": "uint8" },
      { "internalType": "uint8", "name": "weatherChoice", "type": "uint8" },
      { "internalType": "uint8", "name": "marketChoice", "type": "uint8" },
      { "internalType": "uint8", "name": "trendingChoice", "type": "uint8" }
    ],
    "name": "predict",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "day", "type": "uint256" },
      { "internalType": "uint8", "name": "cryptoWin", "type": "uint8" },
      { "internalType": "uint8", "name": "weatherWin", "type": "uint8" },
      { "internalType": "uint8", "name": "marketWin", "type": "uint8" },
      { "internalType": "uint8", "name": "trendingWin", "type": "uint8" }
    ],
    "name": "settleDay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "day", "type": "uint256" },
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getPrediction",
    "outputs": [
      {
        "components": [
          { "internalType": "uint8", "name": "crypto", "type": "uint8" },
          { "internalType": "uint8", "name": "weather", "type": "uint8" },
          { "internalType": "uint8", "name": "market", "type": "uint8" },
          { "internalType": "uint8", "name": "trending", "type": "uint8" }
        ],
        "internalType": "struct VibeCheckV2.CategoryPrediction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyUser",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "xUsername", "type": "string" },
          { "internalType": "uint256", "name": "followerCount", "type": "uint256" },
          { "internalType": "bool", "name": "isVerified", "type": "bool" },
          { "internalType": "uint256", "name": "predictions", "type": "uint256" },
          { "internalType": "uint256", "name": "correct", "type": "uint256" },
          { "internalType": "uint256", "name": "streak", "type": "uint256" },
          { "internalType": "uint256", "name": "lastDay", "type": "uint256" }
        ],
        "internalType": "struct VibeCheckV2.User",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "getUser",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "xUsername", "type": "string" },
          { "internalType": "uint256", "name": "followerCount", "type": "uint256" },
          { "internalType": "bool", "name": "isVerified", "type": "bool" },
          { "internalType": "uint256", "name": "predictions", "type": "uint256" },
          { "internalType": "uint256", "name": "correct", "type": "uint256" },
          { "internalType": "uint256", "name": "streak", "type": "uint256" },
          { "internalType": "uint256", "name": "lastDay", "type": "uint256" }
        ],
        "internalType": "struct VibeCheckV2.User",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "day", "type": "uint256" }],
    "name": "getPredictorCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "day", "type": "uint256" }],
    "name": "getDayPredictors",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Categories for per-category predictions
export const CATEGORIES = [
  { id: 'crypto', label: 'Crypto Market', icon: 'TrendingUp', description: 'Fear & Greed Index mood' },
  { id: 'weather', label: 'Global Weather', icon: 'Cloud', description: 'Weather vibe worldwide' },
  { id: 'market', label: 'Market Volatility', icon: 'Activity', description: 'BTC 24h volatility' },
  { id: 'trending', label: 'Trending Topic', icon: 'Hash', description: 'Social media trend' },
] as const;

export const VIBES = [
  { id: 0, label: 'CHILL', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', icon: '❄️' },
  { id: 1, label: 'HECTIC', color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', icon: '⚡' },
  { id: 2, label: 'BULLISH', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', icon: '📈' },
  { id: 3, label: 'DOOMER', color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', icon: '📉' },
] as const;
