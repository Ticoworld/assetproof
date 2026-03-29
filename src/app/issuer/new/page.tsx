"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASSET_CATEGORIES } from "@/lib/mock/assets";
import {
  buildDraftAsset,
  saveDraft,
  type IssuerFormData,
  type ProofInput,
} from "@/lib/draft/state";

type FormErrors = {
  assetName?: string;
  symbol?: string;
  category?: string;
  jurisdiction?: string;
  issuerName?: string;
  issuerAddress?: string;
  custodyProvider?: string;
  custodyUrl?: string;
  custodyIssuedDate?: string;
  valuationUrl?: string;
  valuationIssuedDate?: string;
  legalUrl?: string;
  legalIssuedDate?: string;
};

const EMPTY_PROOF: ProofInput = { url: "", issuedDate: "", expiryDate: "" };

const EMPTY_FORM: IssuerFormData = {
  assetName: "",
  symbol: "",
  category: "",
  jurisdiction: "",
  totalValueUsd: "",
  tokenSupply: "",
  issuerName: "",
  issuerAddress: "",
  custodyProvider: "",
  custody: { ...EMPTY_PROOF },
  valuation: { ...EMPTY_PROOF },
  legal: { ...EMPTY_PROOF },
  regulatory: { ...EMPTY_PROOF },
};

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function validate(form: IssuerFormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.assetName.trim()) errors.assetName = "Required.";
  if (!form.symbol.trim()) errors.symbol = "Required.";
  else if (form.symbol.length > 10) errors.symbol = "Max 10 characters.";
  if (!form.category) errors.category = "Required.";
  if (!form.jurisdiction.trim()) errors.jurisdiction = "Required.";
  if (!form.issuerName.trim()) errors.issuerName = "Required.";
  if (form.issuerAddress && !EVM_ADDRESS.test(form.issuerAddress.trim()))
    errors.issuerAddress = "Must be a valid BNB Chain address (0x + 40 hex chars).";
  if (!form.custodyProvider.trim()) errors.custodyProvider = "Required.";
  if (!form.custody.url.trim()) errors.custodyUrl = "Required.";
  if (!form.custody.issuedDate.trim()) errors.custodyIssuedDate = "Required.";
  if (!form.valuation.url.trim()) errors.valuationUrl = "Required.";
  if (!form.valuation.issuedDate.trim()) errors.valuationIssuedDate = "Required.";
  if (!form.legal.url.trim()) errors.legalUrl = "Required.";
  if (!form.legal.issuedDate.trim()) errors.legalIssuedDate = "Required.";
  return errors;
}

