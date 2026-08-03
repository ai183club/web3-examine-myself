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

Sepolia 合约地址：

`0xbC6b2365187FF74AA84940d0a78f9065fB82E1a1`

可在 [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xbC6b2365187FF74AA84940d0a78f9065fB82E1a1) 查看。

## 合约接口

`DailyCheckIn` 提供以下接口：

- `completeToday()`：使用 `msg.sender` 记录当天完成状态。
- `currentDayId()`：返回 UTC+8 当前日期编号。
- `getStatus(account, dayId)`：查询钱包某一天的状态。
- `getMonthStatuses(account, startDayId, dayCount)`：批量查询一个月的状态。

合约代码位于 [`contracts/DailyCheckIn.sol`](contracts/DailyCheckIn.sol)，前端日历使用原生 React 和 `Date` API 实现，不依赖日历插件。

## Sites 部署

前端已适配 Sites 的 Cloudflare Workers 静态站点部署：

- `frontend/vite.config.ts` 将构建产物输出到根目录 `dist/`。
- `frontend/build/sites-vite-plugin.ts` 负责复制 Sites 元数据并生成 Worker 部署入口。
- `frontend/worker/index.js` 提供静态资源访问和 SPA 路由回退。
- `.openai/hosting.json` 保存 Sites 项目标识，不保存私钥或其他敏感信息。

本地构建并检查 Sites 归档：

```bash
pnpm frontend:build
/path/to/sites/scripts/package-site.sh . /tmp/daily-reflection-checkin-sites.tar.gz
```

当前生产站点为私有访问，仅站点所有者可访问：

[打开每日自省签到](https://daily-reflection-checkin.junean66.chatgpt.site)

Sites 部署使用的是前端构建时注入的 `VITE_*` 配置。`SEPOLIA_PRIVATE_KEY` 永远只用于 Hardhat 部署，不能放入 Sites 环境或浏览器代码。

## 常用命令

```bash
pnpm check          # 编译、测试、同步 ABI、构建前端
pnpm frontend:build # 仅构建前端
pnpm frontend:dev   # 启动前端开发服务器
pnpm frontend:preview # 预览根目录 dist/ 构建产物
```
