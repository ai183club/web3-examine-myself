import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address, Hash } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { dailyCheckInAbi } from "../contracts/dailyCheckInAbi";
import { getDailyCheckInAddress } from "../contracts/addresses";
import { createMonthCalendar } from "../lib/date";

export function useDailyCheckIn() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [now, setNow] = useState(() => new Date());
  const [transactionHash, setTransactionHash] = useState<Hash>();
  const [writeError, setWriteError] = useState<Error>();
  const contractAddress = getDailyCheckInAddress(chainId);
  const calendar = useMemo(() => createMonthCalendar(now), [now]);
  const isConfigured = isConnected && address !== undefined && contractAddress !== undefined;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const currentDayQuery = useReadContract({
    address: contractAddress,
    abi: dailyCheckInAbi,
    functionName: "currentDayId",
    query: {
      enabled: contractAddress !== undefined,
    },
  });

  const monthStatusesQuery = useReadContract({
    address: contractAddress,
    abi: dailyCheckInAbi,
    functionName: "getMonthStatuses",
    args: address
      ? [address, calendar.firstDayId, BigInt(calendar.daysInMonth)]
      : undefined,
    query: {
      enabled: isConfigured,
    },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const receiptQuery = useWaitForTransactionReceipt({ hash: transactionHash });

  const monthStatuses = useMemo(
    () => (monthStatusesQuery.data ? Array.from(monthStatusesQuery.data) : []),
    [monthStatusesQuery.data],
  );
  const currentDayId = currentDayQuery.data ?? calendar.today.dayId;
  const todayCompleted = monthStatuses[Number(calendar.today.dayId - calendar.firstDayId)] ?? false;

  useEffect(() => {
    if (receiptQuery.isSuccess) {
      void monthStatusesQuery.refetch();
      void currentDayQuery.refetch();
    }
  }, [currentDayQuery.refetch, monthStatusesQuery.refetch, receiptQuery.isSuccess]);

  const isToday = useCallback(
    (dayId: bigint) => dayId === calendar.today.dayId,
    [calendar.today.dayId],
  );

  const isCompleted = useCallback(
    (dayId: bigint) => {
      const index = Number(dayId - calendar.firstDayId);
      return monthStatuses[index] ?? false;
    },
    [calendar.firstDayId, monthStatuses],
  );

  const completeToday = useCallback(async () => {
    if (contractAddress === undefined) {
      throw new Error("当前网络尚未配置签到合约地址。");
    }

    if (address === undefined) {
      throw new Error("请先连接钱包，再记录今天的状态。");
    }

    setWriteError(undefined);
    setTransactionHash(undefined);

    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: dailyCheckInAbi,
        functionName: "completeToday",
      });
      setTransactionHash(hash);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      setWriteError(normalizedError);
      throw normalizedError;
    }
  }, [address, contractAddress, writeContractAsync]);

  return {
    address: address as Address | undefined,
    chainId,
    contractAddress,
    calendar,
    currentDayId,
    monthStatuses,
    todayCompleted,
    isToday,
    isCompleted,
    completeToday,
    readError: monthStatusesQuery.error ?? currentDayQuery.error,
    isReading: monthStatusesQuery.isLoading || currentDayQuery.isLoading,
    isWriting,
    isConfirming: receiptQuery.isLoading,
    isConfirmed: receiptQuery.isSuccess,
    transactionHash,
    error: writeError ?? receiptQuery.error,
  };
}
