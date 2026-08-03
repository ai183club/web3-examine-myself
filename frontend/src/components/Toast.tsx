export type ToastKind = "success" | "error";

type ToastProps = {
  kind: ToastKind;
  message: string;
  transactionHash?: string;
  onDismiss: () => void;
};

export function Toast({ kind, message, transactionHash, onDismiss }: ToastProps) {
  return (
    <div className={`toast ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span className="toast-icon" aria-hidden="true">
        {kind === "success" ? "✓" : "!"}
      </span>
      <div className="toast-content">
        <p>{message}</p>
        {transactionHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            rel="noreferrer"
            target="_blank"
          >
            查看交易
          </a>
        )}
      </div>
      <button className="toast-dismiss" aria-label="关闭提示" onClick={onDismiss} type="button">
        ×
      </button>
    </div>
  );
}
