#!/usr/bin/env bash
# Redeploy the confidential-transfers stack to Sui devnet after a (weekly) reset,
# then patch src/lib/contracts.ts with the fresh IDs — and optionally ship the
# update to the live Vercel site.
#
#   scripts/redeploy-devnet.sh            # redeploy on-chain + patch contracts.ts + local build
#   scripts/redeploy-devnet.sh --vercel   # ...then `vercel --prod` (needs one-time `vercel login` + `vercel link`)
#   scripts/redeploy-devnet.sh --git      # ...then git commit + push (Vercel git-integration auto-builds)
#
# Requires: sui CLI on devnet env, python3, pnpm. Faucets gas automatically.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
DEPLOY=""
for a in "$@"; do case "$a" in --vercel) DEPLOY=vercel;; --git) DEPLOY=git;; --tx) FRESHTX=1;; esac; done

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

# ── 0. env + gas ─────────────────────────────────────────────────────────────
sui client switch --env devnet >/dev/null 2>&1 || true
ADDR="$(sui client active-address)"
CHAIN="$(sui client chain-identifier)"
say "devnet chain-id: $CHAIN   deployer: $ADDR"

gas_mist() { curl -s --max-time 10 -X POST https://fullnode.devnet.sui.io:443 \
  -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"suix_getBalance\",\"params\":[\"$ADDR\"]}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("result",{}).get("totalBalance","0"))' 2>/dev/null || echo 0; }

if [ "$(gas_mist)" -lt 300000000 ]; then
  say "low gas — requesting from devnet faucet…"; sui client faucet >/dev/null 2>&1 || true
  for i in $(seq 1 30); do [ "$(gas_mist)" -ge 300000000 ] && break; sleep 2; done
fi
say "gas balance: $(gas_mist) mist"

# ── 1. write the current chain-id into every [environments] block ────────────
set_chain() { python3 - "$1" "$CHAIN" <<'PY'
import sys,re
f,chain=sys.argv[1],sys.argv[2]; s=open(f).read()
if re.search(r'(?m)^devnet\s*=',s): ns=re.sub(r'(?m)^devnet\s*=.*$',f'devnet = "{chain}"',s)
elif '[environments]' in s:        ns=s.replace('[environments]',f'[environments]\ndevnet = "{chain}"',1)
else:                              ns=s.rstrip()+f'\n\n[environments]\ndevnet = "{chain}"\n'
if ns!=s: open(f,'w').write(ns)  # only rewrite when changed, so Move.lock pins aren't re-resolved
PY
}
say "pinning chain-id in Move.toml [environments]"
for m in contra/move/Move.toml launchpad/Move.toml contra/utils/move/test_token/Move.toml; do set_chain "$m"; echo "  $m"; done

# ── 2. publish helpers ───────────────────────────────────────────────────────
publish() { # dir  outfile   (fresh publish; rm stale Published.toml first)
  rm -f "$1/Published.toml"
  say "publishing $1"
  ( cd "$1" && sui client publish --skip-dependency-verification --json ) > "$2"
  python3 -c 'import sys,json;d=json.load(open(sys.argv[1]));assert d.get("objectChanges"),"no objectChanges";st=d.get("effects",{}).get("status",{});assert st.get("status")=="success",st' "$2"
}
pkg_of()  { python3 -c 'import sys,json;d=json.load(open(sys.argv[1]));print(next(c["packageId"] for c in d["objectChanges"] if c["type"]=="published"))' "$1"; }
obj_of()  { python3 -c 'import sys,json;d=json.load(open(sys.argv[1]));suf=sys.argv[2];print(next(c["objectId"] for c in d["objectChanges"] if c["type"]=="created" and suf in c.get("objectType","")))' "$1" "$2"; }

# ── 3. publish contra → launchpad → bu (order matters: dependents read contra) ─
publish contra/move                     "$TMP/contra.json"
CONTRA_PKG="$(pkg_of "$TMP/contra.json")"
TOKEN_REG="$(obj_of "$TMP/contra.json" '::contra::TokenRegistry')"
ACCOUNT_REG="$(obj_of "$TMP/contra.json" '::contra::AccountRegistry')"

publish launchpad                       "$TMP/launchpad.json"
LAUNCHPAD_PKG="$(pkg_of "$TMP/launchpad.json")"
LAUNCHPAD="$(obj_of "$TMP/launchpad.json" '::launchpad::Launchpad')"

publish contra/utils/move/test_token    "$TMP/bu.json"
BU_PKG="$(pkg_of "$TMP/bu.json")"
BU_TREASURY="$(obj_of "$TMP/bu.json" '::bu::BuTreasury')"

# ── 4. register BU as a confidential token (empty auditor vector) ─────────────
say "register_confidential (BU → ConfidentialToken<BU> + Pool<BU>)"
sui client ptb \
  --make-move-vec "<0x2::group_ops::Element<0x2::ristretto255::G>>" "[]" --assign auditors \
  --move-call "${BU_PKG}::bu::register_confidential" "@${BU_TREASURY}" "@${TOKEN_REG}" auditors \
  --json > "$TMP/register.json"
python3 -c 'import sys,json;d=json.load(open(sys.argv[1]));st=d.get("effects",{}).get("status",{});assert st.get("status")=="success",st' "$TMP/register.json"
CONF_TOKEN="$(obj_of "$TMP/register.json" '::contra::ConfidentialToken<')"
POOL="$(obj_of "$TMP/register.json" '::contra::Pool<')"

# ── 5. patch src/lib/contracts.ts ────────────────────────────────────────────
say "patching src/lib/contracts.ts"
STAMP="$(date +%Y-%m-%d)"
CONTRA_PKG="$CONTRA_PKG" TOKEN_REG="$TOKEN_REG" ACCOUNT_REG="$ACCOUNT_REG" \
LAUNCHPAD_PKG="$LAUNCHPAD_PKG" LAUNCHPAD="$LAUNCHPAD" BU_PKG="$BU_PKG" \
BU_TREASURY="$BU_TREASURY" CONF_TOKEN="$CONF_TOKEN" POOL="$POOL" \
CHAIN="$CHAIN" STAMP="$STAMP" python3 - <<'PY'
import re,os
v={"contraPackage":os.environ["CONTRA_PKG"],"tokenRegistry":os.environ["TOKEN_REG"],
   "accountRegistry":os.environ["ACCOUNT_REG"],"launchpadPackage":os.environ["LAUNCHPAD_PKG"],
   "launchpad":os.environ["LAUNCHPAD"],"buPackage":os.environ["BU_PKG"],
   "buTreasury":os.environ["BU_TREASURY"],"confidentialToken":os.environ["CONF_TOKEN"],
   "pool":os.environ["POOL"],"buCoinType":os.environ["BU_PKG"]+"::bu::BU"}
f="src/lib/contracts.ts"; s=open(f).read()
for k,val in v.items():
    s,n=re.subn(rf'({k}:\s*")[^"]*(")',lambda m:m.group(1)+val+m.group(2),s,count=1)
    assert n==1,f"field {k} not found in contracts.ts"
s=re.sub(r'chain [0-9a-f]+, published [0-9-]+',f'chain {os.environ["CHAIN"]}, published {os.environ["STAMP"]}',s)
open(f,"w").write(s)
print("  updated 9 IDs + header")
PY

say "patching README table + scripts/confidential-e2e.mjs"
CONTRA_PKG="$CONTRA_PKG" TOKEN_REG="$TOKEN_REG" ACCOUNT_REG="$ACCOUNT_REG" \
LAUNCHPAD_PKG="$LAUNCHPAD_PKG" BU_PKG="$BU_PKG" BU_TREASURY="$BU_TREASURY" \
CONF_TOKEN="$CONF_TOKEN" python3 - <<'PY'
import re,os
contra,lp,ct=os.environ["CONTRA_PKG"],os.environ["LAUNCHPAD_PKG"],os.environ["CONF_TOKEN"]
s=open("README.md").read()
s=re.sub(r'(Launchpad package \| `)0x[0-9a-f]+(`)',lambda m:m.group(1)+lp+m.group(2),s)
s=re.sub(r'(Contra package \| `)0x[0-9a-f]+(`)',lambda m:m.group(1)+contra+m.group(2),s)
s=re.sub(r'(ConfidentialToken<BU>` \| `)0x[0-9a-f]+(`)',lambda m:m.group(1)+ct+m.group(2),s)
open("README.md","w").write(s)
e="scripts/confidential-e2e.mjs"; s=open(e).read()
for k,val in {"contraPackage":contra,"tokenRegistry":os.environ["TOKEN_REG"],"accountRegistry":os.environ["ACCOUNT_REG"],"buPackage":os.environ["BU_PKG"],"buTreasury":os.environ["BU_TREASURY"]}.items():
    s=re.sub(rf'({k}:\s*")0x[0-9a-f]+(")',lambda m,val=val:m.group(1)+val+m.group(2),s,count=1)
s=re.sub(r'(buType:\s*")0x[0-9a-f]+::bu::BU(")',lambda m:m.group(1)+os.environ["BU_PKG"]+"::bu::BU"+m.group(2),s,count=1)
open(e,'w').write(s)
print("  patched README table + e2e config")
PY

cat <<EOF

  contraPackage     $CONTRA_PKG
  tokenRegistry     $TOKEN_REG
  accountRegistry   $ACCOUNT_REG
  launchpadPackage  $LAUNCHPAD_PKG
  launchpad         $LAUNCHPAD
  buPackage         $BU_PKG
  buTreasury        $BU_TREASURY
  confidentialToken $CONF_TOKEN
  pool              $POOL
EOF

# ── 5b. optional: mint a fresh confidential tx + refresh the README link ─────
if [ -n "${FRESHTX:-}" ]; then
  say "minting a fresh confidential tx (--tx)"
  if node scripts/confidential-e2e.mjs > "$TMP/e2e.log" 2>&1; then
    DIG=$(grep 'transfer(alice->bob' "$TMP/e2e.log" | grep -oE 'tx/[A-Za-z0-9]+' | sed 's#tx/##' | tail -1)
    if [ -n "$DIG" ]; then
      DIG="$DIG" python3 - <<'PY'
import re,os
d=os.environ["DIG"]; s=open("README.md").read()
open("README.md","w").write(re.sub(r'(suivision\.xyz/txblock/)[A-Za-z0-9]+',lambda m:m.group(1)+d,s))
print("  README tx link -> "+d)
PY
      echo "  fresh confidential tx: https://devnet.suivision.xyz/txblock/$DIG"
    else echo "  couldn't parse a tx digest — see $TMP/e2e.log"; fi
  else echo "  e2e failed (faucet rate-limit?) — see $TMP/e2e.log"; fi
fi

# ── 6. local build sanity check ──────────────────────────────────────────────
say "building the front-end with fresh IDs (pnpm build)"
pnpm build >/dev/null 2>&1 && echo "  build OK" || { echo "  BUILD FAILED — not deploying"; exit 1; }

# ── 7. ship to Vercel ────────────────────────────────────────────────────────
case "$DEPLOY" in
  vercel)
    say "deploying to Vercel (prod)"
    if ! vercel whoami >/dev/null 2>&1; then echo "  not logged in — run:  vercel login   (then re-run with --vercel)"; exit 1; fi
    [ -f .vercel/project.json ] || { echo "  project not linked — run once:  vercel link   (pick the existing 'privacy' project), then re-run"; exit 1; }
    vercel --prod --yes ;;
  git)
    say "committing + pushing (Vercel git-integration will auto-build)"
    git add src/lib/contracts.ts contra/move/Move.toml launchpad/Move.toml contra/utils/move/test_token/Move.toml
    git commit -q -m "devnet redeploy: refresh contract IDs (chain $CHAIN)" && git push ;;
  *)
    say "done. next: deploy the new IDs to the live site with either"
    echo "    vercel --prod        (CLI)   — or re-run:  scripts/redeploy-devnet.sh --vercel"
    echo "    git push             (auto)  — or re-run:  scripts/redeploy-devnet.sh --git" ;;
esac
