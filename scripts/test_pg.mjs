import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { Socket } from "net";

const devVarsPath = path.join(process.cwd(), ".dev.vars");
const devVars = fs.readFileSync(devVarsPath, "utf-8");
const getVar = (name) => {
  const line = devVars.split("\n").find((l) => l.trim().startsWith(name + "="));
  return line ? line.split("=").slice(1).join("").trim() : "";
};

const serviceRoleKey = getVar("SUPABASE_SERVICE_ROLE_KEY");
const ref = "xnjugeewwjclgsaynthi";

// Try with raw TCP to see what the server sends

async function rawTest(host, port) {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(5000);
    socket.connect(port, host, () => {
      console.log(`TCP connected to ${host}:${port}`);
      
      // Send SSL request (8 bytes: length=8, SSL request code=80877103)
      const sslRequest = Buffer.alloc(8);
      sslRequest.writeUInt32LE(80877103, 0);
      socket.write(sslRequest);
    });
    
    socket.on("data", (data) => {
      const response = data.toString();
      console.log(`  Server response: ${response.slice(0, 50)}`);
      if (response === "N") {
        console.log("  -> Server says SSL not supported, trying without SSL");
      } else if (response === "S") {
        console.log("  -> Server says SSL supported, SSL required");
      } else if (data.length > 1) {
        console.log(`  -> Raw bytes: ${data.slice(0, 20).toString("hex")}`);
      }
      socket.destroy();
      resolve(true);
    });
    
    socket.on("error", (e) => {
      console.log(`  Error: ${e.message}`);
      resolve(false);
    });
    
    socket.on("timeout", () => {
      console.log(`  Timeout`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on("close", () => {
      // connection closed
    });
    
    setTimeout(() => {
      if (!socket.destroyed) {
        socket.destroy();
        resolve(false);
      }
    }, 6000);
  });
}

async function main() {
  console.log("=== Raw TCP test with direct DB ===");
  await rawTest(`${ref}.supabase.co`, 5432);
  
  console.log("\n=== Raw TCP test with pooler us-east-1 ===");
  await rawTest("aws-0-us-east-1.pooler.supabase.com", 6543);

  // Try pg with sslmode in connection string
  console.log("\n=== pg with connection string sslmode=require ===");
  try {
    const cs = `postgresql://postgres:${encodeURIComponent(serviceRoleKey)}@${ref}.supabase.co:5432/postgres?sslmode=require`;
    console.log(`  Connecting to ${ref}.supabase.co:5432...`);
    const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("  SUCCESS!");
    const res = await client.query("SELECT version()");
    console.log("  Version:", res.rows[0].version.slice(0, 80));
    await client.end();
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 200)}`);
  }

  // Try pg with sslmode=require via pooler
  console.log("\n=== pg with pooler sslmode=require ===");
  try {
    const cs = `postgresql://postgres.${ref}:${encodeURIComponent(serviceRoleKey)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`;
    console.log("  Connecting to pooler us-east-1...");
    const client = new pg.Client({ connectionString: cs });
    await client.connect();
    console.log("  SUCCESS!");
    const res = await client.query("SELECT version()");
    console.log("  Version:", res.rows[0].version.slice(0, 80));
    await client.end();
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 200)}`);
  }

  // Try without sslmode
  console.log("\n=== pg with pooler no sslmode ===");
  try {
    const cs = `postgresql://postgres.${ref}:${encodeURIComponent(serviceRoleKey)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    console.log("  Connecting to pooler us-east-1...");
    const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("  SUCCESS!");
    const res = await client.query("SELECT version()");
    console.log("  Version:", res.rows[0].version.slice(0, 80));
    await client.end();
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 200)}`);
  }
}

main().catch(console.error);
