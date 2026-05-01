# A Privacy-Preserving Analytical "5th Corner" for the PEPPOL Network
## An Architectural Blueprint Anchored to Singapore's InvoiceNow / IMDA Context

*Prepared by: Principal Reasoning Architect, orchestrating a panel of: a Security & Privacy Architect (PETs/cryptography lens), a PEPPOL Infrastructure Specialist (governance/interoperability lens), and a Data Trust & Compliance Auditor (regulatory/auditability lens).*

*UK English. Audience: technical architects, policy makers, financial auditors. April 2026.*

---

## 1. Executive Summary

Singapore is on the verge of a dual transition. First, IMDA's **InvoiceNow** network — Asia's earliest and most mature PEPPOL deployment, with more than 63,000 onboarded businesses — has been re-shaped by the **GST InvoiceNow Requirement**, which already binds newly incorporated voluntary GST registrants from 1 November 2025 and all new voluntary registrants from 1 April 2026, with phased extension to all GST-registered businesses between 1 April 2028 and 1 April 2031. Second, this requirement effectively introduces a **quasi-5th corner** today: IRAS receives a copy of every in-scope PEPPOL invoice via accredited Access Points (APs), already shifting Singapore from the canonical 4-corner model to a Decentralised Continuous Transaction Control & Exchange (DCTCE) shape akin to Belgium's planned 2028 model.

The strategic question is no longer *whether* Singapore needs a 5th corner — it has one in IRAS — but **whether that 5th corner can be generalised, productised and made privacy-preserving for use cases beyond GST clearance**: invoice financing and supply-chain working-capital risk for banks (use case A), statutory tax and transfer-pricing audit (use case B), and enterprise self-service analytics (use case C). The *centralisation reflex* of replicating the IRAS pattern for banks and analytics providers is incompatible with the constraints set by data owners, the PDPA, banking secrecy, and the openly stated InvoiceNow design principle that "sent e-invoices cannot be retrieved" — i.e. the network behaves like email, not a repository.

**The recommended architectural path is a *Federated Analytical Mesh* anchored to the PEPPOL layer**: a distributed pattern in which the 5th corner is not a place but a *role*. Concretely:

- **Documents stay at C1/C4** (sender and receiver corners) inside the InvoiceNow-Ready Solutions or AP-managed buyer/supplier mailboxes. No central pool is created.
- **Computation travels to data** via a query-mediation fabric ("Analytical Service Endpoints" — *ASEs*) co-located with C2/C3 APs, enforcing fine-grained, attribute-based access control with cryptographic audit trails.
- **Three PET layers operate in parallel** (not as a fallback chain):
  - *Layer L1 — Selective Disclosure & Verifiable Credentials* (W3C VCDM 2.0, SD-JWT-VC, BBS+ where mature) for KYB, invoice attestation, and audit-evidence packaging.
  - *Layer L2 — Federated Learning + Differential Privacy* for cross-bank risk and fraud models (precedent: J.P. Morgan / BNY / RBC / NVIDIA *Project AIKYA*; J.P. Morgan / NVIDIA federated fraud PoC).
  - *Layer L3 — Confidential-Computing Enclaves with PSI/MPC primitives* for high-assurance joint queries (duplicate-financing, sanctions screening, aggregate exposure), reusing the architectural lessons of the **MonetaGo / ABS Trade Finance Registry** that already operates a confidential-computing-based hash registry for Singapore banks.
- **Zero-Knowledge Proofs (ZKPs)** are deployed selectively where strong, non-interactive, post-hoc verifiability is required (e.g. proving GST has been correctly computed, total receivables exceed a financing threshold, no duplicate invoice ID exists in a defined window).
- **Tamper-evident transparency logs** (Certificate-Transparency-style append-only Merkle logs) record *every analytical query* against the federated mesh, so data owners gain irrefutable "who looked, when, why" auditability.

