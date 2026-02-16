/**
 * Add transfer_tx_hash and transfer_status columns to bribe_offers table.
 * Run with: npx tsx scripts/add-bribe-tx-columns.ts
 */
import { createClient } from "@insforge/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  baseUrl:
    process.env.INSFORGE_BASE_URL || "https://3wcyg4ax.us-east.insforge.app",
  anonKey: process.env.INSFORGE_ANON_KEY || "",
});

async function main() {
  console.log(
    "Adding transfer_tx_hash and transfer_status columns to bribe_offers...",
  );

  // Try to add columns — if they already exist, the query will fail gracefully
  const sql = `
    ALTER TABLE public.bribe_offers
      ADD COLUMN IF NOT EXISTS transfer_tx_hash text NULL,
      ADD COLUMN IF NOT EXISTS transfer_status text NULL;
  `;

  const { data, error } = await (client.database as any).rpc("exec_sql", {
    query: sql,
  });
  if (error) {
    // If rpc doesn't exist, try direct approach — just insert a dummy row and check
    console.warn("RPC exec_sql not available, trying alternative approach...");

    // Test if columns exist by doing a select
    const { data: testData, error: testError } = await client.database
      .from("bribe_offers")
      .select("transfer_tx_hash, transfer_status")
      .limit(1);

    if (testError) {
      console.log(
        "Columns don't exist yet. Please run this SQL manually in your InsForge dashboard:",
      );
      console.log("");
      console.log("  ALTER TABLE public.bribe_offers");
      console.log("    ADD COLUMN IF NOT EXISTS transfer_tx_hash text NULL,");
      console.log("    ADD COLUMN IF NOT EXISTS transfer_status text NULL;");
      console.log("");
      console.log(
        "Or the columns will be created automatically when the first bribe accept happens (with NULL values).",
      );
    } else {
      console.log("✅ Columns already exist! Found:", testData);
    }
  } else {
    console.log("✅ Columns added successfully!");
  }
}

main().catch(console.error);
