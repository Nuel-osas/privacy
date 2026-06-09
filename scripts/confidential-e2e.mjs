// End-to-end PROOF: a real confidential transfer on live Sui devnet using the
// official Contra SDK + WASM prover, against our deployed contracts.
//   Alice: register -> mint BU -> wrap (public->confidential)
//   Alice -> Bob: confidential transfer (amount hidden)
//   Bob: decrypt his balance with his viewing key
// Run: node scripts/confidential-e2e.mjs
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { ContraClient, TokenAccount, DiscreteLogTable } from "ts-sdk";

const C = {
  contraPackage: "0xa53010ace79c4202c2970cf890f58d1d7745495d45bac96d365a863e9726488d",
  tokenRegistry: "0xdaa104b92ee16ec361055a1f350af241df186cb4d9b91b9fc68fb36f423f4f42",
  accountRegistry: "0x522f0631a394a162e650080efbab2b36649cd9f63b2e013d9686dc3b703f58e0",
  buPackage: "0x094d2c74893ead8ff73886ade2966f0f85cefa1b4c382193fe11b49bb7b6fb4c",
  buTreasury: "0xca41b361b25fabb21a6abcf46c8354bc56377a61dcbca5b88097c0c2283f1286",
  buType: "0x094d2c74893ead8ff73886ade2966f0f85cefa1b4c382193fe11b49bb7b6fb4c::bu::BU",
};

const client = new SuiJsonRpcClient({ network: "devnet", url: getJsonRpcFullnodeUrl("devnet") });
const ex = (d) => `https://suiscan.xyz/devnet/tx/${d}`;
const log = (...a) => console.log(...a);

async function run(label, keypair, tx) {
  tx.setSenderIfNotSet(keypair.getPublicKey().toSuiAddress());
  const r = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });
  await client.waitForTransaction({ digest: r.digest });
  const status = r.effects?.status?.status;
  log(`  ${label}: ${status}  ${ex(r.digest)}`);
  if (status !== "success") {
    log("    ERROR:", JSON.stringify(r.effects?.status));
    throw new Error(`${label} failed`);
  }
  return r;
}

async function faucet(addr) {
  await requestSuiFromFaucetV2({ host: getFaucetHost("devnet"), recipient: addr });
  // wait for funds
  for (let i = 0; i < 30; i++) {
    const b = await client.getBalance({ owner: addr });
    if (BigInt(b.totalBalance) > 0n) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("faucet timeout for " + addr);
}

const main = async () => {
  log("Building discrete-log table…");
  const table = DiscreteLogTable.create(16);
  const packageConfig = {
    packageId: C.contraPackage,
    accountRegistryId: C.accountRegistry,
    tokenRegistryId: C.tokenRegistry,
  };
  const contra = new ContraClient({ suiClient: client, packageConfig, table });

  const alice = Ed25519Keypair.generate();
  const bob = Ed25519Keypair.generate();
  const aliceAddr = alice.getPublicKey().toSuiAddress();
  const bobAddr = bob.getPublicKey().toSuiAddress();
  log("Alice:", aliceAddr);
  log("Bob:  ", bobAddr);

  log("Funding from faucet…");
  await faucet(aliceAddr);
  await faucet(bobAddr);

  const aliceTA = new TokenAccount(aliceAddr, C.buType, packageConfig);
  const bobTA = new TokenAccount(bobAddr, C.buType, packageConfig);

  // 1. Register Alice (+ mint 10 BU to her public wallet)
  log("\n[1] Register Alice + mint 10 BU");
  {
    const tx = new Transaction();
    const account = tx.add(contra.newAccount({ owner: aliceAddr }));
    tx.add(await contra.register({ tokenAccount: aliceTA, account, auditorPublicKeys: [] }));
    tx.add(contra.shareAccount({ account }));
    tx.moveCall({ target: `${C.buPackage}::bu::mint_10`, arguments: [tx.object(C.buTreasury)] });
    await run("register+mint(alice)", alice, tx);
  }

  // 2. Register Bob
  log("\n[2] Register Bob");
  {
    const tx = new Transaction();
    const account = tx.add(contra.newAccount({ owner: bobAddr }));
    tx.add(await contra.register({ tokenAccount: bobTA, account, auditorPublicKeys: [] }));
    tx.add(contra.shareAccount({ account }));
    await run("register(bob)", bob, tx);
  }

  // 3. Alice wraps 5 BU (public -> confidential)
  log("\n[3] Alice wraps 5 BU into confidential balance");
  {
    const { data: coins } = await client.getCoins({ owner: aliceAddr, coinType: C.buType });
    if (!coins.length) throw new Error("Alice has no BU");
    const tx = new Transaction();
    const [pay] = tx.splitCoins(tx.object(coins[0].coinObjectId), [5_000_000_000n]);
    tx.add(contra.wrap({ coin: pay, receiver: aliceAddr, tokenType: C.buType }));
    await run("wrap(alice 5 BU)", alice, tx);
  }

  // 4. Alice confidential-transfers 2 BU to Bob (amount hidden, merge pending first)
  log("\n[4] Alice -> Bob: confidential transfer of 2 BU (amount HIDDEN on-chain)");
  {
    const tx = new Transaction();
    tx.add(
      await contra.transfer({
        tokenAccount: aliceTA,
        receiverAddress: bobAddr,
        amount: 2_000_000_000n,
        merge: true,
      }),
    );
    await run("transfer(alice->bob 2 BU)", alice, tx);
  }

  // 5. Decrypt balances with viewing keys
  log("\n[5] Decrypt balances (only the key holder can):");
  const aBal = await contra.getBalance(aliceTA);
  const bBal = await contra.getBalance(bobTA);
  const fmt = (n) => ((n == null ? 0 : Number(n)) / 1e9).toFixed(2);
  log(`  Alice  active=${fmt(aBal.balance.amount)} pending=${fmt(aBal.pending.amount)} pendingPublic=${fmt(aBal.pendingPublicBalance)} BU`);
  log(`  Bob    active=${fmt(bBal.balance.amount)} pending=${fmt(bBal.pending.amount)} pendingPublic=${fmt(bBal.pendingPublicBalance)} BU`);
  log("\n✅ Real confidential transfer complete on devnet. On-chain the amounts are ciphertext;");
  log("   only Alice/Bob decrypt their own balances. Verify the txns on Suiscan above.");
};

main().catch((e) => {
  console.error("E2E FAILED:", e?.message ?? e);
  process.exit(1);
});
