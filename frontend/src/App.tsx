import { ConnectButton } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { DailyCheckInPanel } from "./components/DailyCheckInPanel";
import { hardhatLocal } from "./config/wagmi";

function NetworkNotice() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === sepolia.id || chainId === hardhatLocal.id) {
    return null;
  }

  return (
    <div className="network-notice">
      <span>当前连接的是 Chain ID {chainId}，请切换到 Sepolia 才能签到。</span>
      <button disabled={isPending} onClick={() => switchChain({ chainId: sepolia.id })}>
        {isPending ? "切换中…" : "切换到 Sepolia"}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">日</span>
          <span>每日自省</span>
        </a>
        <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
      </header>

      <NetworkNotice />

      <section className="hero">
        <p className="eyebrow">DAILY REFLECTION · SEPOLIA</p>
        <h1>
          吾日三省吾身 <span>｜</span>
          <br />
          <em>今天你提升了吗？</em>
        </h1>
        <p className="hero-copy">
          给今天留下一点温柔的记录。完成一次自省，明天再和自己见面。
        </p>
      </section>

      <DailyCheckInPanel />

      <footer className="footer">
        <span>每一次记录，都是在靠近更好的自己</span>
        <span>Sepolia · UTC+8</span>
      </footer>
    </main>
  );
}
