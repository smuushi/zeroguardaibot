import { Telegram } from "telegraf";
import { captureException } from "./sentry";
import { raiseError } from "./raiseError";

async function checkBotHealth(telegram: Telegram) {
  try {
    const botInfo = await telegram.getMe();
    if (!botInfo?.id) {
      throw new Error("Bot health check failed - could not get bot info");
    }
    console.log("Bot health check passed");
  } catch (error) {
    captureException(error as Error, {
      context: "health_check",
      timestamp: new Date().toISOString(),
    });
  }
}

export function scheduleHealthChecks(telegram: Telegram) {
  setInterval(() => checkBotHealth(telegram), 5 * 60 * 1000);
  checkBotHealth(telegram);
}
