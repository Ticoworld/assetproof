# AssetProof

> Trust requires ongoing proof. Not just tokenization.

AssetProof is a disclosure trust layer for tokenized assets on BNB Chain. It checks whether key disclosures such as custody, valuation, legal, and regulatory records are current, expiring, stale, or missing, then generates a publishable trust receipt.

## What problem it solves

A tokenized asset can still keep trading even when the real-world disclosures behind it have gone stale or disappeared.

AssetProof is built to answer one question clearly:

**Is this asset still trustworthy today?**

## What it does

AssetProof:

- collects disclosure inputs for a tokenized asset
- evaluates disclosure freshness using deterministic rules
- derives a trust state: Healthy, Review, or At Risk
- performs lightweight link credibility checks on disclosure URLs
- generates a canonical proof record
- supports publishing a trust receipt through BAS on BNB Chain
- supports public verification through a verify flow

## What is currently verified

- disclosure freshness from issue and expiry dates
- completeness of required disclosure signals
- attestation payload integrity against the BAS receipt
- basic link credibility signals such as reachability and content-type hints

## What is not verified yet

- document contents or legal truthfulness
- issuer identity beyond submitted inputs
- live on-chain token supply versus off-chain asset value
- automated recurring monitoring

## How it works

1. An issuer submits disclosure inputs
2. AssetProof evaluates each signal as current, expiring, stale, or missing
3. The app derives an overall trust state
4. A proof record is canonicalized and hashed
5. The proof can be published as an attested receipt on BNB Chain
6. The published proof can be reopened through the verify flow

## Tech stack

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Ethers.js
- EAS SDK
- BNB Chain / BAS

## Getting started

```bash
git clone https://github.com/Ticoworld/assetproof.git
cd assetproof
npm install
cp .env.local.example .env.local
npm run dev