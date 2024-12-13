import { PostHog } from "posthog-node";
import { env } from "~/env";

if (!env.POSTHOG_API_KEY) {
  throw new Error("POSTHOG_API_KEY is not set");
} else {
  console.log("✅ PostHog API key is set");
}

export const featureFlagsClient = new PostHog(env.POSTHOG_API_KEY);

export const featureFlagsKeys = {
  automatedDashboardUpdates: "automated-dashboard-updates",
};
