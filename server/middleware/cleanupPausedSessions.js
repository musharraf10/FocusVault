import cron from "node-cron";
import UserStudyState from "../models/UserStudyState.js";

// Run daily at 1:00 AM
cron.schedule("0 1 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const result = await UserStudyState.deleteMany({
      status: "paused",

      updatedAt: { $lt: today },
    });
    console.log(`🧹 Deleted ${result.deletedCount} old paused sessions`);
  } catch (err) {
    console.error("Cron Cleanup Error:", err);
  }
});
