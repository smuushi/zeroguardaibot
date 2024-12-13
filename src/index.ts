import { Telegraf, Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { env } from "./env";
import { AIService } from "./services/ai";

const bot = new Telegraf(env.BOT_TOKEN);

// Error handling
bot.catch((err: unknown, ctx: Context) => {
  console.error("Bot error occurred:", err);
});

async function handleDirectMessage(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  if (!("text" in message)) return;

  console.log("📱 Private message received:", message.text);
  try {
    const aiService = await AIService.getInstance();
    const response = await aiService.getAIResponse(message.text);
    console.log("🤖 AI Response (private):", response);
    await ctx.reply(response);
  } catch (error) {
    console.error("❌ AI Service error (private):", error);
    await ctx.reply("Sorry, I encountered an error processing your message.");
  }
}

async function handleGroupMessage(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  if (!("text" in message)) return;

  console.log("\n👥 Group message received:", message.text);

  try {
    const aiService = await AIService.getInstance();
    // Enhanced moderation prompt
    const analysis = await aiService.getAIResponse(
      `Analyze this message for any suspicious or harmful content such as scams, phishing, hate speech, or inappropriate content. Only respond with "SUSPICIOUS" or "SAFE" followed by a brief, professional explanation. Message: "${message.text}"`
    );

    const decision = analysis.toUpperCase().startsWith("SUSPICIOUS")
      ? "SUSPICIOUS"
      : "SAFE";
    const reason = analysis.split(decision)[1]?.trim() || "No reason provided";

    console.log("\n🔍 Moderation Analysis:");
    console.log("------------------------");
    console.log("Message:", message.text);
    console.log("Raw Analysis:", analysis);
    console.log("Decision:", decision);
    console.log("Reason:", reason);
    console.log("------------------------");

    if (decision === "SUSPICIOUS") {
      await ctx.reply(
        `🛡 *Scam Alert*\n\nThis message has been flagged as potentially harmful.\nWarning: ${reason}\n\n⚠️ Be especially careful of:\n- Requests to continue in DMs\n- Investment offers\n- Unsolicited help/support`,
        {
          reply_parameters: { message_id: message.message_id },
          parse_mode: "Markdown",
        }
      );
      console.log("⚠️ Warning message sent to chat");
    }
  } catch (error) {
    console.error("❌ Moderation error:", error);
  }
}

// Handle all messages
bot.on("message", async (ctx) => {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) return;

  console.log("💬 Message received in:", ctx.chat.type, "chat");

  if (ctx.chat.type === "private") {
    await handleDirectMessage(ctx);
  } else {
    await handleGroupMessage(ctx);
  }
});

// Launch the bot
bot.launch().then(() => {
  console.log("Bot started successfully!");
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