The pragmatic alternatives — particularly **policy-based ABAC with cryptographic audit logs** and **distributed ledger-anchored notarisation of hashes only** (mirroring SGTraDex and TradeTrust patterns) — are evaluated *in parallel* and integrated as the substrate, not as a fallback. Centralised data clean rooms (Snowflake, Decentriq, AWS Clean Rooms, Habu) are explicitly de-prioritised because they breach the "no centralised data storage" hard constraint, although confidential-computing clean-room *primitives* (e.g. Decentriq's enclave engine, GCP Confidential Space, Azure Confidential Computing) are reused inside ASEs.

The tree-of-thoughts protocol (§5) traversed nine candidate paths from the three expert lenses, scored them on Relevance / Novelty / Impact / Trust, and converged on this hybrid mesh — designated **Path B-1 (Federated Analytical Mesh with VC-mediated Disclosure and Selective ZKP Anchoring)** — as the optimal balance between cryptographic guarantees, PEPPOL backwards-compatibility and Singapore-specific governance feasibility.

A phased rollout is proposed in §6, aligned to InvoiceNow / GST InvoiceNow milestones, beginning with a *Verifiable-Credential pilot for invoice financing* in 2026–2027, scaling to a federated-learning fraud sandbox in 2028, and reaching production-grade analytical mesh capability by the time of the 2031 mandate completion.

---

## 2. PEPPOL Network Extension Architecture

### 2.1 Reference baseline: the canonical 4-corner model

The PEPPOL 4-corner model is the trust and routing substrate of InvoiceNow. Documents traverse:

- **C1 (Sender / Supplier)** — generates a structured invoice in PINT-SG (the Peppol International Billing specification specialised for Singapore, replacing SG Peppol BIS Billing 3.0).
- **C2 (Sender's AP)** — IMDA-accredited Access Point. Validates against schematron rules, signs and transmits over AS4.
- **C3 (Receiver's AP)** — Validates, decrypts, returns Message Level Response.
- **C4 (Receiver / Buyer)** — Integrates into ERP / accounting system.

Discovery is provided by the **SML** (single global DNS-based registry) and **SMP** (decentralised metadata store). Each AP both serves end-customers and acts as a node in PEPPOL's distributed network — a duality essential to the proposed 5th corner.

### 2.2 Singapore's de facto 5th corner today: IRAS via the GST InvoiceNow Requirement

Per IRAS' e-Tax Guide *"Adopting GST InvoiceNow Requirement for GST-registered Businesses"* and IMDA AP accreditation guide:

> "In the Peppol submission method, a copy of the Peppol invoice data is automatically transmitted to IRAS when the Peppol invoice is routed from the supplier to the customer through the InvoiceNow network."

This is operationally a **5-corner DCTCE deployment**: the AP duplicates a structured copy to IRAS via API at the moment of transmission. Vendors such as Pagero, EDICOM and Tickstar are accredited as APs that perform this submission. The mandate timeline is:

| Date | Scope |
|------|-------|
| 1 May 2025 | Soft launch |
| 1 Nov 2025 | Newly incorporated voluntary GST registrants (≤6 months old) |
| 1 Apr 2026 | All new voluntary GST registrants |
| 1 Apr 2028 | New compulsory registrants and existing GST-registered businesses with annual supplies ≤ S$200,000 |
| 1 Apr 2029 | Existing GST-registered businesses with annual supplies ≤ S$1m |
| 1 Apr 2030 | Existing GST-registered businesses with annual supplies ≤ S$4m |
| 1 Apr 2031 | All remaining GST-registered businesses |

The IRAS pattern is *post-audit-light* rather than pre-clearance: the invoice is **not blocked** if not transmitted; the obligation is statutory not technical, and security and integrity rely on the PEPPOL AP layer rather than a digital signature by the taxpayer.

This is the regulatory anchor on which an analytical 5th corner can be layered without a parallel pipeline.

### 2.3 Peer-jurisdiction comparators

| Jurisdiction | Model | Reporting authority | Notes |
|---|---|---|---|
| **Singapore** (current) | DCTCE 5-corner via PEPPOL | IRAS | Real-time copy via API at AP layer |
| **Belgium** | 4-corner B2B from 1 Jan 2026; 5-corner e-reporting from 1 Jan 2028 | FPS Finance | Both APs report a copy or summary |
| **France** | "Y" model: Plateforme Publique de Facturation (PPF) + Plateformes Agréées (PA, formerly PDPs) | DGFiP (also PEPPOL Authority since 2025) | Centralised directory, decentralised exchange |
| **EU (ViDA)** | Cross-border DRR for B2B/B2G from 1 Jul 2030; harmonisation by 2035 | National tax administrations | EN 16931 with structured-format requirement |
| **Australia / New Zealand** | 4-corner; PINT A-NZ since May 2025 | ATO (does *not* receive invoices) | B2G mandatory; B2B voluntary |
| **Japan** | 4-corner; JP PINT; Qualified Invoice System since Oct 2023 | NTA | Tax registration ID required; reporting not mandated |

Singapore's design has thus already overshot the EU norm in CTC scope and is closer to Belgium's 2028 architecture — a useful precedent for analytical extension.

### 2.4 Proposed architecture: the *Federated Analytical Mesh*

The 5th corner is *not* a single endpoint: it is a **logical role** played by analytical service endpoints (ASEs) that sit *adjacent to* — not in the path of — the C1–C4 flow.

```
                     ┌──────────────────────────────────────────┐
                     │     SML (Service Metadata Locator)        │
                     │     SMP (per-AP metadata)                 │
                     │     ASR (Analytical Service Registry)*    │
                     └──────────────────────────────────────────┘
                                       ▲
                                       │ discovery
   ┌───────┐    AS4    ┌─────────┐  AS4   ┌─────────┐    ┌───────┐
   │  C1   │ ────────► │   C2    │ ─────► │   C3    │ ──►│  C4   │
   │Supplier│           │ Sender  │        │Receiver │    │Buyer  │
   │ ERP   │           │   AP    │        │  AP     │    │ ERP   │
   └───────┘           └─────────┘        └─────────┘    └───────┘
                            │                  │
                       (a)  │              (a) │
                            ▼                  ▼
                   ┌──────────────────────────────────┐
                   │  ANALYTICAL SERVICE ENDPOINT     │
                   │  (ASE) — one per AP              │
                   │ ┌────────────┬───────────────┐    │
                   │ │  L1: VC /  │ L3: TEE+MPC/  │    │
                   │ │  SD-JWT    │ PSI primitives│    │
                   │ ├────────────┼───────────────┤    │
                   │ │  L2: FedL  │ ZKP verifier  │    │
                   │ │  + DP      │               │    │
                   │ └────────────┴───────────────┘    │
                   │  Tamper-evident query log (Merkle)│
                   └──────────────────────────────────┘
                            │              │
                  (b) query │              │ (b) query
                            ▼              ▼
                   ┌─────────────────────────────────┐
                   │  C5* — Analytical Consumer       │
                   │  (Bank, IRAS, MAS, enterprise)   │
                   │  with credentialed access policy │
                   └─────────────────────────────────┘
```
*Mermaid-equivalent textual diagram. Flows: (a) invoice persists at C1/C4; ASE indexes/holds derivative cryptographic material only; (b) C5 consumers send queries which are validated, brokered and audited.*

#### 2.4.1 Components

1. **Analytical Service Endpoint (ASE).** A logically distinct module operated by each AP (or by a federation of APs). Holds *no* invoice payloads; instead holds:
   - cryptographic commitments (hashes, Pedersen commitments) of in-scope invoices;
   - VC issuance / verification keys;
   - federated learning local-model parameters;
   - TEE-attested execution runtime for joint queries.
2. **Analytical Service Registry (ASR).** A new sibling to the SMP, listing the analytical services each AP supports (e.g. `urn:peppol:analytics:duplicate-check:1`, `urn:peppol:analytics:fedlearn:fraud:1`, `urn:peppol:analytics:zkp:gst-correctness:1`). Discovered through the same SML DNS root pattern.
3. **Verifiable-Credential Issuer Service (VCIS).** Per AP, issues SD-JWT-VCs or BBS+ credentials over invoice attributes selectively requested by C1 or C4 (e.g. "buyer X has paid Y SGD to supplier Z in last 90 days"). Compatible with W3C VCDM 2.0.
4. **Query Broker.** Translates a consumer's analytical request into a federated execution plan, dispatching sub-queries to the ASEs that hold relevant data. Returns *only the result*, not the underlying data.
5. **Transparency Log.** Append-only Merkle tree (Certificate-Transparency design: Signed Tree Heads, inclusion / consistency proofs, RFC 6962 patterns) recording every query, every consumer credential, every release. Auditable independently by data owners.
6. **C5\* — the Analytical Consumer.** Banks, IRAS, MAS, the data owner itself, or an authorised third-party auditor. Holds verifiable credentials proving its right to query.

#### 2.4.2 Message flows

The original 4-corner flow (AS4 over PEPPOL) is **unchanged**. Analytical flows are:

1. **Issuance flow (synchronous with invoice transmission).** When the AP processes an invoice, it produces a deterministic content hash and a set of signed *attribute attestations* (e.g. invoice ID, total, GST amount, supplier UEN, buyer UEN, issue date) and stores them in its ASE. Optionally, a VC is pre-prepared for the supplier and the buyer (the data owners).
2. **Consent / disclosure flow.** A data owner (C1 or C4) can release a VC to a third party (bank, auditor) using a holder-binding key. The third party verifies it without contacting the issuer (offline-verifiable via SD-JWT).
3. **Query flow.** A C5* consumer with appropriate ABAC / VC credentials submits a query via the Query Broker. The broker validates eligibility against a policy engine, dispatches to ASEs, executes (federated, TEE, MPC, ZKP, or DP-aggregate as appropriate), and returns the result. Every step is logged in the transparency log; the data owner can fetch an inclusion proof of every query touching its data.
4. **Cross-AP federation flow.** Where a query requires data spanning APs (e.g. duplicate-finance check), the brokers exchange cryptographic protocol messages (PSI, threshold-MPC) without ever colocating raw invoices.

#### 2.4.3 Data residency model

- **No central data lake.** Hard constraint preserved.
- Invoice payloads live at C1 and C4 inside InvoiceNow-Ready Solutions or AP-managed mailboxes (consistent with InvoiceNow FAQ: "sent e-invoices cannot be retrieved … the network functions similarly to email").
- ASEs store only:
  - cryptographic commitments, Bloom filters, indexes;
  - signed attestations / VCs;
  - model gradients (FL) — never training data;
  - audit log entries.
- Data is logically owned by C1 and C4. APs hold *delegated custodianship* under the existing PEPPOL Service Provider Agreement, extended by a new *Analytical Services Annex* under IMDA accreditation.

#### 2.4.4 Governance

The PEPPOL Infrastructure Specialist's lens demands backwards-compatibility with OpenPeppol's Peppol Interoperability Framework (PIF). The proposed governance is:

- **IMDA** — Authority for Singapore (already PEPPOL Authority since May 2018); accredits ASE operators in the same way it accredits APs and IRSPs.
- **OpenPeppol** — extends PIF to recognise an *Analytical Services Profile* (parallel to the Post-Award Coordinating Community for billing).
- **MAS / IRAS** — issue sectoral codes for use cases A and B. MAS's COSMIC precedent (FI-to-FI sharing platform under the Financial Services and Markets Act 2022) provides a regulatory template.
- **Data owners (C1/C4)** — retain opt-in control and can revoke any VC credential through the VCIS.
- A **Federated Operating Council** of accredited ASE operators (similar in spirit to the Guardian Wholesale Network under MAS Project Guardian) governs day-to-day cross-ASE protocol updates and dispute resolution.

---

## 3. Privacy Enhancing Technologies — Evaluation Applied to PEPPOL Analytics

The Security & Privacy Architect lens applies a uniform analytical frame to each PET: **maturity (TRL)**, **performance**, **trust model**, **threat coverage**, **regulatory acceptance** and **applicability to use cases A, B, C**. PETs are evaluated *in parallel* with the pragmatic alternatives in §4.

### 3.1 Zero-Knowledge Proofs (ZKPs)

| Variant | Proof size | Setup | Prover cost | Verify cost | Maturity |
|---|---|---|---|---|---|
| zk-SNARK (Groth16) | smallest (~200 bytes) | trusted (per-circuit) | medium | very fast | High; production in Zcash, Polygon |
| zk-STARK | largest (~100 KB) | transparent | fastest in benchmarks | fast | Medium-High; production at StarkNet |
| Bulletproofs | medium (range proofs) | transparent | slow | slow | Medium; production in Monero range proofs |

**Concrete PEPPOL applications:**
- **Range proof on receivables.** A supplier proves to a financier that *Σ unpaid_invoices > S$100,000* using Bulletproofs over committed values, without revealing line items. Mathematically, given Pedersen commitments $C_i = g^{x_i} h^{r_i}$ for invoice values $x_i$, the supplier proves $\sum x_i > T$ in zero-knowledge.
- **Duplicate-invoice ZKP.** A supplier proves to bank B that the same invoice ID has not been previously presented to bank A's financing facility, without revealing bank A's identity, by membership proof against a public ZKP-friendly accumulator.
- **GST correctness ZKP.** Supplier proves $\text{GST\_total} = 0.09 \times \text{taxable\_subtotal}$ for an invoice without revealing line items — directly applicable to IRAS's audit role.

IBM has demonstrated this exact pattern: ZKPs allowing invoice owners to prove tax-compliance without revealing field values.

**Limitations:** Trusted-setup risk for SNARKs (mitigated by ceremonies); circuit authoring is specialist; verification on the receiver must be embedded in AP-level software.
**Soundness** is a mathematical guarantee parameterised by $\lambda$ (security parameter, typically 128 bits): the probability of a malicious prover convincing a verifier of a false statement is bounded by $2^{-\lambda}$.

**Use-case fit:** A — **High** (financing decisions); B — **High** (audit attestations); C — Medium.

### 3.2 Secure Multi-Party Computation (MPC)

The seminal paper *"Privacy-Preserving Methods for Sharing Financial Risk Exposures"* (Abbe, Khandani & Lo) demonstrates that banks can compute aggregate concentration indices, pairwise correlations and other risk metrics over distributed data using secret-sharing-based MPC, without revealing individual positions. Danish banks have run a production MPC-based agricultural-credit benchmarking system (SPDZ protocol) since 2016.

**PEPPOL applications:**
- Cross-bank computation of *aggregate exposure to supplier X* without any bank revealing its own exposure.
- Joint sanctions screening across APs.
- Industry-wide receivables benchmarks (mean / median DSO by sector).

**Trust model:** No trusted third party required (with t-out-of-n security); honest-majority or covert-security thresholds must be set explicitly.
**Performance:** SPDZ-style protocols achieve thousands of multiplications per second; adequate for batch analytics, marginal for real-time financing decisions on large invoice corpora.
**Maturity:** TRL 8 (production deployments at Danish banks, Estonia tax fraud detection by Sharemind, Boston Women's Workforce Council pay-equity studies).
**Use-case fit:** A — **High**; B — Medium-High; C — Medium.

### 3.3 Fully / Somewhat Homomorphic Encryption (FHE / SHE)

FHE allows arbitrary computation on encrypted data. The 2024 FHEBench and Cross-Platform Benchmarking studies of SEAL/OpenFHE/Lattigo show:
- Latency overheads of $10^3$–$10^5\times$ over plaintext for arithmetic operations.
- Recent AI-accelerator adaptations (TPU reuse, GPU offload) deliver order-of-magnitude improvements.
- A Singapore-relevant 2018 paper on cloud-based privacy-preserving benchmarking with HE shows feasibility for KPI comparison using mean, variance, median, and quartile statistics.

**PEPPOL applications:** Encrypted invoice totals can be aggregated into sector indices; encrypted credit scoring across institutions.
**Trust model:** Strong — only the key holder can decrypt; computation host learns nothing.
**Limitations:** Performance still excludes most real-time financing pathways; bandwidth bloat (ciphertext expansion ~1000×).
**Maturity:** TRL 6–7 in finance; Inpher, Zama, Duality have commercial offerings; standardisation under HomomorphicEncryption.org.
**Use-case fit:** A — Medium (offline batch); B — Medium (audit aggregates); C — **High** (encrypted benchmarks for self-service).

### 3.4 Federated Learning (FL) / Federated Analytics

FL is the most mature collaborative-AI PET with direct PEPPOL relevance. Singapore-relevant precedents:
- **J.P. Morgan / BNY / RBC / DeepTempo / NVIDIA federated fraud-detection PoC** (2025) used NVIDIA FLARE on DGX Cloud with differential privacy. Demonstrated that "Type 1" location-based fraud patterns invisible in single-bank datasets become detectable after federated training.
- **Project AIKYA** (J.P. Morgan + BNY) — open-source FL anomaly-detection PoC; Apache 2.0-licensed.
- Vertical FL handles cases where banks share customers but hold different feature sets; Horizontal FL handles cases of disjoint customer bases with shared features.

**PEPPOL application:** Each ASE trains a local credit-risk / fraud-detection / DSO-prediction model on its corner's invoice corpus; gradients are aggregated centrally (with secure aggregation) or peer-to-peer; raw invoices never leave the corner.
**Trust model:** With secure aggregation + DP, even the aggregator learns nothing about individual gradients.
**Maturity:** TRL 8; production at Google, Apple, NVIDIA-FLARE adopters.
**Use-case fit:** A — **High**; B — Medium-High (audit-pattern detection); C — Medium.

### 3.5 Differential Privacy (DP)

Formal $(\varepsilon, \delta)$-DP guarantees that the inclusion or exclusion of any single record changes the output distribution by at most a multiplicative $e^\varepsilon$ factor with additive slack $\delta$:

$$\Pr[\mathcal{M}(D) \in S] \leq e^{\varepsilon} \Pr[\mathcal{M}(D') \in S] + \delta$$

**PEPPOL applications:**
- Public release of sectoral aggregates (mean DSO by SSIC code) at $\varepsilon = 1$.
- Validation server for IRAS-style audit queries — Urban Institute / US Census patterns are directly transferable.
- DP-enhanced FL gradient updates (typically $\varepsilon = 4$–$8$ at the model level).

**Trade-off:** The privacy budget $\varepsilon$ is *consumed* by each query; a finite budget must be apportioned across the lifetime of the system.
**Maturity:** TRL 9; deployed at US Census Bureau (2020 Decennial), IRS (synthetic tax data exploration), Apple, Google.
**Use-case fit:** A — Medium (aggregate benchmarks only); B — **High**; C — **High**.

### 3.6 Trusted Execution Environments (TEEs) / Confidential Computing

Hardware-rooted enclaves (Intel SGX/TDX, AMD SEV-SNP, AWS Nitro Enclaves, Azure Confidential VMs, GCP Confidential Space, ARM CCA) enable code to run in attestation-verifiable isolation from the OS/hypervisor/cloud operator. The MonetaGo / ABS Trade Finance Registry already deploys an enclave architecture for duplicate-financing detection in Singapore — a direct Singapore precedent.

**PEPPOL application:** ASEs run analytical workloads inside enclaves; remote attestation lets data owners verify the exact code processing their data.
**Trust model:** Hardware vendor + attestation chain. Side-channel attacks (Foreshadow, MDS) remain a residual risk; mitigated by latest-generation hardware and microcode.
**Maturity:** TRL 9 in cloud (Azure, AWS, GCP); deployed at Singapore-relevant banks.
**Use-case fit:** A — **High**; B — **High**; C — Medium.

### 3.7 Private Set Intersection (PSI)

PSI lets two parties learn the intersection of their sets (or only the size, or aggregate functions over the intersection) without revealing non-intersecting elements.

**PEPPOL applications:**
- KYB matching against MAS sanctions / UN designated lists.
- Cross-bank duplicate-finance check (intersection of invoice IDs) — direct functional analogue to MonetaGo's hash registry, but with stronger cryptographic guarantees (the registry currently uses hashed fingerprints; a true PSI upgrade would prevent the registry operator from learning queries).
- COSMIC-style cross-FI customer red-flag matching with formal privacy guarantees.

**Maturity:** TRL 8 (Google Password Checkup, Apple PSI deployment, Meta deploy in advertising).
**Use-case fit:** A — **High**; B — Medium; C — Low.

### 3.8 Synthetic Data Generation

GAN-based and statistical-model-based synthetic invoice generation (with DP-bounded guarantees, e.g. DataSynthesizer) is useful for: training fraud-detection ML models, sandbox testing of IRSP solutions, regulatory tabletop exercises. The Provectus 2021 work and 2025 layout-preserving content-replacement methods are directly applicable to PEPPOL UBL invoices.

**Use-case fit:** A — Medium; B — Low (limited audit value); C — **High** (model training).

### 3.9 Selective Disclosure / Verifiable Credentials

W3C VCDM 2.0, SD-JWT-VC (IETF draft-ietf-oauth-sd-jwt-vc), BBS+ signatures (and the newer `bbs-2023` and `ecdsa-sd-2023` cryptosuites), and ISO mDL-style mdoc constitute the most production-ready PET pattern for invoice-level attestation. EBSI in the EU, IOTA Identity, and Curity production deployments demonstrate maturity. **TradeTrust** itself uses W3C VCs over OpenAttestation as its issuance fabric — directly relevant to Singapore.

**PEPPOL application:**
- AP issues SD-JWT-VC over an invoice's attributes (UEN, total, GST, due date).
- Supplier *holds* the VC and presents only the fields a financier needs (e.g. "amount > 50,000 SGD AND due ≤ 60 days").
- Financier verifies offline against AP's public key.

**Maturity:** TRL 8–9 (eIDAS 2.0, EU Digital Identity Wallet).
**Use-case fit:** A — **Very High**; B — **High** (auditor-presentable evidence); C — Medium.

### 3.10 Comparison table

| PET | TRL | Latency overhead | Trust model | Threat coverage | Regulatory acceptance (SG) | Use case A | Use case B | Use case C |
|---|---|---|---|---|---|---|---|---|
| zk-SNARK | 8 | Low verify, high prove | None (trusted setup) | Strong soundness | Emerging | High | High | Medium |
| zk-STARK | 7 | Medium | None (transparent) | Strong, post-quantum | Emerging | High | High | Medium |
| Bulletproof | 7 | Low | None | Strong | Emerging | High | Medium | Low |
| MPC (SPDZ) | 8 | Medium-High | Honest majority | Strong | High (Sharemind precedent) | High | High | Medium |
| FHE | 6–7 | Very High | None (key holder) | Very strong | Medium | Medium | Medium | High |
| Federated Learning | 8 | Low (per round) | Aggregator-trusted | Medium (gradient leakage); strong with DP+secure agg | High (MAS precedents) | High | High | Medium |
| Differential Privacy | 9 | Negligible | None (statistical) | Formal $\varepsilon$-bound | High (Census/IRS) | Medium | High | High |
| TEE | 9 | Low | Hardware vendor | Strong (modulo side-channel) | High (MonetaGo TFR) | High | High | Medium |
| PSI | 8 | Low-Medium | None | Strong | High (COSMIC analogues) | High | Medium | Low |
| Synthetic Data | 7 | N/A | Model-dependent | Privacy varies | Medium | Medium | Low | High |
| VC / SD-JWT / BBS+ | 9 | Negligible | Issuer-trusted | Strong selective-disclosure | High (TradeTrust precedent) | Very High | High | Medium |

---

## 4. Alternative Solutions and Trust Analysis

### 4.1 Pragmatic alternatives evaluated *in parallel*

The Compliance Auditor lens explicitly resists the "PETs-first / pragmatism-as-fallback" framing. The following non-PET (or PET-adjacent) alternatives are evaluated on equal footing.

#### 4.1.1 Policy-based access control with cryptographic audit trails

- **OAuth 2.0** is the operational baseline. **GNAP** (RFC 9635, Oct 2024) is the next-generation delegation protocol, more flexible than OAuth 2.0 in fine-grained authorisation, multi-party flows and resource-server interaction.
- **Attribute-Based Access Control (ABAC)** allows policies expressed over attributes of subject, action, resource and context (e.g. "MAS auditors may query duplicate-finance flag on invoices ≥ S$1m issued in past 90 days").
- **Tamper-evident logs** (Certificate Transparency / Sigstore Rekor / Trillian / Google's Key Transparency) provide append-only Merkle-tree audit logs; inclusion proofs allow data owners to verify their data was queried as claimed, without trusting the log operator.

This **policy-plus-audit pattern** is the *substrate* of the proposed mesh — not a fallback. It addresses Use Cases A/B/C uniformly when combined with PETs.

#### 4.1.2 Data clean rooms

Snowflake Data Clean Rooms, AWS Clean Rooms, Decentriq, Habu, InfoSum, Databricks Clean Rooms are mature in advertising and increasingly in finance. **However:** policy-based clean rooms require centralisation of data into a shared environment, breaching the explicit "no centralised data storage" constraint. Hardware-based clean rooms (Decentriq's confidential-computing model) preserve the constraint but in practice require data ingress.

**Verdict:** Useful as a *primitive within an ASE*, not as a system-level architecture.

#### 4.1.3 Confidential computing as a service

Azure Confidential Computing, GCP Confidential Space, AWS Nitro Enclaves provide infrastructure for ASEs. They are not a replacement architecture but a deployment substrate for PET workloads.

#### 4.1.4 DLT-anchored notarisation (proofs only)

The TradeTrust pattern — anchoring document hashes and ETR ownership transfers on Ethereum, Polygon or XDC blockchains via NFTs and W3C VCs — provides a tamper-evident global notarisation layer **without** centralising documents. SGTraDex similarly operates as a *data highway* (not a repository), routing data via APIs while retaining custodianship at source.

For the 5th corner: a **hash-only DLT anchor** can record:
- Merkle roots of ASE transparency logs (recurring snapshot, Belgium-precedent-style);
- VC issuance / revocation events;
- accumulator updates for duplicate-finance detection.

This is technology-agnostic at the chain level (XDC, Polygon, Ethereum, Hyperledger Besu, even private R3 Corda variants).

#### 4.1.5 Verifiable Credentials / Decentralised Identifiers (agnostic patterns)

W3C VCDM 2.0, SD-JWT-VC, mdoc/mDL — already evaluated as a PET in §3.9. Treated here as the cross-cutting binding layer between data owners, APs and consumers.

#### 4.1.6 API-mediated query layers

Push-down query frameworks where queries (not data) move (e.g. Trino federated queries, GraphQL with policy enforcement, OData with row-level security). This is the *Query Broker* component of the proposed mesh.

#### 4.1.7 Hybrid models

The recommended architecture *is* a hybrid. The mesh combines: ABAC + GNAP (access control), VCs (data-owner consent), TEEs (execution), FL+DP (training), PSI (intersection), ZKP (attestation), Merkle logs (audit), DLT anchors (global notarisation).

### 4.2 Data-owner trust and confidence metrics

The Compliance Auditor lens insists that "data-owner trust" be made measurable. Six metrics:

| Metric | Definition | Measurement |
|---|---|---|
| **Cryptographic verifiability** | Can the owner mathematically verify the analytical result without trusting the operator? | Binary; gradations by which PETs are layered |
| **Revocation rights** | Can the owner revoke previously granted credentials/access? | Time-to-revoke (median, max) |
| **Query transparency** | Can the owner enumerate every query that touched its data? | % of queries logged with inclusion proofs |
| **Jurisdictional sovereignty** | Does data remain under SG legal jurisdiction (PDPA, Banking Act)? | % of data processed within SG-domiciled ASEs |
| **Opt-in granularity** | Can the owner consent at attribute / use-case / counterparty level? | Number of distinct consent dimensions |
| **Auditor independence** | Can a third-party audit verify all of the above without operator cooperation? | Yes/No |

### 4.3 Decision matrix — candidate architectures vs trust metrics

Five candidate architectures (synthesising §5 expert proposals):

| Architecture | Crypto verifiability | Revocation | Query transparency | Jurisdictional sovereignty | Opt-in granularity | Auditor independence |
|---|---|---|---|---|---|---|
| A. Centralised analytical warehouse (excluded by constraint) | Low | Low | Medium | Low | Low | Low |
| B. **Federated Analytical Mesh (recommended)** | High | High | Very High | High | High | High |
| C. Pure DLT-notarisation (proofs only) | Very High | Medium | High | High | Medium | High |
| D. Confidential-Compute Hub (single TEE cluster) | Medium-High | Medium | High | Medium | Medium | Medium |
| E. AP-aggregator commercial product | Low-Medium | Low | Medium | Medium | Low | Low |

### 4.4 Governance-model alternatives

| Model | Operator | Pros | Cons | Singapore precedent |
|---|---|---|---|---|
| OpenPeppol-style consortium | Multi-stakeholder PEPPOL Authorities | Backwards-compatible, neutral | Slow consensus | OpenPeppol PIF |
| IMDA-operated central node | Government | Strong trust, alignment with InvoiceNow | Single point of failure / capture risk | IRAS GST 5th-corner |
| Market-based AP-aggregator | Commercial ASE operators | Speed, innovation | Commercial conflicts, unequal access | EDICOM, Pagero |
| Federated peer-to-peer | All accredited APs cooperatively | Maximum decentralisation | Operational complexity | SGTraDex, ABS TFR |

The **recommended governance** is **federated peer-to-peer with IMDA accreditation**, mirroring the InvoiceNow AP accreditation regime: each AP can operate an ASE under IMDA-issued accreditation; cross-AP coordination via OpenPeppol-affiliated standards body; sectoral oversight by IRAS (use case B) and MAS (use case A).

---

## 5. Tree-of-Thoughts Appendix

This section preserves the GENERATE → EVALUATE → BRANCH → ITERATE → SYNTHESIZE protocol with the three experts' reasoning traces.

### 5.1 GENERATE — nine candidate paths

| ID | Author | Path | Sketch |
|---|---|---|---|
| **S1** | Security/Privacy Architect | ZKP-First Mesh | Each AP issues ZKPs over invoice attributes; consumers verify proofs; no MPC, no FL |
| **S2** | Security/Privacy Architect | FHE-Centric Encrypted Mart | Encrypted invoice attributes pooled to a logical analytical store; computation performed on ciphertexts |
| **S3** | Security/Privacy Architect | Federated Mesh with FL+DP+TEE | ASEs run TEEs; FL with DP; PSI for intersections; ZKPs as needed |
| **P1** | PEPPOL Specialist | "PINT-Analytics" extension | New OpenPeppol document profile for analytical query messages alongside billing messages; AS4 carries queries |
| **P2** | PEPPOL Specialist | DCTCE++ — analytical extension of GST-style 5th corner to additional consumers | IRAS-pattern replicated for MAS, banks, with policy-only access controls |
| **P3** | PEPPOL Specialist | Augmented SMP with capability tags | SMP carries analytical-service metadata; query routing via existing PEPPOL discovery; thin extension |
| **C1** | Compliance Auditor | DLT-Anchored Audit Spine | All consents, queries and disclosures notarised on a public DLT (XDC/Polygon); data unchanged at corners |
| **C2** | Compliance Auditor | Verifiable-Credential Disclosure Network | All analytical interactions mediated by VC presentations; auditor independence built-in |
| **C3** | Compliance Auditor | Regulator-Operated Validation Server | IMDA/IRAS-run DP validation server (US Census model) for aggregate queries |

### 5.2 EVALUATE — first scoring cycle

Scores out of 10 on Relevance, Novelty, Impact (against the constraints).

| Path | Relevance | Novelty | Impact | Total | Critique |
|---|---|---|---|---|---|
| S1 | 8 | 9 | 7 | 24 | Strong cryptographic guarantees but ZKPs alone do not solve cross-bank computations (e.g. aggregate exposure) |
| S2 | 5 | 9 | 5 | 19 | FHE performance still prohibitive for real-time financing; centralisation pressure latent |
| **S3** | 9 | 8 | 9 | **26** | Combines mature PETs; MAS COSMIC, J.P. Morgan AIKYA precedents |
| P1 | 7 | 7 | 6 | 20 | Cleanly PEPPOL-native but adds AS4 traffic; not aligned with the "data stays at corners" principle when queries cross APs |
| P2 | 8 | 4 | 7 | 19 | Path of least resistance but inherits the centralisation problem of clearance-CTC models |
| **P3** | 9 | 7 | 8 | **24** | Minimal-change extension; reuses SMP pattern; backwards-compatible |
| C1 | 7 | 8 | 7 | 22 | Strong audit story but DLT alone does not enable analytics |
| **C2** | 9 | 8 | 9 | **26** | Strong on data-owner trust; mature standards (W3C VCDM 2.0); TradeTrust precedent |
| C3 | 6 | 5 | 6 | 17 | Centralised; mismatched to bank use cases; OK for IRAS |

**Top two paths:** S3 (Federated Mesh w/ FL+DP+TEE) and C2 (VC-Disclosure Network), with P3 (Augmented SMP) as the routing/discovery substrate they share.

### 5.3 BRANCH — sub-branches of the top paths

**Branch B-1: Hybrid mesh (S3 ⊕ C2 ⊕ P3 substrate)**
- B-1.a: Mandatory VC issuance at every AP for every invoice; PETs (FL/MPC/TEE) layered for cross-AP queries.
- B-1.b: Optional VC issuance on-demand; PETs as primary mechanism.
- B-1.c: VCs only for KYB; PETs only for analytics; hard separation.

**Branch B-2: Pure-S3 deepening**
- B-2.a: TEE-only mesh — every analytical operation runs in attested enclaves; FL is optional.
- B-2.b: MPC-only mesh — no TEEs (avoids hardware-vendor trust); slower but pure-software.
- B-2.c: FL+DP-only — focus on model training; no per-query PETs.

**Branch B-3: Pure-C2 deepening**
- B-3.a: VC + DLT anchoring of all events (TradeTrust-aligned).
- B-3.b: VC + pure transparency-log anchoring (Sigstore-aligned).
- B-3.c: VC + selective DLT anchoring of irrevocable consents only.

### 5.4 ITERATE — second-cycle scoring

Second-pass scores incorporate **Data-Owner Trust (DOT)** and **Technical Feasibility (TF)** explicitly.

| Sub-branch | Relevance | Novelty | Impact | DOT | TF | Total | Critique |
|---|---|---|---|---|---|---|---|
| **B-1.a** | 9 | 8 | 9 | 9 | 7 | **42** | All-in approach; high implementation cost but maximum privacy + auditability |
| B-1.b | 8 | 7 | 7 | 7 | 8 | 37 | Lighter VC adoption; lower trust |
| B-1.c | 7 | 6 | 7 | 7 | 8 | 35 | Bifurcation harms unified governance |
| B-2.a | 8 | 7 | 8 | 7 | 9 | 39 | Hardware-vendor trust dependency |
| B-2.b | 7 | 7 | 6 | 9 | 5 | 34 | MPC-only is too slow for real-time financing |
| B-2.c | 7 | 6 | 7 | 6 | 9 | 35 | Insufficient for per-query needs |
| B-3.a | 8 | 8 | 7 | 9 | 7 | 39 | Strong audit but limited analytics |
| B-3.b | 8 | 7 | 6 | 9 | 8 | 38 | Less novel than B-3.a |
| B-3.c | 7 | 6 | 6 | 8 | 9 | 36 | Conservative |

### 5.5 SYNTHESIZE — convergence

The optimal architectural path is **B-1.a — Federated Analytical Mesh with mandatory VC issuance and selective ZKP/MPC/FL/TEE composition** — exactly the architecture described in §2.4. The synthesis observations:

1. **Backwards compatibility (PEPPOL Specialist).** Achieved by layering ASEs *adjacent* to APs, extending SMP with analytical-service tags, preserving AS4/PINT-SG exchange unchanged.
2. **Cryptographic guarantees (Security/Privacy Architect).** Achieved by VCs at the binding layer, TEEs at the execution layer, FL+DP for training, PSI/MPC for intersections, ZKPs for high-assurance attestations.
3. **Auditability and data-owner trust (Compliance Auditor).** Achieved by transparency logs (per-ASE), DLT anchoring of Merkle roots, GNAP-mediated access control with revocation, and the auditor-independence property of VCs.

Crucially, the three lenses converged because the architecture lets each lens dominate in its zone: cryptography in computation, PEPPOL conventions in routing, audit primitives in governance — **without one subsuming the others**.

---

## 6. Implementation Roadmap

Aligned to the GST InvoiceNow Requirement timeline.

### Phase 0 — Foundations (now → end-2026)

- **Standards work:** OpenPeppol Analytical Services Profile draft; ASR (Analytical Service Registry) extension to SMP; URN scheme `urn:peppol:analytics:*`.
- **Singapore-specific:** IMDA *Analytical Services Annex* to AP accreditation; PDPC guidance update for ASE operators (extending the Trusted Data Sharing Framework).
- **Pilot 0.1 — Verifiable Credentials for invoice financing:** Two banks + two APs + ten suppliers. AP issues SD-JWT-VCs over invoice-total, GST, due-date. Suppliers present to banks. Builds on TradeTrust legal framework and W3C VCDM 2.0.
- **Pilot 0.2 — Duplicate-finance PSI uplift:** Augment the MonetaGo / ABS Trade Finance Registry with a PSI-based confirmation layer. Reduces information leakage to the registry operator.

### Phase 1 — Pilot (2027)

- **Pilot 1.1 — Federated fraud-detection sandbox** (use case A). Following the J.P. Morgan / NVIDIA FLARE pattern, three Singapore banks federate FL training on PEPPOL-routed invoice features. DP at $\varepsilon \leq 8$ at model level. MAS Project Moonshot (post-quantum cryptography readiness) collaboration on key material.
- **Pilot 1.2 — IRAS analytical extension** (use case B). DP-based validation server allowing IRAS analysts to run aggregate queries across the existing GST 5th-corner data without de-anonymising taxpayers; aligns with US IRS / Census Bureau patterns.
- **Pilot 1.3 — Self-service benchmarking** (use case C). HE-based sectoral DSO benchmarks released to enterprises with $\varepsilon$-bounded noise.

### Phase 2 — Limited production (2028)

- Coincides with the GST InvoiceNow extension to all new compulsory registrants and small existing GST-registered businesses (1 Apr 2028).
- Activate ASR discovery in production SML.
- Onboard banks (DBS, OCBC, UOB, StanChart, Citibank, HSBC — same cohort as COSMIC) as C5\* consumers under MAS-issued credentials.
- Activate transparency-log inclusion-proof retrieval for data owners via InvoiceNow-Ready Solutions.

### Phase 3 — Full production (2029–2031)

- Synchronise with mandatory rollout to existing GST-registered businesses with annual supplies ≤ S$4m (1 Apr 2030) and the residual cohort (1 Apr 2031).
- Extend ASE accreditation to international APs operating in Singapore.
- Cross-border interoperability trials with Belgium (post-2028 5-corner), France (post-2026 PA model), Australia/NZ (PINT A-NZ) and Japan (JP PINT) — building on the SGTraDex / TradeTrust / IMDA-DGFiP cooperation precedent.
- Post-quantum migration aligned with MAS / Banque de France findings (hybrid PQC algorithms for AS4 transport and ZKP signature schemes).

### Quantitative milestones

- 2026 Q4: VC issuance live at ≥ 5 APs; ≥ 10,000 invoices with VC attestations.
- 2027 Q4: FL fraud sandbox showing ≥ 15% improvement in Type-1 fraud detection vs single-bank baseline (J.P. Morgan PoC reported similar gains).
- 2028 Q4: ASR discovery deployed across all IMDA-accredited APs.
- 2031 Q2: Full mesh covering 100% of GST-registered businesses (≈ 90,000 firms based on IRAS COS 2026 projections).

---

## 7. Open Risks and Research Gaps

1. **Composability of PETs.** Composing ZKP + MPC + TEE + FL + DP introduces analytical-budget accounting challenges. The privacy-budget composition theorem $\sum \varepsilon_i$ degrades with each query; setting per-query, per-consumer, per-data-owner budgets is unsolved at the scale of 90,000 enterprises × multiple consumers × continuous queries.
2. **Side-channel risk in TEEs.** Foreshadow, MDS and ÆPIC attacks on Intel SGX, and Hertzbleed-class issues, remain partially unmitigated. AMD SEV-SNP and AWS Nitro have different exposure profiles. The MonetaGo TFR's reliance on confidential computing is a precedent but not a guarantee.
3. **Post-quantum readiness of ZKPs.** zk-SNARKs based on pairings (BLS12-381) are not post-quantum secure; zk-STARKs are. Migration path under MAS / Banque de France PQC initiative is open.
4. **Cross-jurisdictional VC trust anchoring.** A VC issued by an SG AP and consumed by an EU buyer must be verifiable under both PDPA and GDPR. EBSI's *Trust Anchor* model and the EU Digital Identity Wallet provide patterns but no formalised SG-EU bridge exists yet.
5. **Banking secrecy vs auditability tension.** Section 47 of the Singapore Banking Act constrains the disclosure of customer information. ZKP-based "yes/no" attestations to non-bank parties may avoid Section 47, but the legal interpretation is not settled. MAS Project Guardian's "compliance by design" / Global Layer One initiative may inform a regulatory-interpretation safe harbour.
6. **Cross-border data flow under PDPA Section 26.** Outbound transfers to APs domiciled abroad need legally-enforceable obligations (binding corporate rules, ASEAN MCCs, APEC CBPR). Whether ZKP-based proofs over personal data constitute "transfer" of personal data is an unresolved PDPC question.
7. **Operational economics.** The MonetaGo/TFR experience showed that *adoption* (not technology) is the binding constraint: low submission rates limit duplicate-finance detection. Network-effects modelling for the 5th corner has not been done.
8. **Conflict between the InvoiceNow "email-like" design tenet and analytical retrieval.** IMDA's stated principle is that "sent e-invoices cannot be retrieved" — yet a VC issued by an AP requires the AP to retain at least the issued attribute set. Reconciliation requires explicit data-retention policies negotiated between APs and data owners under the Trusted Data Sharing Framework.
9. **Synthetic data realism vs leakage.** Layout-preserving synthetic invoices may inadvertently encode real-distribution signals; without DP-bounded generators, leakage is plausible.
10. **Standards lag.** SD-JWT-VC (draft-ietf-oauth-sd-jwt-vc-16, April 2026) is still IETF draft; W3C VCDM 2.0 is recently standardised. Production adoption at scale presumes standards stability that is only partially achieved.
11. **OpenPeppol analytical-profile governance.** No precedent exists for OpenPeppol governing analytical (as opposed to billing/procurement) profiles. The Belgium 5-corner reporting layer is the closest analogue but is narrowly tax-scoped.
12. **MAS COSMIC interaction.** Whether COSMIC-shared red-flag information may be exposed to invoice-financing PSI queries (and whether such exposure constitutes a re-identification risk) is unaddressed in current MAS Notice 626 / FSM-N02 guidance.

These twelve gaps define the research agenda for 2026–2031. They do not invalidate the recommended architecture; rather, they delineate where formal verification, regulatory dialogue, and continued empirical study are required to move from architectural intent to production reality.

---

*End of report.*