// cron/xpReset.js
const cron = require("node-cron")
const { resetWeeklyXp, resetMonthlyXp } = require("../controllers/xpController")

const initXpResetCrons = () => {
  // Every Monday at 00:00 — reset weeklyXp for all users
  cron.schedule("0 0 * * 1", async () => {
    console.log("Running weekly XP reset...")
    try {
      await resetWeeklyXp()
      console.log("Weekly XP reset completed successfully.")
    } catch (error) {
      console.error("Weekly XP reset failed:", error)
    }
  })

  // 1st of every month at 00:00 — reset monthlyXp for all users
  cron.schedule("0 0 1 * *", async () => {
    console.log("Running monthly XP reset...")
    try {
      await resetMonthlyXp()
      console.log("Monthly XP reset completed successfully.")
    } catch (error) {
      console.error("Monthly XP reset failed:", error)
    }
  })

  console.log("XP reset cron jobs initialized.")
}

module.exports = { initXpResetCrons }