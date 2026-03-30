# AssetProof

> **Trust requires ongoing proof. Not just tokenization.**

AssetProof acts as the ongoing trust layer for tokenized assets on BNB Chain, continually auditing whether critical disclosures are current, expiring, stale, or missing.

## 🎯 The Problem

Tokenizing an asset is easy. Trusting it over time is hard. Currently, "RWA platforms" mint a token and drop a static PDF into a decentralized storage link. Six months later, the underlying custody statement expires, the valuation goes stale, or the legal standing changes—but the token keeps trading. Investors are left completely blind to the deterioration of the asset's structural integrity.

## ✨ The Solution

AssetProof shifts the focus from initial tokenization to continuous disclosure auditing. It ingests the canonical documents that make an asset real (Custody, Valuation, Legal, and Regulatory filings), checks their issuance and expiration dates, and evaluates them deterministically. If a custody report is stale or a valuation is missing, the asset is flagged immediately. 

## 🏗️ How It Works

1. **Issuer Registration**: Asset issuers submit URLs and validity windows for their mandatory disclosures.
2. **Deterministic Evaluation**: AssetProof analyzes the freshness of the signals. Are they current, expiring (within 30 days), stale, or entirely missing?
3. **Trust State Calculation**: The system derives a plain-English state (e.g., "Review because the custody disclosure expires in 3 days").
4. **On-Chain Attestation**: The platform canonicalizes the proof record, hashes it, and publishes a cryptographic receipt directly to BNB Chain via BAS (BNB Attestation Service). 
5. **Public Verification**: Anyone can paste a BAS attestation UID into the Verify portal to instantly reconstruct the exact trust state and disclosure freshness at the time of publishing.

## 📊 What is Actually Verified

- **Document Freshness**: We strictly verify the lifecycle (Issue Date & Expiration Date) of provided disclosures against the current date.
- **Signal Completeness**: We mathematically track which mandatory documents (Custody, Valuation, Legal) are present vs. missing.
- **Attester Immutability**: We verify that the exact trust payload presented in the UI precisely matches the cryptographic signature of the BAS receipt.

## 🛠️ Tech Stack & Integration

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Attestation:** BNB Attestation Service (BAS), `@ethereum-attestation-service/eas-sdk`, Ethers.js
- **Network:** BNB Smart Chain (Testnet/Mainnet)

Rather than deploying bulky smart contracts just to store metadata, we use BAS to decouple the attestation of trust from the token standard itself. This makes our checks incredibly cheap, standard-compliant, and fully composable with the broader BNB ecosystem. 

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/assetproof.git
cd assetproof

# Install dependencies
npm install

# Setup environment variables (using BAS direct or relay mode)
cp .env.local.example .env.local

# Run the development server
npm run dev

# Open http://localhost:3000 to view the application
```

## 🏆 Hackathon
Built for the **BNB Chain Hackathon** (Q1 2026).

## 📄 License
MIT
