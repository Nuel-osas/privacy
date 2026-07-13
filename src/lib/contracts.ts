// Live Sui devnet deployment (chain 3b6f3fa4, published 2026-07-13).
//
// NOTE: Sui devnet wipes state on reset. If these object IDs stop resolving,
// devnet was reset — redeploy with: publish contra/move, launchpad/, and
// contra/utils/move/test_token, then call bu::register_confidential, and paste
// the new IDs here.
export const DEVNET = {
  // Mysten "Contra" confidential-transfers package + its shared registries
  contraPackage: "0x4c86127b0f6a232c0e14bf38d307955e8c3a414cac456f922ccd61ec2872fd2b",
  tokenRegistry: "0xc8a9557625f33c476360ffa1e021f0b0c6a4a2d0af5ee3ec9c09e3e7a7470a10",
  accountRegistry: "0xbf67d8c5632822d33eef973cafa16b4010ca5f32b673cbef8123e81090e640e2",

  // Our confidential-token launchpad
  launchpadPackage: "0x82bf0fe649414351fb890e9f5976463fbd1e3e0ed6fc84a41d0cb23c2eac3031",
  launchpad: "0x0f37bb2971ed9e6963118e6ce257cdd74bb083929be00f32a716caa38c1b189e",

  // The live OPEN confidential token "BU" — anyone can mint via BuTreasury,
  // and send confidentially via the ConfidentialToken<BU>.
  buPackage: "0xa0dd1980c51d121090a22bfe4117bc63d3da5b170616e6044554cf7a101ed3fd",
  buTreasury: "0x4b2b99b978b59a1d0210d9ba555487c78b6d2b7bc9f3219f484c3bd49f2700a3",
  confidentialToken: "0x26e92c33a28be31d883a0b1adde6339c7940259bb9deb81a4dbf87e0bc586537",
  pool: "0xaf0edbc76324ba6b86922327ef9eca6732e1c560d822cb2d57cbf1e5a91790cf",
  buCoinType: "0xa0dd1980c51d121090a22bfe4117bc63d3da5b170616e6044554cf7a101ed3fd::bu::BU",
} as const;
