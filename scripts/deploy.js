import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  Account,
  RpcProvider,
  json,
  hash,
  CallData,
  shortString,
} from "starknet";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");


function loadEnv(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv(resolve(ROOT, "frontend", ".env.example"));

console.log("ROOT:", ROOT);
console.log("DEPLOYER_ADDRESS:", env.DEPLOYER_ADDRESS);

const RPC_URL = env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia";
const DEPLOYER_ADDRESS = env.DEPLOYER_ADDRESS;
const DEPLOYER_PRIVATE_KEY = env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_ADDRESS || !DEPLOYER_PRIVATE_KEY) {
  console.error("❌ Missing DEPLOYER_ADDRESS or DEPLOYER_PRIVATE_KEY in frontend/.env.example");
  process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: RPC_URL });
const account = new Account({
  provider: { nodeUrl: RPC_URL },
  address: DEPLOYER_ADDRESS,
  signer: DEPLOYER_PRIVATE_KEY,
});

function loadArtifact(name) {
  const sierra = json.parse(
    readFileSync(resolve(ROOT, "target", "dev", `bicvar_${name}.contract_class.json`), "utf-8")
  );
  const casm = json.parse(
    readFileSync(resolve(ROOT, "target", "dev", `bicvar_${name}.compiled_contract_class.json`), "utf-8")
  );
  return { sierra, casm };
}

async function declareIfNeeded(name, sierra, casm) {
  const classHash = hash.computeContractClassHash(sierra);
  const compiledClassHash = hash.computeCompiledClassHash(casm);

  console.log(`  Class hash: ${classHash}`);

  try {
    await provider.getClassByHash(classHash);
    console.log(`  ✓ Already declared`);
    return classHash;
  } catch {
    // not declared yet
  }

  console.log(`  Declaring ${name}...`);
  const declareResponse = await account.declare({
    contract: sierra,
    compiledClassHash: compiledClassHash,
  });
  console.log(`  TX: ${declareResponse.transaction_hash}`);
  await provider.waitForTransaction(declareResponse.transaction_hash);
  console.log(`  ✓ Declared`);
  return declareResponse.class_hash;
}

async function deployContract(classHash, constructorCalldata) {
  const deployResponse = await account.deployContract({
    classHash,
    constructorCalldata,
  });
  console.log(`  TX: ${deployResponse.transaction_hash}`);
  await provider.waitForTransaction(deployResponse.transaction_hash);
  console.log(`  ✓ Deployed at: ${deployResponse.contract_address}`);
  return deployResponse.contract_address;
}

async function main() {
  console.log("\n  BICVAR — Deploying to Starknet Sepolia");
  console.log(`  Deployer: ${DEPLOYER_ADDRESS}\n`);

  try {
    const chainId = await provider.getChainId();
    console.log(`Chain ID: ${chainId}\n`);
  } catch (err) {
    console.error("❌ Failed to connect to RPC:", err.message);
    process.exit(1);
  }

  console.log("[1/3] Mock BTC Token");
  const mockToken = loadArtifact("MockToken");
  const mockTokenClassHash = await declareIfNeeded("MockToken", mockToken.sierra, mockToken.casm);

  console.log("  Deploying Mock BTC...");
  const btcAddress = await deployContract(mockTokenClassHash, CallData.compile({
    name: shortString.encodeShortString("Mock Bitcoin"),
    symbol: shortString.encodeShortString("BTC"),
    decimals: 18,
    initial_supply: { low: 0, high: 0 },
    recipient: DEPLOYER_ADDRESS,
  }));

  console.log("\n[2/3] Mock USDC Token");
  console.log(`  Class hash: ${mockTokenClassHash} (reusing)`);
  console.log("  Deploying Mock USDC...");
  const usdcAddress = await deployContract(mockTokenClassHash, CallData.compile({
    name: shortString.encodeShortString("Mock USDC"),
    symbol: shortString.encodeShortString("USDC"),
    decimals: 18,
    initial_supply: { low: 0, high: 0 },
    recipient: DEPLOYER_ADDRESS,
  }));

  console.log("\n[3/3] BICVAR DarkPool");
  const darkPool = loadArtifact("DarkPool");
  const darkPoolClassHash = await declareIfNeeded("DarkPool", darkPool.sierra, darkPool.casm);

  console.log("  Deploying DarkPool...");
  const darkPoolAddress = await deployContract(darkPoolClassHash, []);

  const envLocalPath = resolve(ROOT, "frontend", ".env.local");
  const envContent = `NEXT_PUBLIC_RPC_URL=${RPC_URL}
NEXT_PUBLIC_DARKPOOL_ADDRESS=${darkPoolAddress}
NEXT_PUBLIC_BTC_TOKEN_ADDRESS=${btcAddress}
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=${usdcAddress}
`;

  writeFileSync(envLocalPath, envContent);

  console.log("\n  Deployment complete.");
  console.log(`  DarkPool: ${darkPoolAddress}`);
  console.log(`  BTC:      ${btcAddress}`);
  console.log(`  USDC:     ${usdcAddress}`);
  console.log(`  .env.local updated\n`);
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err);
  process.exit(1);
});
