"use client";

import { useState } from "react";
import Link from "next/link";
import { ASSET_CATEGORIES } from "@/lib/mock/assets";

interface DisclosureLink {
  id: string;
  title: string;
  url: string;
}

interface FormState {
  assetName: string;
  symbol: string;
  category: string;
  jurisdiction: string;
  issuerName: string;
  issuerAddress: string;
  custodyProvider: string;
  disclosures: DisclosureLink[];
}

const EMPTY_FORM: FormState = {
  assetName: "",
  symbol: "",
  category: "",
  jurisdiction: "",
  issuerName: "",
  issuerAddress: "",
  custodyProvider: "",
  disclosures: [{ id: "d1", title: "", url: "" }],
};

export default function IssuerNewPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const setField = (key: keyof Omit<FormState, "disclosures">, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addDisclosure = () =>
    setForm((f) => ({
      ...f,
      disclosures: [...f.disclosures, { id: `d${Date.now()}`, title: "", url: "" }],
    }));

  const removeDisclosure = (id: string) =>
    setForm((f) => ({
      ...f,
      disclosures: f.disclosures.filter((d) => d.id !== id),
    }));

  const setDisclosureField = (id: string, key: keyof Omit<DisclosureLink, "id">, value: string) =>
    setForm((f) => ({
      ...f,
      disclosures: f.disclosures.map((d) => (d.id === id ? { ...d, [key]: value } : d)),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-zinc-100">Registration Submitted</h2>
            <p className="text-zinc-500 text-sm">
              Your issuance application for{" "}
              <span className="text-zinc-300 font-mono">{form.assetName}</span> has been received.
              Attestation validation will begin once the smart contract is deployed.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2 text-sm">
            <Row label="Asset Name" value={form.assetName} />
            <Row label="Symbol" value={form.symbol.toUpperCase()} />
            <Row label="Issuer" value={form.issuerName} />
            <Row label="Jurisdiction" value={form.jurisdiction} />
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/proof/demo-asset"
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-sm font-mono hover:bg-zinc-700 transition-colors"
            >
              View Demo Proof
            </Link>
            <button
              onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); }}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 text-sm font-mono hover:bg-zinc-800 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 font-mono text-xs uppercase tracking-widest transition-colors">
            &larr; AssetProof
          </Link>
          <span className="text-zinc-700 font-mono text-xs">Issuer Portal</span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-100">Register New Asset Issuance</h1>
          <p className="text-zinc-500 text-sm">
            Submit details for your tokenized real-world asset. Attestation proofs will be generated
            on BNB Chain after review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Asset Identity */}
          <Section title="Asset Identity" index={1}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Asset Name" required>
                <input
                  type="text"
                  placeholder="Singapore Grade-A Office Trust"
                  value={form.assetName}
                  onChange={(e) => setField("assetName", e.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField label="Symbol" required>
                <input
                  type="text"
                  placeholder="SGOT"
                  maxLength={10}
                  value={form.symbol}
                  onChange={(e) => setField("symbol", e.target.value.toUpperCase())}
                  required
                  className={inputClass + " uppercase"}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category" required>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Jurisdiction" required>
                <input
                  type="text"
                  placeholder="Singapore"
                  value={form.jurisdiction}
                  onChange={(e) => setField("jurisdiction", e.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>
            </div>
          </Section>

          {/* Section 2: Issuer Details */}
          <Section title="Issuer Details" index={2}>
            <FormField label="Legal Entity Name" required>
              <input
                type="text"
                placeholder="Capital Realty Partners Pte. Ltd."
                value={form.issuerName}
                onChange={(e) => setField("issuerName", e.target.value)}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Issuer Wallet Address (BNB Chain)">
              <input
                type="text"
                placeholder="0x..."
                value={form.issuerAddress}
                onChange={(e) => setField("issuerAddress", e.target.value)}
                className={inputClass + " font-mono"}
              />
            </FormField>
          </Section>

          {/* Section 3: Custody */}
          <Section title="Custody Provider" index={3}>
            <FormField label="Custody Provider Name" required>
              <input
                type="text"
                placeholder="Standard Chartered Custody Services"
                value={form.custodyProvider}
                onChange={(e) => setField("custodyProvider", e.target.value)}
                required
                className={inputClass}
              />
            </FormField>
          </Section>

          {/* Section 4: Disclosure Links */}
          <Section title="Disclosure Documents" index={4}>
            <p className="text-zinc-500 text-xs font-mono">
              Add publicly accessible links to offering documents, audits, and legal filings.
            </p>
            <div className="space-y-3">
              {form.disclosures.map((doc) => (
                <div key={doc.id} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Document title"
                      value={doc.title}
                      onChange={(e) => setDisclosureField(doc.id, "title", e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={doc.url}
                      onChange={(e) => setDisclosureField(doc.id, "url", e.target.value)}
                      className={inputClass + " font-mono"}
                    />
                  </div>
                  {form.disclosures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDisclosure(doc.id)}
                      className="mt-2 text-zinc-700 hover:text-rose-500 transition-colors text-lg leading-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDisclosure}
                className="text-zinc-600 hover:text-zinc-400 font-mono text-xs uppercase tracking-widest transition-colors"
              >
                + Add Document
              </button>
            </div>
          </Section>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Submit for Review
            </button>
            <p className="text-zinc-700 text-xs font-mono">
              No tokens required &mdash; registration is free during beta.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Sub-components ----

const inputClass =
  "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors";

function Section({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-mono text-xs">
          {index}
        </span>
        <h2 className="text-zinc-300 font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
        {label}
        {required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-600 font-mono uppercase tracking-widest">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
