import { Context } from "telegraf";
import { raiseError } from "./raiseError";

export async function isGroupAdmin(
  ctx: Context,
  userId: number | undefined
): Promise<boolean | null> {
  if (!userId) {
    return false;
  }

  try {
    const chatMember = await ctx.telegram.getChatMember(ctx.chat!.id, userId);
    return ["creator", "administrator"].includes(chatMember.status);
  } catch (error) {
    console.error("Error checking admin status:", error);
    raiseError(ctx.telegram, error, "isGroupAdmin");
    ctx.reply(
      "Failed to check telegram user status. Please make sure bot has admin rights to the group."
    );
    return null;
  }
}
