import { useCallback, useEffect, useRef, useState } from "react";
import { sepolia } from "wagmi/chains";
import { useAccount } from "wagmi";

import { hardhatLocal } from "../config/wagmi";
import { formatDate } from "../lib/date";
import { useDailyCheckIn } from "../hooks/useDailyCheckIn";
import { Calendar } from "./Calendar";
import { Toast, type ToastKind } from "./Toast";

type ToastState = {
  kind: ToastKind;
  message: string;
  transactionHash?: string;
};

function getErrorText(error: unknown, depth = 0): string {
  if (error === undefined || error === null || depth > 2) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return `${error.name} ${error.message} ${getErrorText(error.cause, depth + 1)}`;
  }

  if (typeof error === "object") {
    const value = error as Record<string, unknown>;
    return [value.name, value.shortMessage, value.message, getErrorText(value.cause, depth + 1)]
      .filter(Boolean)
      .join(" ");
  }

  return String(error);
}

function isUserRejectedError(error: unknown): boolean {
  const text = getErrorText(error).toLowerCase();
  return text.includes("4001") || /user\s+(rejected|denied|cancelled|canceled)/.test(text);
}

function getFriendlyErrorMessage(error: unknown): string | undefined {
  if (!error || isUserRejectedError(error)) {
    return undefined;
  }

  const text = getErrorText(error).toLowerCase();

  if (text.includes("alreadycompleted") || text.includes("already completed")) {
    return "今天已经签到过了。";
  }

  if (text.includes("insufficient funds")) {
    return "钱包余额不足，无法支付 Gas。";
  }

  if (text.includes("chain") || text.includes("network")) {
    return "网络不匹配，请切换到 Sepolia。";
  }

  return "签到失败，请稍后重试。";
}

export function DailyCheckInPanel() {
  const { address, isConnected } = useAccount();
  const [toast, setToast] = useState<ToastState>();
  const toastTimer = useRef<number | undefined>(undefined);
  const checkIn = useDailyCheckIn();
  const isSupportedChain = checkIn.chainId === sepolia.id || checkIn.chainId === hardhatLocal.id;
  const isBusy = checkIn.isWriting || checkIn.isConfirming;
  const actionLabel = checkIn.todayCompleted
    ? "今日已完成"
    : checkIn.isWriting
      ? "等待确认…"
      : checkIn.isConfirming
        ? "记录中…"
        : address
          ? "记录今天"
          : "连接钱包后签到";

  const showToast = useCallback((nextToast: ToastState) => {
    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
    }

    setToast(nextToast);
    toastTimer.current = window.setTimeout(() => {
      setToast(undefined);
      toastTimer.current = undefined;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== undefined) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (checkIn.isConfirmed && checkIn.transactionHash) {
      showToast({
        kind: "success",
        message: "签到成功，今天的记录已写入链上。",
        transactionHash: checkIn.transactionHash,
      });
    }
  }, [checkIn.isConfirmed, checkIn.transactionHash, showToast]);

  useEffect(() => {
    const message = getFriendlyErrorMessage(checkIn.error);
    if (message) {
      showToast({ kind: "error", message });
    }
  }, [checkIn.error, showToast]);

  async function handleCompleteToday() {
    try {
      await checkIn.completeToday();
    } catch {
      // Errors are shown by the toast effect. User rejection is intentionally silent.
    }
  }

  if (!isConnected) {
    return (
      <section className="card empty-state">
        <span className="empty-icon">✦</span>
        <p className="eyebrow">开始你的每日记录</p>
        <h2>连接钱包，和自己约定一天</h2>
        <p>每个钱包地址拥有独立的每日记录，今天完成后，明天再继续。</p>
      </section>
    );
  }

  if (isConnected && !isSupportedChain) {
    return (
      <section className="card empty-state">
        <span className="empty-icon">⌁</span>
        <p className="eyebrow">切换网络</p>
        <h2>请连接到 Sepolia</h2>
        <p>签到合约部署在 Sepolia 测试网，请先在钱包中切换网络。</p>
      </section>
    );
  }

  if (checkIn.contractAddress === undefined) {
    return (
      <section className="card empty-state">
        <span className="empty-icon">○</span>
        <p className="eyebrow">合约地址</p>
        <h2>签到合约尚未配置</h2>
        <p>请完成 Sepolia 部署并同步 DailyCheckIn 合约地址。</p>
      </section>
    );
  }

  return (
    <div className="check-in-layout">
      <section className={`today-card ${checkIn.todayCompleted ? "is-complete" : ""}`}>
        <div className="today-copy">
          <div className="today-badge">{checkIn.todayCompleted ? "✓" : "✦"}</div>
          <div>
            <p className="eyebrow">今天 · UTC+8</p>
            <h2>
              {checkIn.todayCompleted
                ? "今天已完成"
                : address
                  ? "准备好给自己一点肯定了吗？"
                  : "连接钱包，记录今天"}
            </h2>
            <p className="today-date">
              {formatDate(checkIn.calendar.today)}
              {!address && " · 连接钱包后可签到"}
            </p>
          </div>
        </div>
        <button
          className="primary-button"
          disabled={!address || checkIn.todayCompleted || isBusy}
          onClick={() => void handleCompleteToday()}
        >
          {actionLabel}
        </button>
      </section>

      <section className="card calendar-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">你的坚持</p>
            <h2>{checkIn.calendar.label}</h2>
          </div>
          <div className="legend" aria-label="状态图例">
            <span><i className="legend-dot complete" />已完成</span>
            <span><i className="legend-dot pending" />未完成</span>
          </div>
        </div>

        <Calendar
          calendar={checkIn.calendar}
          isCompleted={checkIn.isCompleted}
          isToday={checkIn.isToday}
          canInteract={address !== undefined}
          isBusy={isBusy}
          onCompleteToday={() => void handleCompleteToday()}
        />

        <p className="contract-address">
          DailyCheckIn ·{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${checkIn.contractAddress}`}
            rel="noreferrer"
            target="_blank"
          >
            {checkIn.contractAddress}
          </a>
        </p>
      </section>

      {toast && (
        <Toast
          kind={toast.kind}
          message={toast.message}
          onDismiss={() => setToast(undefined)}
          transactionHash={toast.transactionHash}
        />
      )}
    </div>
  );
}
