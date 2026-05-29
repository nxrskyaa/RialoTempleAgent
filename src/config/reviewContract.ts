import { parseEther, type Address } from 'viem'

export const REVIEW_CONTRACT_ADDRESS = (
  import.meta.env.VITE_RIALO_REVIEW_ADDRESS || '0x0e5b996F56df97917289b2552A843620f9E88A60'
) as Address

export const ACTION_FEE = parseEther('1')
export const REVIEW_PAGE_SIZE = 24n

export const REVIEW_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'origin', type: 'string' },
      { internalType: 'string', name: 'imageUrl', type: 'string' },
      { internalType: 'uint8', name: 'rating', type: 'uint8' },
      { internalType: 'string', name: 'reviewText', type: 'string' },
    ],
    name: 'submitFoodReview',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'imdbUrl', type: 'string' },
      { internalType: 'uint8', name: 'rating', type: 'uint8' },
      { internalType: 'string', name: 'reviewText', type: 'string' },
    ],
    name: 'submitFilmReview',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getReviews',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint8', name: 'category', type: 'uint8' },
          { internalType: 'address', name: 'reviewer', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'originOrImdb', type: 'string' },
          { internalType: 'string', name: 'imageUrl', type: 'string' },
          { internalType: 'uint8', name: 'rating', type: 'uint8' },
          { internalType: 'string', name: 'reviewText', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.Review[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint8', name: 'category', type: 'uint8' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getReviewsByCategory',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint8', name: 'category', type: 'uint8' },
          { internalType: 'address', name: 'reviewer', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'originOrImdb', type: 'string' },
          { internalType: 'string', name: 'imageUrl', type: 'string' },
          { internalType: 'uint8', name: 'rating', type: 'uint8' },
          { internalType: 'string', name: 'reviewText', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.Review[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
