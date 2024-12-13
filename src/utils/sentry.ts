import * as Sentry from "@sentry/node";
import { env } from "../env";

export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.log("Sentry is not enabled");
    return;
  }
  console.log("Initializing Sentry");

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    enabled: env.NODE_ENV === "PRODUCTION",
    tracesSampleRate: 1.0,
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (!env.SENTRY_DSN) {
    console.error(error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}