export default function IssuerNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<IssuerFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const setField = (
    key: keyof Omit<IssuerFormData, "custody" | "valuation" | "legal" | "regulatory">,
    value: string
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (touched.has(key)) {
      const next = validate({ ...form, [key]: value });
      setErrors((e) => ({ ...e, [key]: next[key as keyof FormErrors] }));
    }
  };

  const blurField = (key: string) => {
    setTouched((s) => new Set([...s, key]));
    const next = validate(form);
    setErrors((e) => ({ ...e, [key]: next[key as keyof FormErrors] }));
  };

  const setProof = (
    section: "custody" | "valuation" | "legal" | "regulatory",
    field: keyof ProofInput,
    value: string
  ) => {
    const updated = { ...form, [section]: { ...form[section], [field]: value } };
    setForm(updated);
    const touchKey = `${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    if (touched.has(touchKey)) {
      const next = validate(updated);
      setErrors((e) => ({ ...e, [touchKey]: next[touchKey as keyof FormErrors] }));
    }
  };

  const blurProof = (
    section: "custody" | "valuation" | "legal" | "regulatory",
    field: keyof ProofInput
  ) => {
    const key = `${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    setTouched((s) => new Set([...s, key]));
    const next = validate(form);
    setErrors((e) => ({ ...e, [key]: next[key as keyof FormErrors] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched(new Set([
      "assetName", "symbol", "category", "jurisdiction",
      "issuerName", "issuerAddress", "custodyProvider",
      "custodyUrl", "custodyIssuedDate",
      "valuationUrl", "valuationIssuedDate",
      "legalUrl", "legalIssuedDate",
    ]));
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    const draft = buildDraftAsset(form);
    saveDraft(draft);
    router.push("/proof/preview");
  };

  const I = "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors";
  const IE = "w-full bg-zinc-900 border border-rose-800 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-rose-600 transition-colors";
  const ic = (k: string) => (touched.has(k) && !!(errors as Record<string, string | undefined>)[k]) ? IE : I;
  const te = (k: string) => touched.has(k) && !!(errors as Record<string, string | undefined>)[k];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-zinc-200 tracking-tight text-sm">ASSETPROOF</Link>
        <span className="text-zinc-600 text-xs font-mono">New asset</span>
      </header>
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Submit proof inputs</h1>
          <p className="text-zinc-500 text-sm mt-1">Provide asset details and link your disclosure documents.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          <Section title="Asset identity">
            <div className="grid grid-cols-2 gap-4">
              <FF label="Asset name" error={te("assetName") ? errors.assetName : undefined} required>
                <input type="text" placeholder="Singapore Grade-A Office Trust" value={form.assetName}
                  onChange={(e) => setField("assetName", e.target.value)} onBlur={() => blurField("assetName")}
                  className={ic("assetName")} />
              </FF>
              <FF label="Symbol" error={te("symbol") ? errors.symbol : undefined} required>
                <input type="text" placeholder="SGOT" maxLength={10} value={form.symbol}
                  onChange={(e) => setField("symbol", e.target.value.toUpperCase())} onBlur={() => blurField("symbol")}
                  className={ic("symbol") + " font-mono tracking-widest"} />
              </FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Category" error={te("category") ? errors.category : undefined} required>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)}
                  onBlur={() => blurField("category")} className={ic("category")}>
                  <option value="">Select category</option>
                  {ASSET_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
              </FF>
              <FF label="Jurisdiction" error={te("jurisdiction") ? errors.jurisdiction : undefined} required>
                <input type="text" placeholder="Singapore" value={form.jurisdiction}
                  onChange={(e) => setField("jurisdiction", e.target.value)} onBlur={() => blurField("jurisdiction")}
                  className={ic("jurisdiction")} />
              </FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Total asset value (USD)">
                <input type="text" placeholder="48,000,000" value={form.totalValueUsd}
                  onChange={(e) => setField("totalValueUsd", e.target.value)} className={I} />
              </FF>
              <FF label="Token supply">
                <input type="text" placeholder="48,000,000" value={form.tokenSupply}
                  onChange={(e) => setField("tokenSupply", e.target.value)} className={I} />
              </FF>
            </div>
          </Section>

          <Section title="Issuer">
            <FF label="Legal entity name" error={te("issuerName") ? errors.issuerName : undefined} required>
              <input type="text" placeholder="Capital Realty Partners Pte. Ltd." value={form.issuerName}
                onChange={(e) => setField("issuerName", e.target.value)} onBlur={() => blurField("issuerName")}
                className={ic("issuerName")} />
            </FF>
            <FF label="BNB Chain wallet address" error={te("issuerAddress") ? errors.issuerAddress : undefined}>
              <input type="text" placeholder="0x..." value={form.issuerAddress}
                onChange={(e) => setField("issuerAddress", e.target.value)} onBlur={() => blurField("issuerAddress")}
                className={ic("issuerAddress") + " font-mono"} />
            </FF>
          </Section>

          <Section title="Custody">
            <FF label="Custody provider" error={te("custodyProvider") ? errors.custodyProvider : undefined} required>
              <input type="text" placeholder="Standard Chartered Custody Services" value={form.custodyProvider}
                onChange={(e) => setField("custodyProvider", e.target.value)} onBlur={() => blurField("custodyProvider")}
                className={ic("custodyProvider")} />
            </FF>
            <FF label="Custody statement URL" error={te("custodyUrl") ? errors.custodyUrl : undefined} required>
              <input type="url" placeholder="https://..." value={form.custody.url}
                onChange={(e) => setProof("custody", "url", e.target.value)}
                onBlur={() => blurProof("custody", "url")}
                className={ic("custodyUrl") + " font-mono"} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Statement date" error={te("custodyIssuedDate") ? errors.custodyIssuedDate : undefined} required>
                <input type="date" value={form.custody.issuedDate}
                  onChange={(e) => setProof("custody", "issuedDate", e.target.value)}
                  onBlur={() => blurProof("custody", "issuedDate")}
                  className={ic("custodyIssuedDate")} />
              </FF>
              <FF label="Expiry date">
                <input type="date" value={form.custody.expiryDate}
                  onChange={(e) => setProof("custody", "expiryDate", e.target.value)}
                  className={I} />
              </FF>
            </div>
          </Section>

          <Section title="Valuation">
            <FF label="Valuation report URL" error={te("valuationUrl") ? errors.valuationUrl : undefined} required>
              <input type="url" placeholder="https://..." value={form.valuation.url}
                onChange={(e) => setProof("valuation", "url", e.target.value)}
                onBlur={() => blurProof("valuation", "url")}
                className={ic("valuationUrl") + " font-mono"} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Report date" error={te("valuationIssuedDate") ? errors.valuationIssuedDate : undefined} required>
                <input type="date" value={form.valuation.issuedDate}
                  onChange={(e) => setProof("valuation", "issuedDate", e.target.value)}
                  onBlur={() => blurProof("valuation", "issuedDate")}
                  className={ic("valuationIssuedDate")} />
              </FF>
              <FF label="Next review date">
                <input type="date" value={form.valuation.expiryDate}
                  onChange={(e) => setProof("valuation", "expiryDate", e.target.value)}
                  className={I} />
              </FF>
            </div>
          </Section>

          <Section title="Legal">
            <FF label="Legal filing URL" error={te("legalUrl") ? errors.legalUrl : undefined} required>
              <input type="url" placeholder="https://..." value={form.legal.url}
                onChange={(e) => setProof("legal", "url", e.target.value)}
                onBlur={() => blurProof("legal", "url")}
                className={ic("legalUrl") + " font-mono"} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Filing date" error={te("legalIssuedDate") ? errors.legalIssuedDate : undefined} required>
                <input type="date" value={form.legal.issuedDate}
                  onChange={(e) => setProof("legal", "issuedDate", e.target.value)}
                  onBlur={() => blurProof("legal", "issuedDate")}
                  className={ic("legalIssuedDate")} />
              </FF>
              <FF label="Renewal date">
                <input type="date" value={form.legal.expiryDate}
                  onChange={(e) => setProof("legal", "expiryDate", e.target.value)}
                  className={I} />
              </FF>
            </div>
          </Section>

          <Section title="Regulatory filing" optional>
            <FF label="Regulatory filing URL">
              <input type="url" placeholder="https://..." value={form.regulatory.url}
                onChange={(e) => setProof("regulatory", "url", e.target.value)}
                className={I + " font-mono"} />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Filing date">
                <input type="date" value={form.regulatory.issuedDate}
                  onChange={(e) => setProof("regulatory", "issuedDate", e.target.value)}
                  className={I} />
              </FF>
              <FF label="Renewal date">
                <input type="date" value={form.regulatory.expiryDate}
                  onChange={(e) => setProof("regulatory", "expiryDate", e.target.value)}
                  className={I} />
              </FF>
            </div>
          </Section>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Generating..." : "Generate proof"}
            </button>
          </div>
          {Object.values(errors).some(Boolean) && touched.size > 0 && (
            <p className="text-rose-500 text-xs">Please fix the errors above before submitting.</p>
          )}
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  optional = false,
  children,
}: {
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
        <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-widest">{title}</h2>
        {optional && <span className="text-zinc-600 text-xs">optional</span>}
      </div>
      {children}
    </div>
  );
}

function FF({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-400 text-xs">
        {label}{required && <span className="text-zinc-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-rose-500 text-xs">{error}</p>}
    </div>
  );
}