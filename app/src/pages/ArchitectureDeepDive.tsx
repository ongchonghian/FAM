import './ArchitectureDeepDive.css'

const flows = [
  {
    id: 'flow-f0', tag: 'F0',
    title: 'PEPPOL → IR Ingestion — invoice payload forwarded to the Invoice Repository in parallel to the 4-corner path',
    meta: 'parallel to AS4 send · IR is dex-onboarded Data Provider',
    lifelines: ['C1', 'C2 · Sender AP', 'IR', 'ASE-IR', 'VCIS @ IR', 'Transparency Log'],
    steps: [
      'C1 → C2: AS4 send with invoice payload',
      'C2 → IR: post-transmission callback forwards full PEPPOL payload (mutual TLS, AP cert)',
      'IR → ASE-IR: ingestion-time derivation — content hash, Pedersen commitments, signed attestations',
      'ASE-IR → VCIS @ IR: request VC issuance bound to C1\'s holder key',
      'VCIS → C1: SD-JWT-VC delivered (out-of-band)',
      'ASE-IR → TLog: append issuance event · STH anchored hourly to DLT',
    ],
    notes: <>
      <strong>Side-effects:</strong> IR persists the full PEPPOL invoice payload (the only Provider in the mesh that does so). ASE-IR persists ~1 KB of derivative material per invoice. C1 receives an SD-JWT-VC issued by IR's VCIS and bound to its holder key. The transparency log gains one signed entry. <strong>The standard 4-corner C2→C3→C4 path is unchanged and runs concurrently.</strong> Latency budget for the IR leg: &lt;700 ms additional to standard AS4 forward.
      <br /><br />
      <strong>pitstop-core does not appear as a lifeline.</strong> The C2 → IR forwarding is implemented as a post-transmission callback on the AP itself — a new configuration item under the Analytical Services Annex — and does not route through pitstop-core's <code className="inl">/api/v1/data/forward</code> route.
    </>,
  },
  {
    id: 'flow-f1', tag: 'F1',
    title: 'Issuance Flow — derivative material is created when an invoice transmits',
    meta: 'synchronous with AS4 send',
    lifelines: ['C1', 'C2 · AP', 'ASE @ C2', 'VCIS', 'Transparency Log'],
    steps: [
      'C1 → C2: AS4 send (PEPPOL invoice)',
      'C2 → ASE: derive — SHA-256 hash, Pedersen commitments, signed attestation',
      'ASE → VCIS: issue SD-JWT-VC bound to C1 holder key',
      'VCIS → C1: deliver VC',
      'ASE → TLog: log issuance event',
    ],
    notes: <>
      <strong>Side-effects:</strong> ASE persists ~1 KB of derivative material per invoice. C1 receives a VC bound to its holder key. Transparency Log gains one signed entry. <strong>The invoice itself never leaves the AS4 path.</strong> Latency budget: &lt;500 ms additional to standard AS4 forward.
    </>,
  },
  {
    id: 'flow-f2', tag: 'F2',
    title: 'Consent & Disclosure Flow — data owner releases a VC to a third party',
    meta: 'offline-verifiable · zero broker contact',
    lifelines: ['C1 (holder)', 'Analytical Consumer (verifier)', 'IMDA Trust List'],
    steps: [
      'Consumer → C1: presentation request (capability URN, attribute set, purpose)',
      'C1 → C1: select VCs · generate selective-disclosure presentation (SD-JWT or BBS+)',
      'C1 → Consumer: VP delivered',
      'Consumer → IMDA Trust List: fetch issuer keys (cached)',
      'Consumer → Consumer: verify VP cryptographically · check status list',
    ],
    notes: <>
      <strong>Key property:</strong> the VCIS does <em>not</em> learn that this presentation occurred. The holder controls timing and selection. <strong>Banking secrecy</strong> implications under Section 47 of the Singapore Banking Act are minimised because no AP or operator is in the disclosure path.
      <br /><br />
      <strong>Consent Manifest pre-condition:</strong> for VPs that target a Data Provider's ASE (e.g. ASE-IR for invoice-domain claims), the data owner has previously signed a Consent Manifest <em>via admin-ui's Consent Manifest Manager</em>. The signed manifest is registered in admin-corev2 and distributed to ASE-IR; both hold a copy and verify it independently. See <a className="xref" href="#flow-f3">F3</a> for the full sequence.
    </>,
  },
  {
    id: 'flow-f3', tag: 'F3',
    title: 'Single-ASE Query Flow — sequential manifest verification, then PET execution',
    meta: 'target latency p50 < 2 s · two enforcement gates',
    lifelines: ['Analytical Consumer', 'Query Broker', 'Policy Engine + admin-corev2 (Gate 1)', 'ASE-IR (Gate 2 + execution)', 'Transparency Log'],
    steps: [
      'Consumer → QB: query (capability URN, params, VC presentation, ε allocation)',
      'QB → PE: ABAC + VC verify · GNAP authn',
      'PE → admin-corev2: Gate 1 — fetch Consent Manifest · check eligibility, budget, query-class',
      'admin-corev2 → PE: PERMIT / DENY (with obligations)',
      'QB → ASE-IR: dispatch sub-query (only if PERMIT)',
      'ASE-IR → ASE-IR: Gate 2 — independently verify local Consent Manifest copy against sub-query',
      'ASE-IR → ASE-IR: execute PET (ZKP / DP-aggregate / etc.) inside TEE · debit ε from HSM ledger',
      'ASE-IR → QB: signed result + result-attestation',
      'QB → TLog: log query receipt + result hash',
      'QB → Consumer: result + ε receipt + TLog inclusion proof',
    ],
    notes: <>
      <strong>Two enforcement gates, sequential.</strong> Gate 1 (admin-corev2 via PE) is the <em>eligibility</em> check: does a valid, non-revoked Consent Manifest exist for this consumer-owner-element triple, with budget remaining and the requested query class permitted? If DENY, the flow terminates — ASE-IR is never contacted, no ε is consumed. Gate 2 (ASE-IR's local manifest copy) is the <em>execution-integrity</em> check: do the sub-query parameters the QB has dispatched match the manifest copy ASE-IR holds locally? This defends against a compromised QB. If the two manifest copies diverge, ASE-IR returns a signed refusal and the QB logs a <strong>Tier 2 incident</strong> — IMDA notification within 2 hours.
      <br /><br />
      <strong>Revocation propagation SLA:</strong> if the data owner revokes a manifest after Gate 1 passes but before ASE-IR's Gate 2, ASE-IR's local copy must reflect the revocation within ≤ 60 seconds (matching the TLog STH cadence).
    </>,
  },
  {
    id: 'flow-f4', tag: 'F4',
    title: 'Cross-ASE Federation Flow — PSI / MPC across multiple corners',
    meta: 'duplicate-finance · sanctions · aggregate exposure',
    lifelines: ['Bank X', 'Query Broker', 'ASE-A · ASE-B · ASE-C (cohort of N banks)', 'Transparency Log'],
    steps: [
      'Bank X → QB: query (capability=duplicate-check:1, invoice hash h)',
      'QB → ASR: discover all participating bank ASEs',
      'QB → all ASEs: initiate KKRT-style PSI · OPRF rounds',
      'ASEs ↔ ASEs: ~6 round trips of oblivious PRF · Bloom-filter intersection',
      'ASEs → QB: signed federation-event log entries',
      'QB → Bank X: binary result {0, 1} + signed evidence',
      'QB → TLog: append federation event with multi-party signature',
    ],
    notes: <>
      <strong>What leaks:</strong> only the cardinality of the intersection (typically 0 or 1 for duplicate-finance). <strong>What does not leak:</strong> any ASE's full invoice set, party identities of unaffected suppliers, query history of other consumers. The protocol can be hardened with threshold MPC (3-of-5 ASEs) against collusion.
    </>,
  },
  {
    id: 'flow-f5', tag: 'F5',
    title: 'Federated Learning Round — model trains across all corners',
    meta: 'scheduled · DP-noised · secure aggregation',
    lifelines: ['FL Coordinator', 'ASE-1 · ASE-2 · ... · ASE-N (local trainers)', 'Aggregator (TEE)', 'Transparency Log'],
    steps: [
      'Coordinator → ASEs: dispatch global model parameters w_t',
      'each ASE → ASE local: train k epochs on local invoices · clip gradients · add Gaussian DP noise (ε ≤ 8)',
      'each ASE → Aggregator: encrypted gradient share (secure-aggregation masks)',
      'Aggregator → Aggregator: sum masked shares inside TEE · unmask only the aggregate',
      'Aggregator → Coordinator: w_{t+1} = w_t + η · Σ ∇_i',
      'Aggregator → TLog: log round commit · signed by quorum',
      'Coordinator → ASEs: distribute new global model',
    ],
    notes: <>
      <strong>Privacy guarantee:</strong> the aggregator cannot recover any individual gradient because of the secure-aggregation masking protocol. DP noise added at each ASE bounds membership inference. <strong>Reference:</strong> J.P. Morgan / NVIDIA FLARE production deployment patterns.
    </>,
  },
  {
    id: 'flow-f6', tag: 'F6',
    title: 'Multi-Provider Fan-Out — one consumer query spans multiple Data Providers',
    meta: 'parallel sub-queries · independent Consent Manifest verification · independent log entries',
    lifelines: ['Analytical Consumer', 'Query Broker', 'admin-corev2 (Gate 1)', 'ASE-IR (Provider P1)', 'ASE-Carrier (Provider P2)', 'Transparency Logs (per Provider)'],
    steps: [
      'Consumer → QB: query spanning multiple DataElements across multiple Providers',
      'QB → admin-corev2: Gate 1 — verify Consent Manifests for each (consumer, owner, element) triple',
      'QB → ASE-IR (P1): parallel sub-query for invoice attributes',
      'QB → ASE-Carrier (P2): parallel sub-query for shipment attributes',
      'each ASE → its local manifest store: independent Gate 2 verification',
      'each ASE → its local TLog: independent log entry',
      'each ASE → QB: signed sub-result',
      'QB → QB: assemble cross-Provider result · enforce JOIN privacy budget',
      'QB → Consumer: combined result',
    ],
    notes: <>
      <strong>Properties:</strong> each Data Provider verifies its own Consent Manifest independently — neither the consumer, nor the QB, nor the other Provider can substitute authority for it. Each Provider's transparency log records its own sub-query event; there is no global log entry. The QB returns only the assembled result; the Providers never learn of each other.
    </>,
  },
] as const

function FlowCard({ flow }: { flow: typeof flows[number] }) {
  return (
    <div className="flow" id={flow.id}>
      <div className="flow-head">
        <div>
          <span className="flow-id">{flow.tag}</span>
          <span className="flow-title">{flow.title}</span>
        </div>
        <div className="flow-meta">{flow.meta}</div>
      </div>
      <div className="flow-body">
        <div className="seq-diagram">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {flow.lifelines.map((ll, i) => (
              <div key={i} style={{
                background: 'var(--bg-deep)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                fontFamily: 'var(--mono)',
                color: 'var(--text-muted)',
              }}>{ll}</div>
            ))}
          </div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'step' }}>
            {flow.steps.map((s, i) => (
              <li key={i} style={{
                counterIncrement: 'step',
                position: 'relative',
                paddingLeft: 36,
                paddingTop: 8,
                paddingBottom: 8,
                borderTop: i === 0 ? 'none' : '1px dashed var(--border)',
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--text)',
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  width: 26,
                  height: 22,
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--accent)',
                  fontWeight: 700,
                }}>{String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flow-notes">{flow.notes}</div>
    </div>
  )
}

export default function ArchitectureDeepDive() {
  return (
    <div className="doc">
      {/* HEADER */}
      <header className="header">
        <div className="breadcrumb">
          <span>Architectural Blueprint</span>
          <span className="sep">/</span>
          <span>Federated Analytics Mesh (FAM)</span>
          <span className="sep">/</span>
          <span className="current">Architecture Deep-Dive</span>
        </div>
        <h1 className="title">
          Federated Analytics Mesh —<br />
          <span className="accent">An Architectural Deep-Dive</span>
        </h1>
        <p className="lede">
          A detailed walk-through of the components, flows, protocols and trust boundaries that constitute the
          recommended 5th-corner architecture for Singapore InvoiceNow. Written for technical architects implementing the mesh.
        </p>

        <nav className="toc">
          <div className="toc-label">In this document</div>
          <ul className="toc-list">
            <li><span className="num">01</span><a href="#design">Design principles</a></li>
            <li><span className="num">02</span><a href="#anatomy">Component anatomy</a></li>
            <li><span className="num">03</span><a href="#flows">The seven core flows</a></li>
            <li><span className="num">04</span><a href="#examples">Worked examples</a></li>
            <li><span className="num">05</span><a href="#stack">Protocol stack</a></li>
            <li><span className="num">06</span><a href="#discovery">ASR discovery internals</a></li>
            <li><span className="num">07</span><a href="#threat">Trust boundaries &amp; threat model</a></li>
            <li><span className="num">08</span><a href="#resilience">Failure modes &amp; resilience</a></li>
          </ul>
        </nav>
      </header>

      {/* §01 — DESIGN PRINCIPLES */}
      <section id="design">
        <div className="section-num">01 — DESIGN PRINCIPLES</div>
        <h2>Six Invariants the Architecture Must Preserve</h2>
        <p className="section-lede">
          The mesh is not a single product but a set of cooperating components governed by six invariants.
          Every flow, every protocol choice, every governance decision can be traced back to one of these.
        </p>
        <div className="component-grid">
          {[
            { cls: 'ase', n: 'INVARIANT 1', name: 'Data Locality', desc: <>Invoice payloads remain at the data owner (C1, C4) <em>or at an accredited dex-onboarded Data Provider that holds them on the owner's behalf</em> — currently the Invoice Repository (IR) for PEPPOL invoices, forwarded by C2 in parallel to the standard 4-corner path. ASEs hold only <em>derivative cryptographic material</em>: hashes, commitments, attestations, gradients, indexes. No third-party operator holds an unmediated queryable copy of an invoice.</> },
            { cls: 'broker', n: 'INVARIANT 2', name: 'Computation-to-Data', desc: <>Queries travel to the data, not the reverse. The Query Broker decomposes an analytical request into sub-queries that execute at the relevant ASEs. Only results — typically aggregates, proofs or boolean answers — return to the consumer.</> },
            { cls: 'vcis', n: 'INVARIANT 3', name: 'Owner-Mediated Disclosure', desc: <>Suppliers (C1) and buyers (C4) are the data owners. Every disclosure to a third party is mediated either by an owner-held verifiable credential or by an explicit, revocable, attribute-bound consent grant. Operators have <em>delegated custody</em>, never ownership.</> },
            { cls: 'tlog', n: 'INVARIANT 4', name: 'Universal Auditability', desc: <>Every analytical event — issuance, presentation, query, federation, training round — is recorded in a tamper-evident transparency log with cryptographic inclusion proofs. Data owners and independent auditors can verify every event without trusting any operator.</> },
            { cls: 'asr', n: 'INVARIANT 5', name: 'PEPPOL-Native Routing', desc: <>All discovery reuses the SML/SMP DNS-based discovery model. Analytical services are described by URN-coded capability tags in a sibling registry (the Analytical Service Registry — ASR). No parallel routing fabric exists, no SML hard-fork.</> },
            { cls: 'policy', n: 'INVARIANT 6', name: 'Defence in Depth', desc: <>No single PET is load-bearing. The mesh composes verifiable credentials, federated learning, secure enclaves, MPC, PSI and ZKPs as peers. If any single primitive degrades — a TEE side-channel, a ZKP soundness flaw — the surrounding layers preserve confidentiality and integrity.</> },
          ].map((i, k) => (
            <div key={k} className={`comp-card ${i.cls}`}>
              <div className="comp-head">
                <div>
                  <div className="comp-id">{i.n}</div>
                  <div className="comp-name">{i.name}</div>
                </div>
              </div>
              <div className="comp-desc">{i.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* §02 — COMPONENT ANATOMY */}
      <section id="anatomy">
        <div className="section-num">02 — COMPONENT ANATOMY</div>
        <h2>Inside Each Architectural Component</h2>
        <p className="section-lede">
          Seven logical components constitute the mesh. Each is described by its location, purpose, key interfaces,
          internal data, and the operator who runs it.
        </p>

        {/* ASE */}
        <div className="comp-card ase" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 1 · ASE</div>
              <div className="comp-name">Analytical Service Endpoint</div>
              <div className="comp-loc">co-located with each Access Point · one ASE per AP</div>
            </div>
          </div>
          <div className="comp-desc">
            The atomic unit of the mesh. An ASE is a logically distinct module operated by the same legal entity as the AP,
            holding only derivative cryptographic material about the invoices that AP has processed. It exposes capabilities —
            VC issuance, ZKP attestation, FL local-training, PSI/MPC participation, TEE-attested execution — discoverable through the ASR.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Operated by</td><td>IMDA-accredited Access Point provider (under a new Analytical Services Annex)</td></tr>
              <tr><td>Data held</td><td>Invoice content hashes (SHA-256) · Pedersen commitments of values · signed attribute attestations · VC issuance keys · FL local-model parameters · audit log entries · ABAC policy bundles</td></tr>
              <tr><td>Data <em>not</em> held</td><td>Invoice payloads · line items · personal data of buyers/suppliers beyond UEN-level identifiers</td></tr>
              <tr><td>Interfaces</td><td><code className="inl">/issue</code> · <code className="inl">/present</code> · <code className="inl">/query</code> · <code className="inl">/psi</code> · <code className="inl">/fl-round</code> · <code className="inl">/attest</code> · <code className="inl">/log</code></td></tr>
              <tr><td>Runtime</td><td>Confidential VM (Intel TDX, AMD SEV-SNP, AWS Nitro Enclaves) with remote attestation</td></tr>
              <tr><td>Failure mode</td><td>If an ASE is offline, queries that span its data are answered with a marked degradation flag; cross-AP queries proceed with reduced cohort</td></tr>
            </tbody>
          </table>
        </div>

        {/* QB */}
        <div className="comp-card broker" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 2 · QB</div>
              <div className="comp-name">Query Broker</div>
              <div className="comp-loc">federated · one per ASE operator · peer-to-peer between brokers</div>
            </div>
          </div>
          <div className="comp-desc">
            The orchestration layer. A consumer's analytical request is a <em>query plan</em>, not a raw SQL string:
            the broker translates intent into a federated execution plan, performs ABAC + VC verification, dispatches sub-queries,
            aggregates results, writes audit entries and returns the final response.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Operated by</td><td>Same operator as the ASE (federated topology — brokers communicate peer-to-peer)</td></tr>
              <tr><td>Inputs</td><td>Query intent (URN-coded capability) · consumer's VC presentation · execution-time parameters · privacy budget allocation</td></tr>
              <tr><td>Outputs</td><td>Result + result-attestation (signed) · privacy-budget receipt · transparency-log inclusion proof</td></tr>
              <tr><td>Security</td><td>GNAP-mediated authentication (RFC 9635) · ABAC policy engine · rate limits per consumer credential</td></tr>
              <tr><td>Latency target</td><td>p50 &lt; 200 ms for VC verification queries; p50 &lt; 2 s for single-ASE ZKP queries; p50 &lt; 30 s for multi-party PSI</td></tr>
            </tbody>
          </table>
        </div>

        {/* VCIS */}
        <div className="comp-card vcis" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 3 · VCIS</div>
              <div className="comp-name">Verifiable Credential Issuer Service</div>
              <div className="comp-loc">a function of each ASE · separately keyed</div>
            </div>
          </div>
          <div className="comp-desc">
            Issues SD-JWT-VC or BBS+-signed credentials over invoice attributes selected by C1 or C4. The issuer-public-key chain
            anchors to the IMDA AP accreditation root, allowing any verifier to validate issuance offline. Credentials are revocable
            through a status-list mechanism (RFC draft <code className="inl">draft-ietf-oauth-status-list</code>).
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Credential format</td><td>SD-JWT-VC (default) · W3C VCDM 2.0 with <code className="inl">bbs-2023</code> for BBS+ · ISO mdoc on request</td></tr>
              <tr><td>Trust anchor</td><td>IMDA-issued X.509 cert chain · DID:web for the ASE operator</td></tr>
              <tr><td>Revocation</td><td>OAuth 2.0 status list bitstring · published every 60 s</td></tr>
              <tr><td>Holder binding</td><td>Cryptographic key bound to C1's or C4's PEPPOL identity (UEN + PEPPOL Participant ID)</td></tr>
              <tr><td>Selective disclosure</td><td>SD-JWT salted hashes for plain attributes · BBS+ for unlinkable presentations</td></tr>
            </tbody>
          </table>
        </div>

        {/* TLOG */}
        <div className="comp-card tlog" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 4 · TLOG</div>
              <div className="comp-name">Transparency Log</div>
              <div className="comp-loc">one per ASE · DLT-anchored Merkle roots</div>
            </div>
          </div>
          <div className="comp-desc">
            An append-only Merkle tree (Certificate Transparency design — RFC 6962) recording every analytical event.
            Periodic Signed Tree Heads are anchored to a public DLT (XDC, Polygon or Ethereum mainnet, agnostic at the protocol layer),
            creating an immutable global witness. Data owners can fetch inclusion proofs on demand.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Logged events</td><td>VC issuance · VC presentation · query receipt · query result hash · FL round commit · revocation event</td></tr>
              <tr><td>Proofs offered</td><td>Inclusion (RFC 6962 §2.1.1) · consistency (§2.1.2) · per-data-owner derivation</td></tr>
              <tr><td>Anchoring</td><td>Hourly Signed Tree Heads anchored to public DLT</td></tr>
              <tr><td>Verification</td><td>Any third party with the public log key + DLT chain root can verify any logged event without operator cooperation</td></tr>
            </tbody>
          </table>
        </div>

        {/* ASR */}
        <div className="comp-card asr" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 5 · ASR</div>
              <div className="comp-name">Analytical Service Registry</div>
              <div className="comp-loc">sibling of SMP · accessed via SML DNS root</div>
            </div>
          </div>
          <div className="comp-desc">
            The discovery extension. For each PEPPOL participant, the ASR enumerates the analytical capabilities its serving AP supports.
            Capability identifiers follow a URN scheme so consumers can discover services without knowing which AP serves a given supplier.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>URN scheme</td><td><code className="inl">urn:peppol:analytics:&lt;capability&gt;:&lt;version&gt;</code></td></tr>
              <tr><td>DNS pattern</td><td><code className="inl">B-{'{'}md5(participant){'}'}.iso6523-actorid-upis.{'{'}sml-zone{'}'}</code> with new <code className="inl">_analytics._tcp</code> SRV records</td></tr>
              <tr><td>Examples</td><td><code className="inl">duplicate-check:1</code> · <code className="inl">fedlearn:fraud:1</code> · <code className="inl">zkp:gst-correctness:1</code> · <code className="inl">range-proof:receivables:1</code></td></tr>
              <tr><td>Governance</td><td>OpenPeppol catalogue under a new Analytical Services Profile</td></tr>
            </tbody>
          </table>
        </div>

        {/* Policy Engine */}
        <div className="comp-card policy" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 6 · PE</div>
              <div className="comp-name">Policy Engine</div>
              <div className="comp-loc">embedded in Query Broker · ABAC + GNAP</div>
            </div>
          </div>
          <div className="comp-desc">
            Evaluates whether a consumer's request — given its presented VCs, the data-owner's standing consents, and the regulatory context —
            should be admitted. Policy is expressed declaratively; decisions are signed and themselves logged.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Policy language</td><td>Rego (OPA) · Cedar · or XACML 3.0 — implementation choice</td></tr>
              <tr><td>Inputs</td><td>Subject attributes (consumer VCs) · resource attributes (invoice class, sector) · action (capability URN) · context (time, jurisdiction)</td></tr>
              <tr><td>Outputs</td><td>Permit / Deny / Indeterminate · obligations (e.g. DP ε budget) · advice (e.g. require additional VC)</td></tr>
              <tr><td>Standard policies</td><td>MAS sectoral codes · IRAS audit codes · PDPC data-class codes · data-owner standing consents</td></tr>
            </tbody>
          </table>
        </div>

        {/* ASE-IR */}
        <div className="comp-card ir">
          <div className="comp-head">
            <div>
              <div className="comp-id">COMPONENT 7 · ASE-IR</div>
              <div className="comp-name">Invoice ASE (co-located with IR)</div>
              <div className="comp-loc">co-located with the IR document store · separately keyed · separately operated</div>
            </div>
          </div>
          <div className="comp-desc">
            A FAM-native ASE that runs alongside the IR document store but operates as a logically and cryptographically distinct component.
            ASE-IR receives derivative material — content hashes, Pedersen commitments, signed attribute attestations — extracted from the IR
            ingestion pipeline at the moment of payload arrival. After that derivation point, ASE-IR has no programmatic access to the raw
            payloads. It is the analytical surface for every invoice query in the mesh: ZKP range proofs, PSI participation, FL local training,
            VC issuance via VCIS. The privacy boundary between ASE-IR and the IR document store is the most consequential in the entire IR
            integration — it is what makes IR's centralised payload storage compatible with FAM's data-locality invariant.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Operated by</td><td>FAM-accredited operator under IMDA AP-Plus extension · separate legal entity from the IR document-store team for separation of duty</td></tr>
              <tr><td>Data held</td><td>SHA-256 invoice hashes · Pedersen commitments of values · signed attribute attestations · VC issuance keys · ε-budget ledger (HSM-attested) · local Consent Manifest copy</td></tr>
              <tr><td>Data <em>not</em> held</td><td>Full PEPPOL invoice payloads · line items · buyer/supplier personal data — these live in the IR document store, which ASE-IR cannot read after the ingestion-time derivation step</td></tr>
              <tr><td>Interfaces</td><td><code className="inl">/issue</code> · <code className="inl">/present</code> · <code className="inl">/query</code> · <code className="inl">/psi</code> · <code className="inl">/fl-round</code> · <code className="inl">/attest</code> · <code className="inl">/log</code> · <code className="inl">/manifest/verify</code></td></tr>
              <tr><td>Runtime</td><td>Confidential VM with remote attestation · HSM-bound issuance keys</td></tr>
              <tr><td>Manifest enforcement</td><td>Independently verifies its local Consent Manifest copy on every sub-query — does not trust the QB's upstream check (defence in depth, see <a className="xref" href="#flow-f3">§03 F3</a>)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* §02b — DEX INTEGRATION */}
      <section id="dex-integration">
        <div className="section-num">02b — EXISTING DEX INFRASTRUCTURE</div>
        <h2>dex Integration Points</h2>
        <p className="section-lede">
          FAM layers on top of dex's existing infrastructure rather than replacing it. The components below exist today and are <em>extended</em> —
          not replaced — by FAM. They are shown with a muted treatment to distinguish them from the seven FAM-native components above.
        </p>

        {/* admin-corev2 */}
        <div className="comp-card existing" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id"><span className="existing-badge">EXISTING</span> admin-corev2</div>
              <div className="comp-name">Org &amp; Consent Registry Backend</div>
              <div className="comp-loc">central · TypeORM + relational store · serves admin-ui</div>
            </div>
          </div>
          <div className="comp-desc">
            The dex platform's central administration backend. Today it manages Organizations, Users, DataElements, UseCases,
            ServiceProviderRelationships, Subscriptions, AuditTrails. FAM extends its data model with three new entity types —
            <code className="inl">DataProviderRelationship</code>, <code className="inl">ConsentManifest</code>, <code className="inl">PETSubscription</code> —
            and adds a single new responsibility: serving as the authoritative consent registry that the Policy Engine queries at every PET-mediated query.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>FAM additions</td><td>ConsentManifest entity (VC + Status List 2021 reference + holder signature) · PETSubscription flag on DataElement rows · DataProviderRelationship records</td></tr>
              <tr><td>Read by</td><td>admin-ui (governance UI) · Policy Engine (manifest lookup at query time) · pitstop-core (PET-flag check on /data) · IR + ASE-IR (manifest distribution sync)</td></tr>
              <tr><td>Written by</td><td>admin-ui (org admin actions) · scheduled jobs (Status List 2021 rotation, key rotation, ε-budget reset) · TLog hooks</td></tr>
              <tr><td>Auth model</td><td>Azure AD MSAL (OAuth 2.0) — unchanged from current dex</td></tr>
            </tbody>
          </table>
        </div>

        {/* admin-ui */}
        <div className="comp-card existing" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id"><span className="existing-badge">EXISTING</span> admin-ui</div>
              <div className="comp-name">Org Governance Portal</div>
              <div className="comp-loc">React SPA · serves super-admins, government staff, and org admins</div>
            </div>
          </div>
          <div className="comp-desc">
            The dex platform's administration portal. FAM adds three new sections — all org-level governance, none transactional —
            and is the only portal with authority to create, sign, or revoke a Consent Manifest. The holder-key signing of the manifest
            occurs in the admin-ui browser session.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>FAM additions — Section 1</td><td><strong>Data Provider Relationships</strong>: org admin views and approves the relationships between their Org and accredited Data Providers (e.g. IR for invoice DataElements)</td></tr>
              <tr><td>FAM additions — Section 2</td><td><strong>Consent Manifest Manager</strong>: wizard to create a manifest (provider → consumer → data elements → query classes → ε-budget → expiry), revoke (Status List 2021 propagation). Holder-key signing happens here.</td></tr>
              <tr><td>FAM additions — Section 3</td><td><strong>PET Subscription Manager</strong>: per-DataElement toggle. Enabling PET means the element moves from pitstop-core's exchange path to the QB's analytical path; consumers can no longer pull, only query.</td></tr>
              <tr><td>Does not handle</td><td>Day-to-day operational actions — those belong in pitstop-ui</td></tr>
            </tbody>
          </table>
        </div>

        {/* pitstop-core */}
        <div className="comp-card existing" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id"><span className="existing-badge">EXISTING</span> pitstop-core</div>
              <div className="comp-name">Data Exchange Plane</div>
              <div className="comp-loc">multi-tenant · one instance per dex-onboarded Organization · runs <code className="inl">/api/v1/data</code></div>
            </div>
          </div>
          <div className="comp-desc">
            The dex platform's existing data-exchange middleware. <strong>pitstop-core remains entirely on the data exchange plane and is not the FAM Query Broker.</strong>
            The two are categorically distinct: pitstop-core returns <em>data</em>; the QB returns only <em>cryptographic results</em> (proofs, noisy aggregates, PSI cardinalities).
            FAM adds a single behavioural change: a middleware gate that checks the PET-subscription flag on the requested DataElement and short-circuits PET-enabled requests with a redirect.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Unchanged surface</td><td>All <code className="inl">/api/v1/data/*</code> routes for non-PET DataElements continue to operate exactly as today</td></tr>
              <tr><td>FAM addition</td><td>PET-flag middleware: if the requested DataElement is PET-enabled, return HTTP 403 with <code className="inl">FAM-Capability-URN</code> header pointing to the QB</td></tr>
              <tr><td>Role in PET flows</td><td>Absent from the call path. The 403 redirect is a defensive backstop only.</td></tr>
              <tr><td>Operated by</td><td>Each Organization's IT team · or a managed pitstop-as-a-service provider</td></tr>
            </tbody>
          </table>
        </div>

        {/* pitstop-ui */}
        <div className="comp-card existing" style={{ marginBottom: 16 }}>
          <div className="comp-head">
            <div>
              <div className="comp-id"><span className="existing-badge">EXISTING</span> pitstop-ui</div>
              <div className="comp-name">Operator &amp; Consumer Portal</div>
              <div className="comp-loc">React SPA · per-Organization deployment · serves operational users</div>
            </div>
          </div>
          <div className="comp-desc">
            The dex platform's existing per-tenant operational portal. FAM adds two capabilities, both of which keep pitstop-ui on the user-facing edge:
            (1) a <em>query interface</em> for PET-enabled DataElements that routes directly to the QB; (2) a <em>read-only Data Governance</em> section
            showing manifest status, ε-budget consumption, and TLog query history.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>FAM addition — Consumer query mode</td><td>For PET-enabled DataElements, the data-element card renders a query interface (capability URN selector + parameters + ε allocation). Submission goes directly to the QB.</td></tr>
              <tr><td>FAM addition — Read-only Data Governance</td><td>Surface for operators (not admins) to monitor active Consent Manifests, ε consumption, and per-manifest TLog query history. <strong>No</strong> create/modify/revoke actions.</td></tr>
              <tr><td>Does not handle</td><td>Consent Manifest signing · ServiceProviderRelationship approval · PET subscription toggle — admin-ui responsibilities</td></tr>
              <tr><td>Calls</td><td>pitstop-core for non-PET data exchange · QB directly for PET queries · admin-corev2 (read-only) for manifest status and ε ledger reads</td></tr>
            </tbody>
          </table>
        </div>

        {/* IR document store */}
        <div className="comp-card existing">
          <div className="comp-head">
            <div>
              <div className="comp-id"><span className="existing-badge">EXISTING (PILOT)</span> IR — Invoice Repository</div>
              <div className="comp-name">Centralised PEPPOL Document Store</div>
              <div className="comp-loc">centralised, Singapore · operated by IR programme team</div>
            </div>
          </div>
          <div className="comp-desc">
            An accredited dex-onboarded Organization that receives PEPPOL invoice payloads forwarded by sender Access Points (C2) in parallel
            to the standard 4-corner path. IR is the document-store half of the IR integration; the analytical-surface half is <strong>ASE-IR</strong>
            (Component 7 above). The two are co-located but separately keyed and operated.
          </div>
          <table className="comp-table">
            <tbody>
              <tr><td>Operated by</td><td>IR programme team — separate legal entity from PEPPOL APs and from ASE-IR</td></tr>
              <tr><td>Holds</td><td>Full PEPPOL invoice payloads forwarded from C2 · keyed by sender UEN + document identifier</td></tr>
              <tr><td>Does <em>not</em> hold</td><td>Any analytical-only material — that is ASE-IR's surface, not IR's</td></tr>
              <tr><td>Ingestion API</td><td>Purpose-built REST endpoint authenticated by AP certificate / mutual TLS · <strong>not pitstop-core <code className="inl">/store</code></strong></td></tr>
              <tr><td>Onboarding in dex</td><td>Organization record + ServiceProviderRelationship per supplier per DataElement (status APPROVED) in admin-corev2</td></tr>
              <tr><td>Status</td><td>Pilot · scope: PEPPOL invoices only (other DataElements held by per-AP ASEs as before)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* §03 — FLOWS */}
      <section id="flows">
        <div className="section-num">03 — THE SEVEN CORE FLOWS</div>
        <h2>Sequence Diagrams for Every Mesh Operation</h2>
        <p className="section-lede">
          Seven flows cover all mesh operations. Each is depicted with explicit actors, messages and side-effects.
          The original 4-corner AS4 flow remains untouched. <a className="xref" href="#flow-f0">F0</a> is the new IR ingestion path;
          <a className="xref" href="#flow-f6"> F6</a> is the multi-Provider fan-out pattern that closes the loop on cross-Provider analytics.
          Jump to: <a className="xref" href="#flow-f0">F0</a> · <a className="xref" href="#flow-f1">F1</a> · <a className="xref" href="#flow-f2">F2</a> · <a className="xref" href="#flow-f3">F3</a> · <a className="xref" href="#flow-f4">F4</a> · <a className="xref" href="#flow-f5">F5</a> · <a className="xref" href="#flow-f6">F6</a>.
        </p>
        {flows.map(f => <FlowCard key={f.id} flow={f} />)}
      </section>

      {/* §04 — WORKED EXAMPLES */}
      <section id="examples">
        <div className="section-num">04 — WORKED EXAMPLES</div>
        <h2>Three Scenarios End-to-End</h2>
        <p className="section-lede">
          How the abstract architecture behaves under real-world demands. Each example pins specific PETs, components and flows to a concrete business scenario.
        </p>

        <div className="example a">
          <div className="ex-head">
            <span className="ex-tag">EXAMPLE A · INVOICE FINANCING</span>
            <div className="ex-title">Acme Pte Ltd seeks S$200K working capital from DBS</div>
            <div className="ex-scenario">Acme has 47 unpaid invoices to several large buyers. DBS needs to verify total receivables exceed S$200K, no invoice has been pledged elsewhere, and counterparty payment behaviour is acceptable — all without seeing line items.</div>
          </div>
          <ul className="ex-steps">
            <li>
              <span className="ex-step-actor">C1 (Acme)</span>
              <span className="ex-step-action">Holds 47 SD-JWT-VCs issued by its AP — one per invoice — bound to its UEN-anchored holder key.</span>
              <span className="ex-step-tech"><a className="xref" href="#flow-f1">Flow F1</a> already executed at issuance time</span>
            </li>
            <li>
              <span className="ex-step-actor">DBS Bank</span>
              <span className="ex-step-action">Issues a presentation request: "prove Σ(unpaid totals) &gt; 200,000 SGD over invoices issued in the last 90 days, and prove non-membership of each invoice ID in any other bank's pledged-invoice accumulator."</span>
              <span className="ex-step-tech"><a className="xref" href="#flow-f2">Flow F2</a> + ZKP capability urn:peppol:analytics:range-proof:receivables:1</span>
            </li>
            <li>
              <span className="ex-step-actor">C1 (Acme)</span>
              <span className="ex-step-action">Generates a Bulletproof range-proof over the Pedersen commitments embedded in each VC, plus 47 accumulator non-membership proofs against the cross-bank duplicate-finance accumulator.</span>
              <span className="ex-step-tech">Bulletproofs · transparent setup · ~700 ms total prove time</span>
            </li>
            <li>
              <span className="ex-step-actor">DBS</span>
              <span className="ex-step-action">Verifies all proofs offline against IMDA-anchored AP issuer keys. No raw invoice data, no line items, no buyer identities are revealed.</span>
              <span className="ex-step-tech">Verification &lt;50 ms</span>
            </li>
            <li>
              <span className="ex-step-actor">Broker (DBS-side)</span>
              <span className="ex-step-action">Logs the financing decision in DBS's transparency log. Acme can later prove what was disclosed.</span>
              <span className="ex-step-tech">Append-only Merkle entry · DLT-anchored hourly</span>
            </li>
          </ul>
          <div className="ex-result">
            <strong>Outcome:</strong> Financing decision in seconds. DBS sees only "Σ &gt; 200K" and "no duplicates"; Acme retains complete confidentiality over commercial terms with its buyers. Section 47 banking-secrecy concerns minimised.
          </div>
        </div>

        <div className="example b">
          <div className="ex-head">
            <span className="ex-tag">EXAMPLE B · DUPLICATE-FINANCE DETECTION</span>
            <div className="ex-title">Bank X presents invoice INV-12345 for financing — has any other bank already taken it?</div>
            <div className="ex-scenario">In Singapore today, the MonetaGo / ABS Trade Finance Registry handles this with hashed fingerprints. The mesh upgrades the protocol with formal PSI guarantees: the registry operator does not learn the queries.</div>
          </div>
          <ul className="ex-steps">
            <li>
              <span className="ex-step-actor">Bank X</span>
              <span className="ex-step-action">Computes h = SHA-256(canonicalised invoice fields) and asks "is h in any other bank's pledged-invoice set?"</span>
              <span className="ex-step-tech">capability urn:peppol:analytics:duplicate-check:1</span>
            </li>
            <li>
              <span className="ex-step-actor">Query Broker</span>
              <span className="ex-step-action">Discovers all participating bank ASEs via the ASR. Initiates an N-party PSI protocol.</span>
              <span className="ex-step-tech"><a className="xref" href="#flow-f4">Flow F4</a> · KKRT-style PSI · OPRF</span>
            </li>
            <li>
              <span className="ex-step-actor">All bank ASEs</span>
              <span className="ex-step-action">Engage in oblivious PRF rounds. Each bank's pledged-invoice set is encoded as a Bloom filter of OPRF-evaluated hashes; intersection is computed obliviously.</span>
              <span className="ex-step-tech">~6 round trips · &lt;30 s wall-clock for cohort of 12 banks</span>
            </li>
            <li>
              <span className="ex-step-actor">Broker</span>
              <span className="ex-step-action">Returns binary result {'{0, 1}'} to Bank X. Each ASE that contributed signs the federation-event log entry.</span>
              <span className="ex-step-tech">Multi-party signature · TLog inclusion proof</span>
            </li>
          </ul>
          <div className="ex-result">
            <strong>Outcome:</strong> Bank X learns whether the invoice is already pledged. <strong>What no one learns:</strong> which other banks have which invoices, what other queries Bank X is making, whether unrelated invoices are pledged.
          </div>
        </div>

        <div className="example c">
          <div className="ex-head">
            <span className="ex-tag">EXAMPLE C · IRAS GST AUDIT</span>
            <div className="ex-title">IRAS investigates GST anomalies in the F&amp;B sector for FY2026</div>
            <div className="ex-scenario">IRAS already receives a copy of every in-scope invoice under the GST InvoiceNow Requirement. The mesh adds a privacy-preserving analytical layer for queries that span multiple taxpayers without de-anonymising any single one.</div>
          </div>
          <ul className="ex-steps">
            <li>
              <span className="ex-step-actor">IRAS analyst</span>
              <span className="ex-step-action">Submits a query: "compute the distribution of GST-to-revenue ratios across F&amp;B SSIC code 56 firms with annual turnover S$1m–10m, with DP ε ≤ 1."</span>
              <span className="ex-step-tech">capability urn:peppol:analytics:dp-aggregate:1</span>
            </li>
            <li>
              <span className="ex-step-actor">Policy Engine</span>
              <span className="ex-step-action">Verifies IRAS's audit-purpose VC, checks the requested ε against IRAS's annual privacy budget, returns a permit + obligation attaching ε = 1.</span>
              <span className="ex-step-tech">Cedar policy · MAS / IRAS sectoral codes</span>
            </li>
            <li>
              <span className="ex-step-actor">Broker</span>
              <span className="ex-step-action">Routes the query to the IR directly — IRAS already holds a copy of all in-scope invoices via the InvoiceNow pipeline, so no ASE fan-out is needed. The IR computes the DP-aggregate locally, adds calibrated Laplace noise, returns the noisy result.</span>
              <span className="ex-step-tech">Sensitivity Δ bounded by per-firm clipping · σ = Δ / ε</span>
            </li>
            <li>
              <span className="ex-step-actor">Broker</span>
              <span className="ex-step-action">Aggregates per-ASE noisy results. Returns histogram to IRAS. Logs ε spent (1) against IRAS's annual budget.</span>
              <span className="ex-step-tech">Composition theorem applied · receipt issued</span>
            </li>
            <li>
              <span className="ex-step-actor">Data owners</span>
              <span className="ex-step-action">Each affected firm can fetch from the transparency log the fact that an IRAS audit query touched its data, and the ε spent. Cannot determine which other firms were in the cohort.</span>
              <span className="ex-step-tech">Inclusion proof · per-owner derivation</span>
            </li>
          </ul>
          <div className="ex-result">
            <strong>Outcome:</strong> IRAS gains valuable sectoral signal without any single firm's GST ratio being learnable from the result. The architecture extends IRAS's existing 5th-corner role to richer analytics without requiring new data flows.
          </div>
        </div>
      </section>

      {/* §05 — PROTOCOL STACK */}
      <section id="stack">
        <div className="section-num">05 — PROTOCOL STACK</div>
        <h2>From Wire Format to Trust Anchor</h2>
        <p className="section-lede">The mesh layers cleanly onto existing PEPPOL infrastructure. Each layer below has a single responsibility and well-defined neighbours.</p>
        <div className="stack">
          {[
            { l: 'L7', name: 'Analytical Application', tech: 'Banks · IRAS · MAS · enterprises · auditors · data-owner self-service', spec: ['capability URNs', 'VC presentations'] },
            { l: 'L6', name: 'Query & Authorisation', tech: 'Query Broker · GNAP authorisation · ABAC policy evaluation · privacy-budget accounting', spec: ['RFC 9635', 'OPA Rego / Cedar'] },
            { l: 'L5', name: 'PET Primitives', tech: 'SD-JWT-VC · BBS+ · Bulletproofs / zk-SNARKs · KKRT-PSI · SPDZ-MPC · DP-SGD · NVIDIA FLARE', spec: ['W3C VCDM 2.0', 'NIST DP guides'] },
            { l: 'L4', name: 'Confidential Computing', tech: 'Intel TDX · AMD SEV-SNP · AWS Nitro Enclaves · GCP Confidential Space · remote attestation', spec: ['RA-TLS', 'RATS framework'] },
            { l: 'L3', name: 'Audit & Notarisation', tech: 'Append-only Merkle log · Signed Tree Heads · DLT anchoring (XDC / Polygon / Ethereum)', spec: ['RFC 6962', 'chain-agnostic'] },
            { l: 'L2', name: 'Discovery', tech: 'SML DNS root · SMP per-AP metadata · ASR analytical-capability registry · DID:web', spec: ['OpenPeppol PIF', 'RFC 6763 SRV'] },
            { l: 'L1', name: 'Transport & Document Exchange', tech: 'AS4 over HTTPS · PINT-SG billing · UBL 2.1 · existing 4-corner unchanged', spec: ['OpenPeppol AS4', 'PINT-SG'] },
          ].map(r => (
            <div key={r.l} className="stack-row">
              <div className="stack-layer">{r.l}</div>
              <div className="stack-content">
                <div className="stack-name">{r.name}</div>
                <div className="stack-tech">{r.tech}</div>
              </div>
              <div className="stack-spec">
                {r.spec.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="callout">
          <strong>Layering principle:</strong> the FAM sits in L2–L6, sharing L1 transport with classical PEPPOL exchange and sharing L2 discovery.
          An AP that does not yet operate an ASE remains fully PEPPOL-compatible — the mesh is opt-in at the network level.
        </div>
      </section>

      {/* §06 — ASR DISCOVERY */}
      <section id="discovery">
        <div className="section-num">06 — ASR DISCOVERY INTERNALS</div>
        <h2>How a Consumer Finds the Right Endpoint</h2>
        <p className="section-lede">The Analytical Service Registry reuses PEPPOL's existing DNS-based discovery model. No new global registry, no central directory, no SML hard-fork.</p>
        <div className="asr-grid">
          <div className="asr-card">
            <h3>URN scheme for analytical capabilities</h3>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65 }}>
              Capabilities follow a hierarchical URN namespace. Versions allow non-breaking extension; obsolete capabilities can be deprecated without disturbing live consumers.
            </p>
            <pre className="code">
<span className="c"># pattern</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:&lt;capability&gt;:&lt;version&gt;{'\n\n'}
<span className="c"># examples</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">duplicate-check</span>:<span className="n">1</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">range-proof:receivables</span>:<span className="n">1</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">zkp:gst-correctness</span>:<span className="n">1</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">fedlearn:fraud</span>:<span className="n">2</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">dp-aggregate</span>:<span className="n">1</span>{'\n'}
<span className="k">urn:peppol:analytics</span>:<span className="s">psi:sanctions</span>:<span className="n">1</span>
            </pre>
          </div>

          <div className="asr-card">
            <h3>DNS resolution path</h3>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65 }}>
              A consumer with a participant's PEPPOL ID resolves analytical services via SRV records, exactly as it resolves AS4 endpoints today via the SMP.
            </p>
            <pre className="code">
<span className="c"># 1. resolve participant → SMP location</span>{'\n'}
B-{'{'}md5(participant){'}'}.iso6523-actorid-upis.{'{'}sml-zone{'}'}{'\n\n'}
<span className="c"># 2. SMP returns ServiceMetadata document</span>{'\n'}
<span className="c">#    new node: AnalyticalServices block</span>{'\n\n'}
<span className="c"># 3. for each capability URN:</span>{'\n'}
&lt;<span className="k">AnalyticalService</span>&gt;{'\n'}
{'  '}&lt;<span className="k">CapabilityID</span>&gt;urn:peppol:analytics:duplicate-check:1&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">EndpointURL</span>&gt;https://ase.ap-x.sg/v1&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">Certificate</span>&gt;...&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">SLA</span>&gt;p50_2s, p99_10s&lt;/&gt;{'\n'}
&lt;/<span className="k">AnalyticalService</span>&gt;
            </pre>
          </div>

          <div className="asr-card">
            <h3>Capability negotiation</h3>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65 }}>
              A consumer announces required capabilities; the broker matches against ASR entries; failed matches return precise diagnostic errors.
            </p>
            <pre className="code">
<span className="c"># consumer side</span>{'\n'}
<span className="k">QueryRequest</span> {'{'}{'\n'}
{'  '}<span className="k">capability</span>: <span className="s">"urn:peppol:analytics:psi:duplicate:1"</span>,{'\n'}
{'  '}<span className="k">scope</span>: {'{ '}<span className="k">cohort</span>: <span className="s">"banks-sg-licensed"</span> {'}'},{'\n'}
{'  '}<span className="k">params</span>: {'{ '}<span className="k">invoice_hash</span>: <span className="s">"0xabc..."</span> {'}'},{'\n'}
{'  '}<span className="k">vc_presentation</span>: <span className="s">"eyJhbGc..."</span>,{'\n'}
{'  '}<span className="k">privacy_budget</span>: {'{ '}<span className="k">epsilon</span>: <span className="n">1.0</span> {'}'}{'\n'}
{'}'}
            </pre>
          </div>

          <div className="asr-card">
            <h3>Governance &amp; versioning</h3>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65 }}>
              OpenPeppol's Coordinating Community pattern, already used for the billing post-award workflow, is reused for analytical capabilities.
              A new sub-community — the Analytical Services Coordinating Community — owns the URN registry.
            </p>
            <ul style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65, listStyle: 'none', marginTop: 12 }}>
              <li style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}><strong style={{ color: 'var(--text)' }}>Major version:</strong> incompatible change · breaking</li>
              <li style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}><strong style={{ color: 'var(--text)' }}>Minor version:</strong> additive · backwards-compatible</li>
              <li style={{ padding: '6px 0' }}><strong style={{ color: 'var(--text)' }}>Deprecation:</strong> 12-month sunset window with parallel availability</li>
            </ul>
          </div>

          <div className="asr-card">
            <h3>Mapping to dex DataElementIDs</h3>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65 }}>
              A consumer asking the FAM to query <em>data</em> rather than <em>compute a capability</em> targets a dex DataElement.
              Dex uses plain-string identifiers (no URN prefix), so the ASR exposes them alongside the analytical capability URNs.
            </p>
            <pre className="code">
