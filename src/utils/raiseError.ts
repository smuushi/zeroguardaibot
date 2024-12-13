import { Telegram } from "telegraf";
import { env } from "~/env";
import { captureException } from "./sentry";

function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return String(error);
}

export async function raiseError(
  bot: Telegram,
  error: unknown,
  context?: string
) {
  const errorMessage = errorToString(error);
  const fullMessage = context
    ? `Context: ${context}\nError: ${errorMessage}`
    : `Error: ${errorMessage}`;

  try {
    const ADMIN_USER_ID = env.ADMIN_USER_ID;
    await bot.sendMessage(ADMIN_USER_ID, fullMessage);

    if (error instanceof Error) {
      captureException(error, context ? { context } : undefined);
    }
  } catch (notificationError) {
    console.error("Failed to send error notification:", notificationError);
  }
}
