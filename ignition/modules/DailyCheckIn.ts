import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DailyCheckInModule", (m) => {
  const dailyCheckIn = m.contract("DailyCheckIn");

  return { dailyCheckIn };
});
