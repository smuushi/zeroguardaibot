import { ChainPatrolClient, AssetStatus, AssetType } from "@chainpatrol/sdk";
import { env } from "~/env";

export type { AssetStatus, AssetType };

export const chainpatrol = new ChainPatrolClient({
  apiKey: env.CHAINPATROL_API_KEY,
  baseUrl: `${env.CHAINPATROL_API_URL}/api/`,
});

export type Organization = {
  slug: string;
  name: string;
  telegramGroupId: string;
  threatsDetected: number;
  threatsBlocked: number;
  takedowns: number;
};

export type TelegramGroup = {
  isPublic: boolean;
  autoLinkMonitoring: boolean;
  autoDashboardUpdate: boolean;
  allUsersReporting: boolean;
  warningMessagesEnabled: boolean;
};

export type UrlStatus = {
  url: string;
  status: AssetStatus;
  reason?: string;
};

export type ReportResponse = {
  assetContent: string;
  status: "TODO" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

export type TakedownResponse = {
  assetContent: string;
  takedownStatus: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMetrics = {
  reports: number;
  threats: number;
  takedownsFiled: number;
  takedownsCompleted: number;
  urlsBlocked: number;
};

export type UserInfo = {
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  organizations: Array<{
    id: number;
    name: string;
    slug: string;
    avatarUrl: string | null;
    role: string;
  }>;
};

export type CreateTelegramGroupOutput = {
  id: number;
  name: string;
  groupId: string;
  organizationId: number;
  isPublic: boolean;
  autoLinkMonitoring: boolean;
  autoDashboardEnabled: boolean;
  allUsersReporting: boolean;
};

export async function fetchOrganizationByTelegramGroupId(
  telegramGroupId: string
) {
  const response = await chainpatrol.fetch<{
    organization: Organization;
    telegramGroup: TelegramGroup;
  }>({
    method: "POST",
    path: ["v2", "internal", "getTelegramOrganization"],
    body: {
      telegramGroupId: telegramGroupId,
    },
  });
  return response;
}

export async function checkUrlsStatus(urls: string[]) {
  const results: UrlStatus[] = [];

  for (const url of urls) {
    const chainpatrolAssetCheck = await chainpatrol.asset.check({
      content: url,
    });

    results.push({
      url,
      status: chainpatrolAssetCheck.status,
      reason: chainpatrolAssetCheck.reason,
    });
  }

  return results;
}

export async function fetchOrganizationMetrics(telegramGroupId: string) {
  const { metrics } = await chainpatrol.fetch<{
    metrics: OrganizationMetrics;
  }>({
    method: "POST",
    path: ["v2", "internal", "getOrganizationMetrics"],
    body: {
      telegramGroupId: telegramGroupId,
    },
  });
  return metrics;
}

export async function fetchChatsWithRegularUpdates(): Promise<
  { telegramGroupId: string }[]
> {
  try {
    const response = await chainpatrol.fetch<{
      groups: {
        id: number;
        name: string;
        groupId: string;
        organizationId: number;
        organizationName: string;
      }[];
    }>({
      method: "POST",
      path: ["v2", "internal", "getAutoDashboardTelegramGroups"],
      body: {},
    });
    console.log("response", response);
    return response.groups.map((group) => ({ telegramGroupId: group.groupId }));
  } catch (error) {
    console.error("Error fetching chats with regular updates:", error);
    return [];
  }
}

export async function getTakedownStatus(url: string) {
  try {
    const response = await chainpatrol.fetch<TakedownResponse>({
      method: "POST",
      path: ["v2", "internal", "getTakedown"],
      body: { assetContent: url },
    });
    return response;
  } catch (error) {
    console.error("Error fetching takedown status:", error);
    return null;
  }
}

export async function getReportsStatus(
  organizationSlug: string,
  urls: string[]
) {
  try {
    const response = await chainpatrol.fetch<{
      reports: ReportResponse[];
    }>({
      method: "POST",
      path: ["v2", "internal", "reports", "search"],
      body: {
        organizationSlug,
        assetContents: urls,
      },
    });

    return response.reports;
  } catch (error) {
    console.error("Error fetching report status:", error);
    return [];
  }
}

export async function fetchUserInfoByTelegramId(
  telegramId: string
): Promise<UserInfo | null> {
  try {
    const response = await chainpatrol.fetch<UserInfo>({
      method: "POST",
      path: ["v2", "internal", "telegram", "user"],
      body: { telegramId },
    });
    return response;
  } catch (error) {
    console.error("Error fetching user info by telegram ID:", error);
    return null;
  }
}

export const connectGroupToOrganization = async (
  options: {
    organizationId?: number;
    groupId?: string;
    name?: string;
    isPublic?: boolean;
    autoLinkMonitoring?: boolean;
    autoDashboardEnabled?: boolean;
    allUsersReporting?: boolean;
  } = {}
) => {
  const response = await chainpatrol.fetch<CreateTelegramGroupOutput>({
    method: "POST",
    path: ["v2", "internal", "telegram", "group"],
    body: {
      ...options,
      allUsersReporting: options.allUsersReporting ?? true,
    },
  });

  return response;
};