<span className="c"># dex-current DataElementIDs (plain strings)</span>{'\n'}
<span className="k">sales_invoice</span>{'\n'}
<span className="k">sales_invoice.total</span>{'\n'}
<span className="k">sales_invoice.due_date</span>{'\n'}
<span className="k">sales_invoice.buyer_uen</span>{'\n'}
<span className="k">bol.shipment</span>{'\n\n'}
<span className="c"># exposed in the ASR alongside capability URNs</span>{'\n'}
&lt;<span className="k">DataElement</span>&gt;{'\n'}
{'  '}&lt;<span className="k">DataElementID</span>&gt;sales_invoice&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">Provider</span>&gt;<span className="s">did:ethr:0x… (IR)</span>&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">EndpointURL</span>&gt;https://ir.invoicenow.gov.sg/ase/v1&lt;/&gt;{'\n'}
{'  '}&lt;<span className="k">PETSubscription</span>&gt;true&lt;/&gt;{'\n'}
&lt;/<span className="k">DataElement</span>&gt;
            </pre>
          </div>
        </div>
      </section>

      {/* §07 — THREAT MODEL */}
      <section id="threat">
        <div className="section-num">07 — TRUST BOUNDARIES &amp; THREAT MODEL</div>
        <h2>What Adversaries Cannot Achieve</h2>
        <p className="section-lede">Eleven adversary classes considered. Each row states the capability assumed, the attack the adversary attempts, and the defence-in-depth mitigation.</p>
        <table className="threat-table">
          <thead>
            <tr>
              <th>Adversary</th>
              <th>Capability</th>
              <th>Attack</th>
              <th>Mitigation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { adv: 'Honest-but-curious AP', cap: 'Sees all invoices it processes; runs ASE', att: 'Infer cross-AP patterns from query timing', mit: 'PSI / MPC ensure no AP learns another\'s data; randomised query padding; transparency log makes inference visible', st: 'contained' },
              { adv: 'Malicious AP', cap: 'Operates ASE incorrectly', att: 'Forge attestations · withhold queries', mit: 'TEE remote attestation · result-attestations signed inside enclave · transparency log catches omissions', st: 'contained' },
              { adv: 'Malicious consumer', cap: 'Holds valid VC for some queries', att: 'Re-identify firms by repeated narrow queries', mit: 'Privacy-budget accounting (ε caps per consumer per period) · pattern detection in policy engine', st: 'contained' },
              { adv: 'Compromised TEE', cap: 'Side-channel attack (Foreshadow, MDS)', att: 'Extract enclave keys', mit: 'Hardware refresh cadence · MPC layer survives single-enclave compromise · multi-vendor TEE diversity', st: 'partial' },
              { adv: 'Network adversary', cap: 'Reads / modifies transit', att: 'Eavesdropping · injection', mit: 'RA-TLS for ASE-to-broker · AS4 for document path · all messages signed', st: 'contained' },
              { adv: 'Compromised VCIS key', cap: 'Issues forged VCs', att: 'Inject fraudulent attestations', mit: 'HSM-bound issuer keys · short rotation · revocation of all tainted credentials · transparency log catches', st: 'contained' },
              { adv: 'Colluding ASEs', cap: 'k of n ASEs collude', att: 'Recover other ASE\'s data through MPC', mit: 'Threshold MPC requires ≥ t honest parties · choose t to dominate any plausible coalition (Singapore: t=3 of n=10)', st: 'partial' },
              { adv: 'Quantum adversary (future)', cap: 'Cryptanalytically relevant quantum computer', att: 'Break ECDSA / pairings', mit: 'Migrate to STARKs (post-quantum) · hybrid PQC signatures (Dilithium + ECDSA) · MAS / Banque de France PQC alignment', st: 'residual' },
              { adv: 'IR operator (privileged)', cap: 'Holds full PEPPOL invoice payloads as accredited Data Provider', att: 'Side-channel reads of payloads · circumvent PET-mediation', mit: 'All consumer access mediated through ASE-IR PET layer (no raw read API exposed); HSM-bound keys; IMDA AP-Plus accreditation; Consent Manifest verification at ASE-IR on every query; transparency-log inclusion proofs; separation of duty between IR document-store team and ASE-IR operator', st: 'contained' },
              { adv: 'Compromised Query Broker', cap: 'Routes consumer queries; passes Gate 1', att: 'Dispatch a malformed or over-scoped sub-query to ASE-IR', mit: 'Defence in depth: ASE-IR holds an independent local Consent Manifest copy and re-verifies every sub-query at Gate 2. Mismatch triggers a signed refusal and a Tier 2 incident — IMDA notification within 2 hours. ε ledger is HSM-attested and atomic.', st: 'contained' },
              { adv: 'Manifest revocation race', cap: 'Owner revokes manifest after Gate 1 but before Gate 2', att: 'Sub-query executes against revoked manifest', mit: 'Status List 2021 propagation SLA of ≤ 60 seconds to ASE-IR (matches TLog STH cadence). Sequential gate ordering minimises the race window.', st: 'residual' },
            ].map((r, i) => (
              <tr key={i}>
                <td className="threat-name">{r.adv}</td>
                <td>{r.cap}</td>
                <td>{r.att}</td>
                <td className="threat-mit">{r.mit}</td>
                <td><span className={`badge ${r.st}`}>{r.st.charAt(0).toUpperCase() + r.st.slice(1)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* §08 — RESILIENCE */}
      <section id="resilience">
        <div className="section-num">08 — FAILURE MODES &amp; RESILIENCE</div>
        <h2>How the Mesh Degrades Gracefully</h2>
        <p className="section-lede">Each component can fail. The mesh's graceful-degradation property is that no single failure cascades into a confidentiality violation or a data loss.</p>
        <div className="failure-list">
          {[
            { name: 'Single ASE offline', resp: <>Queries that span the offline ASE return a marked degradation flag and a reduced cohort. Document path (AS4) unaffected. <em>Recovery: automatic on ASE restart.</em></> },
            { name: 'Query Broker outage', resp: <>Consumers fail over to peer brokers via ASR-published replicas. <a className="xref" href="#flow-f2">F2</a> disclosure flow continues unaffected. <em>Recovery: peer-to-peer broker topology eliminates single-point dependency.</em></> },
            { name: 'Transparency log inconsistency', resp: <>Mismatch between Signed Tree Head and DLT anchor triggers automatic gossip-based reconciliation. Consumers detecting inconsistency proofs raise public alerts. <em>Recovery: all events are deterministic; replay rebuilds the log.</em></> },
            { name: 'DLT anchor chain forks / outage', resp: <>Anchoring is best-effort and chain-agnostic. The mesh tolerates DLT outages; Signed Tree Heads queue and anchor on chain recovery. Multi-chain anchoring optional for highest assurance. <em>Recovery: chain-agnostic by design.</em></> },
            { name: 'VCIS key compromise', resp: <>All VCs from the affected key window are revoked via the status list. Re-issuance happens against a fresh key. Transparency log allows post-hoc audit of forged-VC scope. <em>Recovery: 60-second status-list refresh window limits exposure.</em></> },
            { name: 'Privacy-budget exhaustion', resp: <>A consumer that has exhausted its annual ε is rejected by the policy engine. Data owners can review the consumer's complete query history from their derived transparency-log view. <em>Recovery: budget renews on policy-engine renewal cycle.</em></> },
            { name: 'SML / SMP outage', resp: <>Inherited PEPPOL behaviour: cached SMP records continue to function during transient outages. ASR shares this caching behaviour. <em>Recovery: standard PEPPOL operational practice applies.</em></> },
            { name: 'Federated-learning round failure', resp: <>If &lt; minimum quorum of ASEs participate in a round, the round is aborted; no model update committed. Aggregator publishes the failure to the transparency log. <em>Recovery: skip round, retry next scheduled cycle.</em></> },
          ].map((f, i) => (
            <div key={i} className="failure">
              <div className="failure-icon">!</div>
              <div>
                <div className="failure-name">{f.name}</div>
                <div className="failure-resp">{f.resp}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="callout" style={{ marginTop: 28 }}>
          <strong>The deepest resilience property:</strong> because no component has unique custody of any invoice, no failure of any operator can result in invoice loss.
          The worst case for the mesh is <em>analytical unavailability</em>, never <em>data unavailability</em>. The 4-corner document path is independently resilient and unaffected.
        </div>
      </section>

      <footer className="footer">
        <div>
          <span className="footer-tag">Architecture Deep-Dive</span>
          <span className="footer-tag">B-1.a · FAM</span>
        </div>
        <div>April 2026 · UK English · part of the Federated Analytics Mesh (FAM) blueprint series</div>
      </footer>
    </div>
  )
}
