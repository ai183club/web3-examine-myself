# 每日自省签到

Hardhat 3 + Solidity + Vite React + RainbowKit/Wagmi/Viem 的 Sepolia 每日签到应用。

每个钱包地址独立记录每日完成状态，签到日期统一按 UTC+8 计算。当天只能签到一次，合约不设 owner，任何钱包都可以操作自己的记录。

## 环境

- Node.js 22.13+
- pnpm 11+
- MetaMask、Rainbow Wallet 或其他 EIP-1193 钱包
- Sepolia 测试 ETH

## 本地开发

```bash
pnpm install
pnpm compile
pnpm test
pnpm deploy:simulated
```

如果要在浏览器里连接本地链，需要先启动持久化本地节点，并把节点启动时打印的第一个测试私钥填入 `LOCAL_PRIVATE_KEY`：

```bash
# terminal 1
pnpm hardhat node

# terminal 2
pnpm deploy:local
pnpm sync:frontend
pnpm frontend:dev
```

前端默认运行在 `http://localhost:5173`。`deploy:simulated` 只用于快速验证部署模块；`deploy:local` 会把 `DailyCheckIn` 部署到持久化的本地节点，随后 `sync:frontend` 会把 ABI 和地址同步到前端。

## Sepolia 部署

先复制环境变量模板：

```bash
cp .env.example .env
```

在实际使用时，不要把私钥写入 Git 或前端环境变量。可以使用 Hardhat keystore：

```bash
pnpm hardhat keystore set SEPOLIA_RPC_URL
pnpm hardhat keystore set SEPOLIA_PRIVATE_KEY
```

然后部署：

```bash
pnpm deploy:sepolia
pnpm sync:frontend
pnpm frontend:dev
```

也可以通过 `DAILY_CHECK_IN_ADDRESS=0x... pnpm sync:frontend` 显式同步 Sepolia 地址。

前端需要配置：

```text
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_SEPOLIA_RPC_URL=...
VITE_DAILY_CHECK_IN_ADDRESS=0x...
```

`SEPOLIA_RPC_URL` 和 `SEPOLIA_PRIVATE_KEY` 只供 Hardhat 使用；不要把私钥写入前端变量、提交到 Git 或公开给他人。

## 合约接口

`DailyCheckIn` 提供以下接口：

- `completeToday()`：使用 `msg.sender` 记录当天完成状态。
- `currentDayId()`：返回 UTC+8 当前日期编号。
- `getStatus(account, dayId)`：查询钱包某一天的状态。
- `getMonthStatuses(account, startDayId, dayCount)`：批量查询一个月的状态。

合约代码位于 [`contracts/DailyCheckIn.sol`](contracts/DailyCheckIn.sol)，前端日历使用原生 React 和 `Date` API 实现，不依赖日历插件。

## 常用命令

```bash
pnpm check          # 编译、测试、同步 ABI、构建前端
pnpm frontend:build # 仅构建前端
pnpm frontend:dev   # 启动前端开发服务器
```
