import { ethers } from "ethers";
import { createZGServingNetworkBroker } from "@0glabs/0g-serving-broker";
import { env } from "../env";
import * as readline from "readline";

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function setup() {
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);

  // Check account state
  const address = wallet.address;
  const nonce = await provider.getTransactionCount(address);
  const balance = await provider.getBalance(address);

  console.log("\nAccount Status:");
  console.log(`Address: ${address}`);
  console.log(`Nonce: ${nonce}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (nonce > 0) {
    console.log(
      "\nWarning: This account has existing transactions. Consider using a fresh account."
    );
    const proceed = await promptUser("Continue anyway? (y/n): ");
    if (proceed.toLowerCase() !== "y") {
      console.log("Setup cancelled");
      return;
    }
  }

  const broker = await createZGServingNetworkBroker(wallet);

  try {
    // List services and get user choice
    console.log("\nAvailable Services:");
    console.log("------------------");
    const services = await broker.listService();
    services.forEach((service: any, index: number) => {
      console.log(`\n${index + 1}. Service Details:`);
      console.log(`   Name: ${service.name}`);
      console.log(`   Provider Address: ${service.provider}`);
      console.log(`   Model: ${service.model}`);
      console.log(`   Type: ${service.serviceType}`);
    });

    const serviceIndex =
      parseInt(
        await promptUser("\nEnter the number of the service you want to use: ")
      ) - 1;
    const selectedService = services[serviceIndex];

    // Create account with initial balance (like the example)
    const initialBalance = 0.00000001;
    console.log("\nCreating a new account...");
    await broker.addAccount(selectedService.provider, initialBalance);
    console.log("Account created successfully");

    console.log("\nUse these values in your .env file:");
    console.log("------------------------------------");
    console.log(`PRIVATE_KEY=${env.PRIVATE_KEY}`);
    console.log(`PROVIDER_ADDRESS=${selectedService.provider}`);
    console.log(`SERVICE_NAME=${selectedService.name}`);
  } catch (error) {
    console.error("Setup error:", error);
  }
}

setup();
