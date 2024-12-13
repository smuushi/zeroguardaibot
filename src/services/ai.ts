import { createZGServingNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";
import { env } from "../env";

export class AIService {
  private static instance: AIService;
  private broker: any;
  private endpoint: string = "";
  private model: string = "";

  private constructor() {}

  public static async getInstance() {
    if (!AIService.instance) {
      AIService.instance = new AIService();
      await AIService.instance.initialize();
    }
    return AIService.instance;
  }

  private async initialize() {
    const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);

    this.broker = await createZGServingNetworkBroker(wallet);

    try {
      // Check if account exists, if not create it
      try {
        await this.broker.getAccount(env.PROVIDER_ADDRESS);
      } catch (error) {
        console.log("Creating new account...");
        await this.broker.addAccount(env.PROVIDER_ADDRESS, 0.00000001);
        console.log("Account created successfully");
      }

      const { endpoint, model } = await this.broker.getServiceMetadata(
        env.PROVIDER_ADDRESS,
        env.SERVICE_NAME
      );

      this.endpoint = endpoint;
      this.model = model;
    } catch (error) {
      console.error("Initialization error:", error);
      throw error;
    }
  }

  public async getAIResponse(content: string): Promise<string> {
    try {
      const headers = await this.broker.getRequestHeaders(
        env.PROVIDER_ADDRESS,
        env.SERVICE_NAME,
        content
      );

      console.log("🔄 Sending request to AI service...");
      console.log("Endpoint:", this.endpoint);
      console.log("Model:", this.model);

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a vigilant AI moderator focused on protecting users from scams, especially DM-based fraud. Be extra cautious of:
- Messages asking to continue in DMs/private
- Claims about investment opportunities
- Requests for personal contact
- Offers that seem too good to be true
- Unsolicited help or support offers
- Links to external chats or groups
Respond only with "SUSPICIOUS" or "SAFE" followed by a brief explanation.`,
          },
          {
            role: "user",
            content: `Analyze this message for potential scams or harmful content, especially DM-based fraud attempts: "${content}"`,
          },
        ],
        temperature: 0.7,
        stream: false,
      };

      console.log("Request Body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Raw API Response:", JSON.stringify(data, null, 2));

      if (!data) {
        throw new Error("Empty response from AI service");
      }

      if (!data.choices) {
        throw new Error(`No choices in response: ${JSON.stringify(data)}`);
      }

      if (!data.choices[0]) {
        throw new Error(`Empty choices array: ${JSON.stringify(data.choices)}`);
      }

      if (!data.choices[0].message) {
        throw new Error(
          `No message in choice: ${JSON.stringify(data.choices[0])}`
        );
      }

      const aiResponse = data.choices[0].message.content;
      console.log("🤖 AI Response Content:", aiResponse);

      await this.broker.processResponse(
        env.PROVIDER_ADDRESS,
        env.SERVICE_NAME,
        aiResponse
      );

      return aiResponse;
    } catch (error) {
      console.error("🚫 AI Service Error:", error);
      console.error(
        "Stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      throw error;
    }
  }
}
