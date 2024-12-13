import { createClient } from "redis";
import { env } from "~/env";
import { raiseError } from "./raiseError";
import { Telegram } from "telegraf";

let redisClient: ReturnType<typeof createClient>;
let bot: Telegram;

export function initializeRedis(telegram: Telegram) {
  bot = telegram;

  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error("Redis max reconnection attempts reached");
          return new Error("Redis max reconnection attempts reached");
        }
        // Exponential backoff: 2^retries * 100ms
        return Math.min(2 ** retries * 100, 3000);
      },
    },
  });

  redisClient.on("error", async (error) => {
    console.error("Redis Client Error:", error);
    await raiseError(bot, error, "Redis connection error");
  });

  redisClient.on("reconnecting", () => {
    console.log("Redis client reconnecting...");
  });

  redisClient.on("connect", () => {
    console.log("Redis client connected successfully");
  });

  connect();
}

async function connect() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    if (bot) {
      await raiseError(bot, error, "Redis connection failed");
    }
  }
}

export async function getRedisValue(key: string): Promise<string | null> {
  try {
    if (!redisClient.isOpen) {
      await connect();
    }
    return await redisClient.get(key);
  } catch (error) {
    console.error(`Error getting Redis value for key ${key}:`, error);
    if (bot) {
      await raiseError(bot, error, `Redis get error for key: ${key}`);
    }
    return null;
  }
}

export async function setRedisValue(
  key: string,
  value: string,
  expirationSeconds?: number
): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await connect();
    }
    if (expirationSeconds) {
      await redisClient.set(key, value, { EX: expirationSeconds });
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    console.error(`Error setting Redis value for key ${key}:`, error);
    if (bot) {
      await raiseError(bot, error, `Redis set error for key: ${key}`);
    }
  }
}

export async function closeRedis(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error("Error closing Redis connection:", error);
    if (bot) {
      await raiseError(bot, error, "Redis close error");
    }
  }
}

export enum AppRedisKeys {
  LastDashboardUpdateRun = "last_dashboard_update_run",
}

export async function getUserWarningStatus(userId: string): Promise<boolean> {
  const status = await getRedisValue(getUserWarningKey(userId, "status"));
  return status !== "false";
}

export async function setUserWarningStatus(
  userId: string,
  status: boolean
): Promise<void> {
  await setRedisValue(getUserWarningKey(userId, "status"), status.toString());
}

export async function hasReceivedWarning(userId: string): Promise<boolean> {
  const received = await getRedisValue(getUserWarningKey(userId, "received"));
  return received === "true";
}

export async function setReceivedWarning(userId: string): Promise<void> {
  await setRedisValue(getUserWarningKey(userId, "received"), "true");
}

export function getUserWarningKey(
  userId: string,
  type: "received" | "status"
): string {
  return `telegram:user:${userId}:${
    type === "received" ? "received_warning" : "warning_status"
  }`;
}
