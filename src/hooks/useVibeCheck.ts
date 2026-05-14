import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, USDC_ADDRESS, VIBECHECK_ABI, ERC20_ABI } from '@/config/contract'
import { useCallback } from 'react'

export function useVibeCheck() {
  const { address, isConnected } = useAccount()

  // Read current day
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'currentDay',
    query: { enabled: isConnected },
  })

  // Read stake amount
  const { data: stakeAmount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'stakeAmount',
    query: { enabled: isConnected },
  })

  // Read user data
  const { data: userData, refetch: refetchUser } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'getMyUser',
    query: { enabled: isConnected },
  })

  // Read contract balance
  const { data: contractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'getContractBalance',
    query: { enabled: isConnected },
  })

  // Read predictor count for current day
  const { data: predictorCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'getPredictorCount',
    args: currentDay ? [currentDay] : undefined,
    query: { enabled: isConnected && !!currentDay },
  })

  // Read USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && CONTRACT_ADDRESS ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: isConnected && !!address },
  })

  // Read day predictors (for leaderboard)
  const { data: dayPredictors } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'getDayPredictors',
    args: currentDay ? [currentDay] : undefined,
    query: { enabled: isConnected && !!currentDay },
  })

  // Write functions
  const { writeContract: approveWrite, isPending: isApproving } = useWriteContract()
  const { writeContract: predictWrite, isPending: isPredicting } = useWriteContract()
  const { writeContract: linkXWrite, isPending: isLinking } = useWriteContract()

  const needsApproval = useCallback(() => {
    if (!usdcAllowance || !stakeAmount) return true
    return (usdcAllowance as bigint) < (stakeAmount as bigint)
  }, [usdcAllowance, stakeAmount])

  const handleApprove = useCallback(async () => {
    if (!stakeAmount) return
    approveWrite({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, BigInt('1000000000000000000')],
    })
  }, [stakeAmount, approveWrite])

  const handlePredict = useCallback(async (choices: { crypto: number; weather: number; market: number; trending: number }) => {
    predictWrite({
      address: CONTRACT_ADDRESS,
      abi: VIBECHECK_ABI,
      functionName: 'predict',
      args: [
        choices.crypto as 0 | 1 | 2 | 3,
        choices.weather as 0 | 1 | 2 | 3,
        choices.market as 0 | 1 | 2 | 3,
        choices.trending as 0 | 1 | 2 | 3,
      ],
    })
  }, [predictWrite])

  const handleLinkXAccount = useCallback(async (
    username: string,
    followerCount: number,
    verified: boolean,
    signature: `0x${string}`
  ) => {
    linkXWrite({
      address: CONTRACT_ADDRESS,
      abi: VIBECHECK_ABI,
      functionName: 'linkXAccount',
      args: [username, BigInt(followerCount), verified, signature],
    })
  }, [linkXWrite])

  const hasPredictedToday = userData && currentDay ? (userData as any).lastDay === currentDay : false

  return {
    address,
    isConnected,
    currentDay: currentDay as bigint | undefined,
    stakeAmount: stakeAmount as bigint | undefined,
    userData: userData as any | undefined,
    contractBalance: contractBalance as bigint | undefined,
    predictorCount: predictorCount as bigint | undefined,
    dayPredictors: dayPredictors as `0x${string}`[] | undefined,
    usdcAllowance: usdcAllowance as bigint | undefined,
    hasPredictedToday,
    needsApproval,
    handleApprove,
    isApproving,
    handlePredict,
    isPredicting,
    handleLinkXAccount,
    isLinking,
    refetchUser,
    refetchAllowance,
  }
}
