export const GRIALO_SIGNATURE_CARDS_ADDRESS =
  '0x19408f2ce5c2A56938e7cc771184b9b8D83e3FA1' as const

export const GRIALO_SIGNATURE_CARDS_ABI = [
  {
    type: 'function',
    name: 'mintCard',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'xUsername', type: 'string' },
      { name: 'profileImageUrl', type: 'string' },
      { name: 'signature', type: 'string' },
      { name: 'borderGradient', type: 'string' },
      { name: 'cardTheme', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCard',
    stateMutability: 'view',
    inputs: [{ name: 'cardId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'xUsername', type: 'string' },
          { name: 'profileImageUrl', type: 'string' },
          { name: 'signature', type: 'string' },
          { name: 'borderGradient', type: 'string' },
          { name: 'cardTheme', type: 'string' },
          { name: 'mintedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getMyCardIds',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getCardIdsByOwner',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getCardsByOwner',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'xUsername', type: 'string' },
          { name: 'profileImageUrl', type: 'string' },
          { name: 'signature', type: 'string' },
          { name: 'borderGradient', type: 'string' },
          { name: 'cardTheme', type: 'string' },
          { name: 'mintedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getRecentCards',
    stateMutability: 'view',
    inputs: [{ name: 'limit', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'xUsername', type: 'string' },
          { name: 'profileImageUrl', type: 'string' },
          { name: 'signature', type: 'string' },
          { name: 'borderGradient', type: 'string' },
          { name: 'cardTheme', type: 'string' },
          { name: 'mintedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getCardsRange',
    stateMutability: 'view',
    inputs: [
      { name: 'startId', type: 'uint256' },
      { name: 'endId', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'xUsername', type: 'string' },
          { name: 'profileImageUrl', type: 'string' },
          { name: 'signature', type: 'string' },
          { name: 'borderGradient', type: 'string' },
          { name: 'cardTheme', type: 'string' },
          { name: 'mintedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'ownerCardCount',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalCards',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'CardMinted',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'xUsername', type: 'string', indexed: false },
      { name: 'borderGradient', type: 'string', indexed: false },
      { name: 'cardTheme', type: 'string', indexed: false },
      { name: 'mintedAt', type: 'uint256', indexed: false },
    ],
  },
] as const
