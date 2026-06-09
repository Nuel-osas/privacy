// Live Sui devnet deployment (chain 043d64c6, published 2026-06-08).
//
// NOTE: Sui devnet wipes state on reset. If these object IDs stop resolving,
// devnet was reset — redeploy with: publish contra/move, launchpad/, and
// contra/utils/move/test_token, then call bu::register_confidential, and paste
// the new IDs here.
export const DEVNET = {
  // Mysten "Contra" confidential-transfers package + its shared registries
  contraPackage: "0xa53010ace79c4202c2970cf890f58d1d7745495d45bac96d365a863e9726488d",
  tokenRegistry: "0xdaa104b92ee16ec361055a1f350af241df186cb4d9b91b9fc68fb36f423f4f42",
  accountRegistry: "0x522f0631a394a162e650080efbab2b36649cd9f63b2e013d9686dc3b703f58e0",

  // Our confidential-token launchpad
  launchpadPackage: "0x4f762554fd3493eab883a6aa372328206ed0991a0ded910f48cd0e8553658010",
  launchpad: "0x626886c616c34bc3fa54a5dd4335a33cc498f448a5d2fe0dc6bf9f4a89ab343e",

  // The live OPEN confidential token "BU" — anyone can mint via BuTreasury,
  // and send confidentially via the ConfidentialToken<BU>.
  buPackage: "0x094d2c74893ead8ff73886ade2966f0f85cefa1b4c382193fe11b49bb7b6fb4c",
  buTreasury: "0xca41b361b25fabb21a6abcf46c8354bc56377a61dcbca5b88097c0c2283f1286",
  confidentialToken: "0xef276ec5b7aa4c97f128a2bd2db3e956fc2d595998bef5a4a6c8a48fdba714e0",
  pool: "0xdc4ce862c238f8e043c674c9decdb79d42dcd8a1d3174b27dcdefc3eff3ccdef",
  buCoinType: "0x094d2c74893ead8ff73886ade2966f0f85cefa1b4c382193fe11b49bb7b6fb4c::bu::BU",
} as const;
