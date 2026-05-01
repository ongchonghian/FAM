export interface JourneyItem { num: string; label: string }
export interface StepBusiness { title: string; narrative: string; privacy: string }
export interface Step {
  title: string
  duration: string
  actors: string[]
  narrative: string
  privacy: string
  business?: StepBusiness
  active: string[]
  flows: string[]
  payloadLabel: string
  payloadTag: string
  payload: string
}
export interface Scenario {
  title: string
  sub: string
  consumer: { id: string; label: string; sub: string }
  cohort: { id: string; label: string; sub: string }[]
  owner: { id: string; label: string }
  aseLabels: Record<string, string>
  journey: JourneyItem[]
  steps: Step[]
}

// ── Shared payload HTML tokens ────────────────────────────────────────────────
const k = (s: string) => `<span class="k">${s}</span>`
const sv = (s: string) => `<span class="s">${s}</span>`
const n = (s: string) => `<span class="n">${s}</span>`
const c = (s: string) => `<span class="c">${s}</span>`
const b = (s: string) => `<span class="b">${s}</span>`

export const scenarios: Record<string, Scenario> = {
  A: {
    title: 'Acme Pte Ltd applies for S$200K supply-chain financing',
    sub: "A worked walk-through of how the federated mesh underwrites a supplier's working-capital request — without revealing a single invoice line-item, buyer identity or commercial term to the lender.",
    consumer: { id: 'n-c5', label: 'DBS Bank', sub: 'Use Case A consumer' },
    cohort: [
      { id: 'n-c5b', label: 'OCBC', sub: 'cohort member' },
      { id: 'n-c5c', label: 'UOB',  sub: 'cohort member' },
    ],
    owner: { id: 'n-owner', label: 'Acme (data owner)' },
    aseLabels: {
      'n-ase-2': { sublabel: "at OCBC's AP" },
      'n-ase-3': { sublabel: "at DBS's AP" },
      'n-ase-4': { sublabel: "at UOB's AP" },
      'n-ase-5': { sublabel: 'at AP-X (buyer side)' },
    } as unknown as Record<string, string>,
    journey: [
      { num: '47',   label: "invoices forwarded to IR · 47 SD-JWT VCs" },
      { num: '0',    label: 'line items disclosed to DBS' },
      { num: '~3.4 s', label: 'end-to-end PSI + verification' },
      { num: '12',   label: 'banks queried via mesh PSI' },
    ],
    steps: [
      {
        title: 'Step 0 — Acme org admin signs a Consent Manifest in admin-ui',
        duration: 'one-off · before any query',
        actors: ['Acme org admin (via admin-ui)', 'admin-corev2', 'ASE-IR'],
        narrative: "Before DBS can ask any question of the mesh, Acme's <em>org admin</em> — not a day-to-day operator — logs into <strong>admin-ui</strong> and uses its new <em>Consent Manifest Manager</em> to compose and sign a Consent Manifest. The manifest names IR as the Data Provider holding Acme's <code>sales_invoice</code> DataElements, and lists DBS as a permitted Consumer for two query classes: ZKP range-proof (receivables totals) and PSI duplicate-check (collateral checks). ε-budget 1.0 over 30 days, with expiry. Holder-key signing happens in the admin-ui browser session. The signed manifest is persisted in <strong>admin-corev2</strong> as the authoritative consent registry and propagated to <strong>ASE-IR</strong> for its independent local copy.",
        privacy: 'No invoice data exists yet. The manifest carries only identifiers, query-class enumerations, and the ε-budget. The signing surface is admin-ui (governance authority), not pitstop-ui (operational view). Revocation propagates via Status List 2021 within ≤ 60 s.',
        business: {
          title: "Step 0 — Acme's org admin signs a digital permission slip",
          narrative: "Before any bank can ask the network anything about Acme's invoices, an org admin at Acme — someone with authority over the company's data posture — opens the admin portal and uses a wizard to sign a structured permission slip. The slip names the Invoice Repository as the place Acme's invoice data lives, and names DBS as a bank that may ask two specific kinds of questions. The slip sets a privacy budget and an expiry.",
          privacy: "Acme sets the rules upfront. The signing happens in the governance portal, not the operational one. No bank can step outside the named question types or exhaust more than the agreed budget; revocation is a one-click action that propagates within a minute.",
        },
        active: ['n-c1', 'n-owner', 'n-admin-ui', 'n-admin-core', 'n-ase-ir'],
        flows: ['f-c1-dex', 'f-ir-dex'],
        payloadLabel: 'Consent Manifest VC (signed in admin-ui by data-owner holder key)',
        payloadTag: 'persisted in admin-corev2 · distributed to ASE-IR',
        payload: `{
  ${k('"type"')}: ${sv('"ConsentManifest"')},
  ${k('"issuer"')}: ${sv('"did:ethr:0x..."')},
  ${k('"validFrom"')}: ${sv('"2026-04-29T00:00:00Z"')},
  ${k('"validUntil"')}: ${sv('"2027-04-29T00:00:00Z"')},
  ${k('"dataOwner"')}: {
    ${k('"id"')}:   ${sv('"did:ethr:0x..."')},         ${c('// Acme')}
    ${k('"uen"')}:  ${sv('"201234567A"')},
    ${k('"name"')}: ${sv('"Acme Pte Ltd"')}
  },
  ${k('"dataProviders"')}: [{
    ${k('"id"')}: ${sv('"did:ethr:0x..."')},           ${c('// IR')}
    ${k('"name"')}: ${sv('"Invoice Repository"')},
    ${k('"dataElements"')}: [${sv('"sales_invoice"')}]
  }],
  ${k('"consumerGrants"')}: [{
    ${k('"consumer"')}:    ${sv('"did:ethr:0x..."')},  ${c('// DBS')}
    ${k('"useCaseIds"')}:  [${sv('"scf-zkp-range"')}, ${sv('"scf-psi-duplicate"')}],
    ${k('"epsilonBudget"')}: { ${k('"value"')}: ${n('1.0')}, ${k('"window"')}: ${sv('"30d"')} },
    ${k('"purpose"')}:     ${sv('"supply-chain-financing"')}
  }],
  ${k('"status"')}: {
    ${k('"statusList"')}: ${sv('"https://admin-corev2.dex.invoicenow.gov.sg/status/manifest/88412"')},
    ${k('"statusIndex"')}: ${n('7341')}
  }
}`,
      },
      {
        title: "Step 1 — Invoices flow; IR ingests; VCs issued by IR's VCIS",
        duration: 'continuous · 90 days',
        actors: ['C1 Acme', 'C2 Sender AP', 'IR', 'ASE-IR', 'VCIS @ IR'],
        narrative: "Over 90 days, Acme issues 47 invoices to its buyers via PEPPOL. Each invoice transit through C2 triggers two parallel paths: the standard 4-corner C2→C3→C4 delivery (unchanged), and the new Flow F0 — an AP-level post-transmission callback forwards a copy of the payload to the Invoice Repository (IR), Acme's accredited Data Provider. IR persists the payload, then ASE-IR extracts attributes, generates Pedersen commitments, and IR's VCIS issues an SD-JWT-VC bound to Acme's holder key. Acme accumulates 47 verifiable credentials in its wallet.",
        privacy: "IR holds the full invoice payload (the only Provider in the mesh that does so). ASE-IR holds only commitments and attestations — and after the ingestion-time derivation step, ASE-IR has no programmatic read access back into IR. That separation is the privacy invariant of the entire IR design.",
        business: {
          title: 'Step 1 — Invoices flow as normal; the Invoice Repository receives a parallel copy',
          narrative: "Over 90 days, Acme sends 47 invoices to its buyers in the ordinary way. As each invoice flows through the network, the sender's Access Point quietly forwards a copy to the Invoice Repository. The repository produces a tamper-proof digital receipt and gives it to Acme to keep in a private wallet.",
          privacy: "The invoice repository is monitored, accredited, and queryable only through the privacy-mediated layer. Acme is the sole holder of its 47 digital receipts; no other party gets a copy.",
        },
        active: ['n-c1', 'n-c2', 'n-c3', 'n-c4', 'n-ir', 'n-ase-ir', 'n-vcis'],
        flows: ['f-c1-c2', 'f-c2-ir', 'f-ir-aseir', 'f-ir-vcis', 'f-vcis-c1'],
        payloadLabel: "SD-JWT-VC issued by IR's VCIS at ingestion",
        payloadTag: 'one of 47',
        payload: `{
  ${k('"iss"')}: ${sv('"did:ethr:0x..."')},            ${c('// IR (Invoice Repository)')}
  ${k('"iat"')}: ${n('1717228800')},
  ${k('"exp"')}: ${n('1748764800')},
  ${k('"vct"')}: ${sv('"https://peppol.org/credentials/invoice-attestation/v1"')},
  ${k('"sub"')}: ${sv('"did:ethr:0x..."')},            ${c('// Acme')}
  ${k('"uen"')}: ${sv('"201234567A"')},
  ${k('"_sd_alg"')}: ${sv('"sha-256"')},
  ${k('"_sd"')}: [
    ${sv('"xKY2_7YsJk..."')}, ${c('// h(invoice_id)')}
    ${sv('"p_3vDmTbN8..."')}, ${c('// h(total_sgd)')}
    ${sv('"5gAsLk39nP..."')}, ${c('// h(gst_sgd)')}
    ${sv('"qB7nXc2Kj4..."')}, ${c('// h(buyer_uen)')}
    ${sv('"vM1xDp9Hq6..."')}  ${c('// h(due_date)')}
  ],
  ${k('"commitments"')}: {
    ${k('"total"')}: ${sv('"0x3a7b...4e8c"')},  ${c('// Pedersen C = g^total · h^r')}
    ${k('"gst"')}:   ${sv('"0x9f2d...1a5b"')}
  },
  ${k('"cnf"')}: { ${k('"jwk"')}: { ${k('"crv"')}: ${sv('"P-256"')}, ${k('"kty"')}: ${sv('"EC"')} } },
  ${k('"status"')}: {
    ${k('"status_list"')}: { ${k('"uri"')}: ${sv('"https://ir.invoicenow.gov.sg/status/8841"')}, ${k('"idx"')}: ${n('12847')} }
  }
}`,
      },
      {
        title: 'Step 2 — DBS submits via pitstop-ui · two-gate manifest verification',
        duration: '< 200 ms (Gate 1 + Gate 2 round-trips)',
        actors: ['DBS (via pitstop-ui)', 'FAM Query Broker', 'Policy Engine', 'admin-corev2', 'ASE-IR'],
        narrative: "Acme applies for a S$200K facility through the DBS supply-chain financing front-end. DBS's analyst opens <strong>pitstop-ui in PET mode</strong> and submits a presentation_definition — a structured request for cryptographic attestations, not raw data. The submission goes <em>directly</em> to the FAM Query Broker. The Broker then performs <strong>sequential two-gate manifest verification</strong>: <strong>Gate 1</strong> — the Policy Engine fetches the Consent Manifest from <strong>admin-corev2</strong> and checks it is non-revoked, permitted, and within ε-budget. <strong>Gate 2</strong> — the Broker dispatches the sub-query to ASE-IR, which independently verifies against its own local manifest copy.",
        privacy: 'DBS does not learn which invoices Acme will use to satisfy the proof. The two-gate enforcement model means a single compromised component cannot bypass consent.',
        business: {
          title: 'Step 2 — DBS asks for the specific facts it needs · the system checks the permission slip twice',
          narrative: "Acme applies for a S$200K line of credit through DBS's online portal. Instead of asking for a stack of invoices and bank statements, DBS sends back a precise, machine-readable request describing the two things it actually needs proven. DBS asks for proof — not data. Before anything happens, the system checks Acme's permission slip twice: once at the dex platform's central registry, and once again at the Invoice Repository itself. Both checks must pass.",
          privacy: 'At this stage, DBS has not seen — and will not see — any actual invoice. The double-check means even if one part of the system is misconfigured or compromised, the other catches it.',
        },
        active: ['n-c5', 'n-pitstop-ui', 'n-broker', 'n-policy', 'n-admin-core', 'n-ase-ir'],
        flows: ['f-pitstop-ui-broker', 'f-policy-broker', 'f-policy-admin'],
        payloadLabel: 'DIF Presentation Definition (excerpt)',
        payloadTag: 'broker → C1',
        payload: `{
  ${k('"id"')}: ${sv('"dbs-scf-200k-req-2026-04"')},
  ${k('"input_descriptors"')}: [
    {
      ${k('"id"')}: ${sv('"aggregate-receivables-proof"')},
      ${k('"constraints"')}: {
        ${k('"fields"')}: [
          { ${k('"path"')}: [ ${sv('"$.proof.type"')} ],
            ${k('"filter"')}: { ${k('"const"')}: ${sv('"bulletproof-range-2025"')} } },
          { ${k('"path"')}: [ ${sv('"$.proof.statement"')} ],
            ${k('"filter"')}: { ${k('"const"')}: ${sv('"sum_unpaid_total > 200000_SGD"')} } }
        ]
      }
    },
    { ${k('"id"')}: ${sv('"window-constraint"')},
      ${k('"constraints"')}: { ${k('"window_days"')}: ${n('90')} } },
    { ${k('"id"')}: ${sv('"non-pledge-proof"')},
      ${k('"constraints"')}: {
        ${k('"capability"')}: ${sv('"urn:peppol:analytics:psi:duplicate:1"')},
        ${k('"cohort"')}: ${sv('"banks-sg-licensed"')}
      } }
  ]
}`,
      },
      {
        title: 'Step 3 — Acme generates a Bulletproof range proof',
        duration: '~ 712 ms',
        actors: ['C1 Acme', 'ASE-1'],
        narrative: "Acme's wallet selects 47 VCs whose due dates fall within 90 days, sums the underlying Pedersen commitments, and generates a Bulletproof range proof showing the sum exceeds 200,000 SGD. The proof is logarithmic in size and verifies in tens of milliseconds. ASE-1 attests that the commitments are well-formed.",
        privacy: 'Individual invoice values stay hidden. The buyer identities are never derivable from the proof. Bulletproofs require no trusted setup.',
        business: {
          title: "Step 3 — Acme proves it has the receivables — without showing them",
          narrative: "Acme's digital wallet looks at its 47 receipts, picks the ones due within the next 90 days, and produces a single mathematical proof — small enough to fit in a tweet — that confirms one statement: 'I have more than S$200,000 of receivables coming due.' The proof reveals nothing about who owes the money, when, or for what.",
          privacy: 'Individual invoice amounts stay hidden. Buyer identities can never be reconstructed from the proof. The proof itself relies on no trusted third party.',
        },
        active: ['n-c1', 'n-ase-1'],
        flows: ['f-c1-ase1'],
        payloadLabel: 'Bulletproof range proof',
        payloadTag: 'logarithmic',
        payload: `{
  ${k('"type"')}: ${sv('"bulletproof-range-2025"')},
  ${k('"statement"')}: ${sv('"Σ(C_i) commits to value > 200000_SGD"')},
  ${k('"setup"')}: ${sv('"transparent"')},             ${c('// no trusted setup')}
  ${k('"input_commitments"')}: [                       ${c('// 47 Pedersen commits')}
    ${sv('"0x3a7b81e2c4..."')}, ${sv('"0x4c8d92f1a3..."')}, ${sv('"0x9e2f7b1c83..."')},
    ${c('// ... 44 more')}
  ],
  ${k('"aggregated_commit"')}: ${sv('"0x8f4e3b2a91c7d6..."')},
  ${k('"proof_bytes"')}: ${sv('"0xb47d...e9c2"')},     ${c('// 1.4 KB total')}
  ${k('"public_threshold"')}: ${n('200000')},
  ${k('"prover_time_ms"')}: ${n('712')},
  ${k('"verifier_complexity"')}: ${sv('"O(log n)"')},
  ${k('"soundness"')}: ${sv('"computational, 2^-128"')},
  ${k('"holder_signature"')}: ${sv('"0x73a1...2d4f"')}
}`,
      },
      {
        title: 'Step 4 — Cross-bank PSI duplicate-finance check',
        duration: '~ 2.6 s',
        actors: ['Broker', 'ASE-2 (OCBC)', 'ASE-3 (DBS)', 'ASE-4 (UOB)', '+ 9 more banks'],
        narrative: "In parallel with the range proof, the broker initiates a 12-party Private Set Intersection across all SG-licensed bank ASEs. Each ASE encodes its pledged-invoice set as a Bloom filter of OPRF-evaluated invoice hashes. Six oblivious-PRF rounds determine whether any of Acme's 47 invoice IDs appears in any other bank's pledged set.",
        privacy: "Each bank learns only the cardinality of intersection (typically 0 or 1). Other banks do not learn what DBS is screening or which suppliers the query covers. Pledged-invoice sets stay sealed in their respective ASEs.",
        business: {
          title: 'Step 4 — All Singapore banks check for duplicate pledges — privately',
          narrative: "At the same time, the system runs a coordinated check across all 12 Singapore-licensed banks to confirm none of Acme's invoices have already been used as collateral elsewhere. The banks collectively answer a single yes/no question — 'is there any overlap?' — without any bank revealing its own loan book to the others.",
          privacy: "Each bank learns only whether there is an overlap — never what was being checked or by whom. Each bank's pledged-invoice list stays sealed inside its own systems.",
        },
        active: ['n-broker', 'n-ase-2', 'n-ase-3', 'n-ase-4', 'n-ase-5', 'n-c5b', 'n-c5c'],
        flows: ['f-ase2-3', 'f-ase3-4', 'f-ase4-5', 'f-ase2-broker', 'f-ase3-broker', 'f-ase4-broker', 'f-c5b-broker', 'f-c5c-broker'],
        payloadLabel: 'PSI protocol round 3 of 6',
        payloadTag: 'KKRT-PSI-2016',
        payload: `{
  ${k('"protocol"')}: ${sv('"KKRT-PSI-2016"')},
  ${k('"variant"')}: ${sv('"multi-party-cardinality"')},
  ${k('"session"')}: ${sv('"acme-fin-200k-2026-04-29-08:14:22Z"')},
  ${k('"round"')}: ${n('3')},
  ${k('"party_id"')}: ${sv('"ase-ocbc.peppol.sg"')},
  ${k('"oprf_evaluations"')}: [
    ${sv('"0x8a3f...4e2c"')}, ${sv('"0xb91d...02af"')}, ${c('// ...')}
  ],
  ${k('"bloom_filter_chunk"')}: ${sv('"0x3c...9d (~24 KB)"')},
  ${k('"attestation"')}: ${sv('"intel-tdx-quote-v1.5"')}
}

${c('// Final result aggregated by the broker:')}
{
  ${k('"result"')}: { ${k('"intersection_cardinality"')}: ${n('0')} },
  ${k('"interpretation"')}: ${sv('"no Acme invoice already pledged at any SG-licensed bank"')}
}`,
      },
      {
        title: 'Step 5 — DBS verifies the proofs offline',
        duration: '< 50 ms',
        actors: ['DBS verifier'],
        narrative: "DBS verifies the Bulletproof range proof against IMDA-anchored AP issuer keys (offline — no broker round-trip). It verifies the PSI co-signature thread. Combined verification takes under 50 ms. DBS now knows that Acme has more than S$200K of unpledged near-term receivables — and nothing else.",
        privacy: 'DBS gains no information about specific invoices, buyers, payment terms, or commercial relationships. It learns only the two binary facts it needed.',
        business: {
          title: 'Step 5 — DBS verifies the proofs and decides — in milliseconds',
          narrative: "DBS's underwriting system checks the two proofs in under a tenth of a second. The verification works entirely offline against trusted public keys anchored by IMDA. DBS now knows two things with mathematical certainty: Acme has more than S$200K of qualifying receivables, and none of them are double-pledged.",
          privacy: 'DBS learns no invoice details, no buyer names, no payment terms — only the two yes/no answers it needs to underwrite the facility.',
        },
        active: ['n-c5'],
        flows: ['f-c5-broker'],
        payloadLabel: 'DBS verification report',
        payloadTag: 'internal',
        payload: `{
  ${k('"applicant"')}: ${sv('"Acme Pte Ltd · UEN 201234567A"')},
  ${k('"facility_requested"')}: ${sv('"SGD 200,000 supply-chain financing"')},
  ${k('"verifications"')}: [
    {
      ${k('"check"')}: ${sv('"aggregate_receivables > 200,000 SGD over 90d"')},
      ${k('"proof_type"')}: ${sv('"bulletproof-range-2025"')},
      ${k('"verified"')}: ${b('true')},
      ${k('"verification_ms"')}: ${n('31')}
    },
    {
      ${k('"check"')}: ${sv('"no_duplicate_pledge_across_SG_banks"')},
      ${k('"proof_type"')}: ${sv('"psi-multi-party-cardinality"')},
      ${k('"verified"')}: ${b('true')},
      ${k('"cohort_size"')}: ${n('12')},
      ${k('"intersection"')}: ${n('0')}
    }
  ],
  ${k('"data_acquired"')}: {
    ${k('"invoice_line_items"')}: ${b('null')},
    ${k('"buyer_identities"')}: ${b('null')}
  },
  ${k('"decision"')}: ${sv('"APPROVE · risk-tier B · pricing 5.85% p.a."')}
}`,
      },
      {
        title: 'Step 6 — Decision logged in the transparency log',
        duration: '~ 200 ms · DLT anchor next hour',
        actors: ['Broker', 'Transparency Log', 'DLT Anchor'],
        narrative: "The broker writes a structured event to the transparency log: who queried, what capability, what cohort, what was the outcome hash, what privacy-budget was spent. The Signed Tree Head will be anchored to the public DLT (XDC, Polygon or Ethereum) within the hour. The data owner (Acme) receives an inclusion proof.",
        privacy: 'The log entry contains no business data — only metadata. The DLT anchor is a Merkle root, not a query record. Independent auditors can verify the log without operator cooperation.',
        business: {
          title: 'Step 6 — Every action recorded in a tamper-evident register',
          narrative: 'Every interaction is recorded in a tamper-evident logbook. A permanent fingerprint is published to a public blockchain within the hour, so nobody can quietly alter or delete records after the fact. Acme automatically receives a verified receipt confirming its data was used for this query.',
          privacy: 'The logbook records only meta-information — never any commercial data. Independent auditors can verify everything without needing cooperation from any operator.',
        },
        active: ['n-broker', 'n-tlog', 'n-dlt'],
        flows: ['f-broker-tlog', 'f-tlog-dlt'],
        payloadLabel: 'Transparency log entry · CT-style',
        payloadTag: 'leaf',
        payload: `{
  ${k('"log_index"')}: ${n('7894231')},
  ${k('"timestamp"')}: ${sv('"2026-04-29T08:14:24.812Z"')},
  ${k('"event_type"')}: ${sv('"analytical_query_completed"')},
  ${k('"consumer"')}: { ${k('"id"')}: ${sv('"did:web:dbs.com.sg/scf"')} },
  ${k('"capabilities_invoked"')}: [
    ${sv('"urn:peppol:analytics:range-proof:receivables:1"')},
    ${sv('"urn:peppol:analytics:psi:duplicate:1"')}
  ],
  ${k('"data_owner"')}: ${sv('"did:ethr:0x…"')},
  ${k('"epsilon_spent"')}: ${n('0.0')},
  ${k('"prev_hash"')}: ${sv('"sha256:0d3f...91e6"')},
  ${k('"sth_signature"')}: ${sv('"0x6b9e...4c2a"')},
  ${k('"will_anchor_to"')}: { ${k('"chain"')}: ${sv('"XDC"')}, ${k('"window"')}: ${sv('"2026-04-29T09:00Z"')} }
}`,
      },
      {
        title: "Step 7 — Acme audits its own trail",
        duration: 'on demand',
        actors: ['Acme', 'Transparency Log'],
        narrative: "At any time, Acme can query the transparency log for the derived view of every analytical event that touched its data. Acme sees: who queried, when, under what capability, with what privacy-budget cost. Acme cannot derive other firms' query histories. This realises the architecture's auditor-independence property.",
        privacy: "Acme cannot inspect other firms' transparency entries. Operators cannot conceal events from Acme — every entry is cryptographically reachable from the published Signed Tree Head.",
        business: {
          title: "Step 7 — Acme can see every query that touched its data",
          narrative: "Whenever Acme wants to know who has analysed its data, it can pull a complete, verifiable history: which institution looked, when, for what stated purpose, and how much of its privacy allowance was used. Operators cannot hide any event from Acme.",
          privacy: "Acme can only see its own audit trail, never anyone else's. Operators cannot hide any event from Acme — the records are mathematically pinned in place.",
        },
        active: ['n-owner', 'n-tlog'],
        flows: ['f-owner-tlog'],
        payloadLabel: "Acme's derived audit view",
        payloadTag: 'inclusion-proof verified',
        payload: `${c('// derived view of all log events touching Acme (UEN 201234567A)')}
{
  ${k('"data_owner"')}: ${sv('"did:ethr:0x…"')},
  ${k('"period"')}: ${sv('"2026-04-01 to 2026-04-29"')},
  ${k('"events_touching_owner_data"')}: [
    {
      ${k('"log_index"')}: ${n('7894231')},
      ${k('"timestamp"')}: ${sv('"2026-04-29T08:14:24.812Z"')},
      ${k('"consumer"')}: ${sv('"did:web:dbs.com.sg/scf"')},
      ${k('"capabilities"')}: [${sv('"range-proof:receivables:1"')}, ${sv('"psi:duplicate:1"')}],
      ${k('"epsilon_spent"')}: ${n('0.0')},
      ${k('"inclusion_proof_verified"')}: ${b('true')},
      ${k('"dlt_anchor_tx"')}: ${sv('"0xdfa7...92c1 (XDC block 89,234,712)"')}
    }
  ],
  ${k('"total_epsilon_spent_ytd"')}: ${n('0.42')},
  ${k('"queries_outside_consent"')}: ${n('0')},
  ${k('"verifier"')}: ${sv('"runs locally · no operator cooperation needed"')}
}`,
      },
    ],
  },

  B: {
    title: 'MAS receives a cross-bank SME sector-exposure model',
    sub: 'A federated learning scenario showing how three banks collaborate to produce a privacy-preserving regulatory risk model — without any bank revealing its counterparty list or loan book to the others or to MAS.',
    consumer: { id: 'n-c5', label: 'MAS Supervision', sub: 'regulatory analytical access · government API' },
    cohort: [
      { id: 'n-c5b', label: 'DBS loan-data ASE',  sub: 'FL participant' },
      { id: 'n-c5c', label: 'OCBC loan-data ASE', sub: 'FL participant' },
    ],
    owner: { id: 'n-owner', label: 'UOB (data owner + FL participant)' },
    aseLabels: {
      'n-ase-2': { sublabel: 'DBS loan-data ASE' },
      'n-ase-3': { sublabel: 'OCBC loan-data ASE' },
      'n-ase-4': { sublabel: 'UOB loan-data ASE' },
      'n-ase-5': { sublabel: 'FL secure aggregator' },
    } as unknown as Record<string, string>,
    journey: [
      { num: '3',       label: 'banks in the FL cohort' },
      { num: 'ε ≤ 8',  label: 'DP budget at model level' },
      { num: '0',       label: 'counterparty identities disclosed' },
      { num: 'PSI + FL', label: 'two PET primitives composed' },
    ],
    steps: [
      {
        title: "Step 0 — Each bank's org admin signs a Consent Manifest",
        duration: 'one-off · before any FL round',
        actors: ['DBS org admin', 'OCBC org admin', 'UOB org admin', 'admin-corev2', 'three loan-data ASEs'],
        narrative: "Before MAS can run any aggregation, each of DBS, OCBC and UOB — as data owners of their own SME loan books — signs a Consent Manifest via <strong>admin-ui</strong>. Each manifest names that bank's loan-data ASE as Data Provider, MAS Supervision as the permitted Consumer, the query class <code>fedlearn:trade-finance:1</code>, and an ε-budget that contributes to the cohort-level model-level ε ≤ 8. Each signed manifest is persisted in admin-corev2 and propagated to the bank's ASE for its independent local copy.",
        privacy: "No loan data is touched. The three manifests are independent — no bank sees another bank's manifest content. admin-corev2 holds all three; each ASE holds only its own.",
        business: {
          title: "Step 0 — Each bank signs its own permission slip",
          narrative: "Before MAS can ask anything cross-bank, each of DBS, OCBC and UOB independently signs a permission slip authorising MAS Supervision to run a specific kind of cross-bank analytical question. Each bank sets its own privacy budget contribution. No bank sees what the others have signed.",
          privacy: "Each bank's manifest is signed independently. None of the banks sees another's manifest.",
        },
        active: ['n-owner', 'n-c5b', 'n-c5c', 'n-admin-ui', 'n-admin-core', 'n-ase-2', 'n-ase-3', 'n-ase-4'],
        flows: ['f-c1-dex', 'f-ir-dex'],
        payloadLabel: 'Consent Manifest VC (one of three — UOB shown)',
        payloadTag: 'three independent manifests',
        payload: `{
  ${k('"type"')}: ${sv('"ConsentManifest"')},
  ${k('"issuer"')}: ${sv('"did:ethr:0x..."')},          ${c('// UOB')}
  ${k('"dataOwner"')}: { ${k('"id"')}: ${sv('"did:ethr:0x..."')}, ${k('"name"')}: ${sv('"United Overseas Bank Ltd"')} },
  ${k('"dataProviders"')}: [{
    ${k('"id"')}:   ${sv('"did:ethr:0x..."')},           ${c('// UOB loan-data ASE')}
    ${k('"name"')}: ${sv('"UOB loan-data ASE"')},
    ${k('"dataElements"')}: [${sv('"sme_loan_exposure"')}, ${sv('"sme_counterparty_set"')}]
  }],
  ${k('"consumerGrants"')}: [{
    ${k('"consumer"')}: ${sv('"did:web:mas.gov.sg/supervision"')},
    ${k('"useCaseIds"')}: [${sv('"fedlearn:trade-finance:1"')}, ${sv('"psi:cardinality:3party:1"')}],
    ${k('"epsilonBudget"')}: { ${k('"value"')}: ${n('8.0')}, ${k('"window"')}: ${sv('"per-FL-round"')} },
    ${k('"purpose"')}: ${sv('"sme-sector-exposure-supervision"')}
  }]
}`,
      },
      {
        title: 'Step 1 — MAS submits an FL aggregation request via government API',
        duration: '< 200 ms',
        actors: ['MAS Supervision', 'FAM Query Broker', 'ASR'],
        narrative: "MAS Supervision submits a query through its government-to-government API integration with the FAM Query Broker — <strong>not via pitstop-ui</strong>. Capability URN: <code>urn:dex:analytics:fedlearn:smb-sector-exposure:1</code>. Scope: SSIC 46 (wholesale trade), SME turnover band, current quarter. Model-level ε ≤ 8. The Query Broker resolves the three bank loan-data ASEs via the ASR.",
        privacy: "MAS's consumer credential is a government-issued statutory analytical access token. No bank data is touched yet — only registry resolution.",
        business: {
          title: 'Step 1 — MAS asks for a cross-bank risk model',
          narrative: "MAS doesn't log in through the consumer portal — it has its own dedicated government-to-government channel into the system. Its supervision team submits a precise question with strict privacy parameters attached. The system identifies the three banks whose data nodes are needed.",
          privacy: 'MAS uses a government API path, not the commercial consumer portal.',
        },
        active: ['n-c5', 'n-broker'],
        flows: ['f-c5-broker'],
        payloadLabel: 'FL query intent (MAS → QB)',
        payloadTag: 'capability URN + ε-budget',
        payload: `{
  ${k('"capability"')}: ${sv('"urn:dex:analytics:fedlearn:smb-sector-exposure:1"')},
  ${k('"consumer_did"')}: ${sv('"did:web:mas.gov.sg/supervision"')},
  ${k('"scope"')}: {
    ${k('"ssic_codes"')}: [${sv('"46900"')}, ${sv('"46411"')}, ${sv('"46412"')}],
    ${k('"period"')}: ${sv('"2026-Q2"')},
    ${k('"turnover_band_sgd"')}: { ${k('"min"')}: ${n('5000000')}, ${k('"max"')}: ${n('100000000')} }
  },
  ${k('"model"')}: {
    ${k('"family"')}: ${sv('"logistic-regression"')},
    ${k('"target"')}: ${sv('"P(default | sector exposure ratio)"')},
    ${k('"features"')}: [${sv('"sector_exposure_share"')}, ${sv('"counterparty_diversity"')}]
  },
  ${k('"privacy"')}: {
    ${k('"epsilon_model_level"')}: ${n('8.0')},
    ${k('"delta"')}: ${n('1e-9')},
    ${k('"mechanism"')}: ${sv('"gaussian"')}
  }
}`,
      },
      {
        title: 'Step 2 — QB performs sequential manifest verification × 3',
        duration: '< 300 ms',
        actors: ['FAM Query Broker', 'Policy Engine', 'admin-corev2'],
        narrative: "The QB calls the Policy Engine; PE in turn fetches three Consent Manifests from <strong>admin-corev2</strong> — one per bank. All three must independently PERMIT for the FL round to proceed. Each check verifies: manifest exists for (MAS, bank, sme_loan_exposure), non-revoked, query class permitted, ε-budget remaining ≥ allocation. Result: PERMIT × 3.",
        privacy: "Three sequential gate checks at admin-corev2 — none of the banks learn that the others were also queried. PE returns three independent decisions; the QB requires all three before proceeding.",
        business: {
          title: "Step 2 — The system checks each bank's permission slip",
          narrative: "Before MAS's query reaches any bank's data, the system checks each bank's permission slip independently against the central registry. All three banks must have authorised this exact kind of question. If even one declines, the query stops here.",
          privacy: "Three independent permission checks at the central registry. No bank learns about the others' decisions.",
        },
        active: ['n-broker', 'n-policy', 'n-admin-core'],
        flows: ['f-policy-broker', 'f-policy-admin'],
        payloadLabel: 'PE decision bundle (3 manifests verified)',
        payloadTag: 'all 3 PERMIT',
        payload: `{
  ${k('"decision_bundle"')}: ${sv('"MAS-SUP-2026-SME-046"')},
  ${k('"checks"')}: [
    { ${k('"data_owner"')}: ${sv('"DBS"')}, ${k('"manifest_id"')}: ${sv('"manifest/91205"')}, ${k('"decision"')}: ${sv('"PERMIT"')} },
    { ${k('"data_owner"')}: ${sv('"OCBC"')}, ${k('"manifest_id"')}: ${sv('"manifest/91206"')}, ${k('"decision"')}: ${sv('"PERMIT"')} },
    { ${k('"data_owner"')}: ${sv('"UOB"')}, ${k('"manifest_id"')}: ${sv('"manifest/91207"')}, ${k('"decision"')}: ${sv('"PERMIT"')} }
  ],
  ${k('"final_decision"')}: ${sv('"PROCEED_TO_PSI_PREFLIGHT"')}
}`,
      },
      {
        title: 'Step 3 — PSI cardinality pre-flight (3-party KKRT)',
        duration: '~ 1.5 s',
        actors: ['DBS loan-data ASE', 'OCBC loan-data ASE', 'UOB loan-data ASE'],
        narrative: "Before the FL round begins, the QB initiates a three-party PSI to determine the cardinality of overlap in the three banks' SME counterparty sets — <em>without revealing which firms overlap</em>. The protocol: KKRT-PSI three-party variant, executed inside each bank's TEE. The output is a single integer: how many SME firms appear in more than one bank's loan book.",
        privacy: "Each bank learns only the cardinality of pairwise and three-way overlaps. No bank learns <em>which</em> specific firms overlap.",
        business: {
          title: 'Step 3 — The banks count overlapping customers without naming them',
          narrative: "Before computing any model, the three banks need to know how many SME customers they share — without telling each other (or MAS) which customers those are. A cryptographic protocol gives them the count. No customer identity is ever exposed.",
          privacy: 'The banks learn cardinality (counts) only, never identity.',
        },
        active: ['n-ase-2', 'n-ase-3', 'n-ase-4', 'n-c5b', 'n-c5c', 'n-owner'],
        flows: ['f-ase2-3', 'f-ase3-4'],
        payloadLabel: 'PSI cardinality result',
        payloadTag: 'integers only',
        payload: `{
  ${k('"protocol"')}: ${sv('"KKRT-PSI-3party-v2"')},
  ${k('"cohort"')}: [${sv('"DBS-loan-ASE"')}, ${sv('"OCBC-loan-ASE"')}, ${sv('"UOB-loan-ASE"')}],
  ${k('"overlap_cardinality"')}: {
    ${k('"three_way"')}: ${n('47')},
    ${k('"DBS_OCBC"')}:  ${n('132')},
    ${k('"DBS_UOB"')}:   ${n('98')},
    ${k('"OCBC_UOB"')}:  ${n('71')}
  },
  ${k('"identities_revealed"')}: ${n('0')},
  ${k('"feeds_into"')}: ${sv('"FL coordinator: sector-level feature normalisation prior"')}
}`,
      },
      {
        title: 'Step 4 — FL round: local training at each bank ASE (Gate 2 enforced locally)',
        duration: '~ 4 s per round',
        actors: ['DBS loan-data ASE', 'OCBC loan-data ASE', 'UOB loan-data ASE'],
        narrative: "Each bank's ASE first <strong>independently verifies its own local Consent Manifest copy</strong> against the QB's sub-query parameters (Gate 2 — defence in depth). Once the local check passes, the ASE trains a logistic-regression model on its SME exposure features <em>inside the TEE</em>. Per-firm gradient sensitivity is bounded at Δ = 1.0 by clipping. Gaussian DP noise is added at σ = Δ/ε_partition, where ε_partition = 8.0 / 3 ≈ 2.67. The masked gradients are sent to the secure aggregator.",
        privacy: "No raw loan data leaves the TEE. Each bank consumes ε_partition = 2.67 from its own ε ledger.",
        business: {
          title: 'Step 4 — Each bank trains a piece of the model locally, then blurs it',
          narrative: "Each bank trains a small piece of the model using only its own loan book — locally, in a sealed computing environment. Before sending its piece to the aggregator, the bank deliberately blurs the result with carefully calibrated random noise.",
          privacy: "The training happens inside each bank's sealed environment. The bank's contribution is mathematically blurred before it ever leaves.",
        },
        active: ['n-ase-2', 'n-ase-3', 'n-ase-4', 'n-broker'],
        flows: ['f-ase2-broker', 'f-ase3-broker', 'f-ase4-broker'],
        payloadLabel: 'Masked gradient (UOB partition)',
        payloadTag: 'one of three',
        payload: `{
  ${k('"sub_query_id"')}: ${sv('"MAS-SUP-2026-SME-046.UOB"')},
  ${k('"gate_2_local_manifest_check"')}: ${sv('"PASSED · UOB-manifest/91207"')},
  ${k('"firms_contributing"')}: ${n('1672')},
  ${k('"masked_gradient"')}: ${sv('"<byte array · secure-aggregation share · 6.8 KB>"')},
  ${k('"dp_certificate"')}: {
    ${k('"epsilon_partition"')}: ${n('2.67')},
    ${k('"sigma"')}: ${n('0.375')},
    ${k('"mechanism"')}: ${sv('"gaussian"')}
  },
  ${k('"epsilon_ledger_post"')}: { ${k('"remaining"')}: ${n('5.33')} },
  ${k('"tee_attestation"')}: ${sv('"intel-tdx-quote-v1.5"')}
}`,
      },
      {
        title: 'Step 5 — Secure aggregation produces a global model',
        duration: '~ 600 ms',
        actors: ['FL secure aggregator', 'FAM Query Broker'],
        narrative: "The secure aggregator combines the three masked gradients using the secure-aggregation protocol (additive secret sharing). No individual bank's gradient is recoverable from the sum. The aggregated gradient is applied to update the model weights θ_t+1, which are signed and returned to the QB.",
        privacy: "The aggregator only ever sees the sum of masked gradients — no individual bank's contribution is reconstructible.",
        business: {
          title: 'Step 5 — The blurred pieces are combined into one model',
          narrative: "A neutral aggregator combines the three blurred contributions using a cryptographic protocol that ensures no single bank's piece is ever readable on its own — only the sum is computable.",
          privacy: "The aggregator only ever sees the combined sum. No bank's individual contribution is recoverable.",
        },
        active: ['n-ase-5', 'n-broker'],
        flows: ['f-ase5-broker'],
        payloadLabel: 'Aggregated model gradient',
        payloadTag: 'no per-bank attribution',
        payload: `{
  ${k('"protocol"')}: ${sv('"secure-aggregation-v3 (Bonawitz et al.)"')},
  ${k('"contributions_received"')}: ${n('3')},
  ${k('"contributions_recoverable_individually"')}: ${n('0')},
  ${k('"global_dp_certificate"')}: {
    ${k('"epsilon_total_model_level"')}: ${n('8.0')},
    ${k('"delta"')}: ${n('1e-9')},
    ${k('"mechanism"')}: ${sv('"gaussian"')}
  },
  ${k('"model_round"')}: { ${k('"id"')}: ${sv('"smb-exposure-r17"')}, ${k('"theta_dim"')}: ${n('847')} }
}`,
      },
      {
        title: 'Step 6 — MAS receives the model · banks see TLog entries',
        duration: '~ 200 ms model delivery',
        actors: ['FAM Query Broker', 'MAS Supervision', 'Transparency Log', 'three banks'],
        narrative: "MAS receives the global model θ_t+1 with its DP certificate (ε_total = 8, δ = 1e-9, mechanism, cohort size). Each of DBS, OCBC and UOB can independently fetch from the transparency log the entry confirming its ASE participated in this FL round, which capability URN was invoked, what ε share was consumed. <strong>No bank learns what the other banks contributed.</strong>",
        privacy: "Each bank gets a verifiable receipt that its ε ledger was decremented by exactly 2.67 in this round. No bank can derive the others' contributions from its own log entry.",
        business: {
          title: 'Step 6 — MAS gets the model · each bank gets its own receipt',
          narrative: "MAS receives the final cross-bank risk model with formal mathematical guarantees. Separately, each of the three banks receives a transparency receipt showing exactly what its data contributed and how much of its privacy allowance was used.",
          privacy: 'MAS gets a model, not data. Each bank gets a receipt for its own contribution — and only its own.',
        },
        active: ['n-broker', 'n-c5', 'n-tlog', 'n-dlt', 'n-owner', 'n-c5b', 'n-c5c'],
        flows: ['f-c5-broker', 'f-broker-tlog', 'f-tlog-dlt', 'f-owner-tlog'],
        payloadLabel: 'Per-bank TLog receipt (UOB shown)',
        payloadTag: 'one of three',
        payload: `{
  ${k('"data_owner"')}: ${sv('"UOB"')},
  ${k('"events_touching_owner_data"')}: [{
    ${k('"log_index"')}: ${n('8124001')},
    ${k('"timestamp"')}: ${sv('"2026-04-29T14:22:08.412Z"')},
    ${k('"consumer"')}: ${sv('"did:web:mas.gov.sg/supervision"')},
    ${k('"capability"')}: ${sv('"fedlearn:trade-finance:1"')},
    ${k('"epsilon_consumed"')}: ${n('2.67')},
    ${k('"co_participants_visible"')}: ${b('false')},
    ${k('"my_contribution_recoverable"')}: ${b('false')},
    ${k('"inclusion_proof_verified"')}: ${b('true')}
  }],
  ${k('"my_total_epsilon_ytd"')}: ${n('14.04')},
  ${k('"queries_outside_consent"')}: ${n('0')}
}`,
      },
    ],
  },
}
