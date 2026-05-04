import './FifthCorner.css'
import FamOverviewDiagram from '../components/FamOverviewDiagram';

export default function FifthCorner() {
  return (
    <div className="doc fifth-corner-page">

      {/* ============== HEADER ============== */}
      <header className="header">
        <nav className="breadcrumb">
          <span>Architectural Blueprint</span>
          <span className="sep">/</span>
          <span>Federated Analytics Mesh (FAM)</span>
          <span className="sep">/</span>
          <span className="current">Overview</span>
        </nav>
        <div className="eyebrow">Architectural Blueprint · Singapore InvoiceNow · IMDA</div>
        <h1 className="title">
          Federated Analytics <span className="accent">Mesh (FAM)</span><br />
          A Transport-Agnostic Privacy-Preserving Analytics Protocol
        </h1>
        <p className="subtitle">
          Extending the canonical 4-corner network with an analytical layer for banks, auditors and
          enterprises — without centralising a single invoice.
        </p>

        <div className="meta-row">
          <div className="meta-item">
            <span className="meta-label">Anchor Jurisdiction</span>
            <span className="meta-value">Singapore · IMDA · IRAS · MAS</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Use-Case Priority</span>
            <span className="meta-value">A → B → C</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Mandate Window</span>
            <span className="meta-value">Nov 2025 → Apr 2031</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Documents</span>
            <span className="meta-value">Always remain at C1 / C4</span>
          </div>
        </div>
      </header>

      {/* ============== KEY NUMBERS ============== */}
      <section>
        <div className="kv-grid">
          <div className="kv">
            <div className="kv-num">63K+</div>
            <div className="kv-label">Singapore businesses already on the InvoiceNow network</div>
          </div>
          <div className="kv">
            <div className="kv-num">10</div>
            <div className="kv-label">PETs evaluated in parallel with pragmatic alternatives</div>
          </div>
          <div className="kv">
            <div className="kv-num">3</div>
            <div className="kv-label">Composable PET layers in the recommended mesh</div>
          </div>
          <div className="kv">
            <div className="kv-num">0</div>
            <div className="kv-label">Centralised invoice repositories required</div>
          </div>
        </div>
      </section>

      {/* ============== SECTION 1 — BEFORE / AFTER ============== */}
      <section>
        <div className="section-num">01 — THE SHIFT</div>
        <h2>From a 4-Corner Network to a Federated Analytics Mesh</h2>
        <p className="section-lede">
          Singapore already operates a quasi-5th corner today: IRAS receives a copy of every
          in-scope invoice via the AP layer under the GST InvoiceNow Requirement. The strategic
          move is to generalise that pattern — privately — for banks, auditors and enterprises.
          PEPPOL documents flow to the Invoice Repository (IR) via C2 in parallel to the standard
          C2→C3→C4 path. IR is a dex-onboarded data-holding Organization, not a Data Owner; the
          data owners remain the supplier (C1) and buyer (C4).
        </p>

        <div className="before-after">
          {/* BEFORE */}
          <div className="ba-card">
            <span className="ba-tag">Today · 4-Corner</span>
            <div className="ba-title">Document exchange only</div>
            <svg className="corner-svg" viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#5a6584" />
                </marker>
                <linearGradient id="c1Grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3050" />
                  <stop offset="100%" stopColor="#1a2238" />
                </linearGradient>
                <linearGradient id="c2Grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e2545" />
                  <stop offset="100%" stopColor="#1a2238" />
                </linearGradient>
              </defs>

              {/* Discovery band */}
              <line x1="100" y1="195" x2="380" y2="195" stroke="#2a3656" strokeWidth="1" strokeDasharray="4,4" />
              <text x="240" y="215" textAnchor="middle" fill="#3d4a73" fontSize="9" letterSpacing="0.06em">SML / SMP DISCOVERY</text>

              {/* C1 */}
              <circle cx="60" cy="120" r="30" fill="url(#c1Grad4)" stroke="#38bdf8" strokeWidth="1.8" />
              <circle cx="60" cy="120" r="30" fill="none" stroke="#38bdf8" strokeWidth="0.6" opacity="0.3" />
              <text x="60" y="116" textAnchor="middle" fill="#e8edf7" fontSize="14" fontWeight="700">C1</text>
              <text x="60" y="130" textAnchor="middle" fill="#cdd5e8" fontSize="9">Supplier</text>
              <text x="60" y="165" textAnchor="middle" fill="#4a5a7a" fontSize="9">ERP · IRSP</text>

              {/* C2 */}
              <rect x="148" y="92" width="68" height="56" rx="10" fill="url(#c2Grad4)" stroke="#818cf8" strokeWidth="1.8" />
              <text x="182" y="118" textAnchor="middle" fill="#e8edf7" fontSize="14" fontWeight="700">C2</text>
              <text x="182" y="134" textAnchor="middle" fill="#cdd5e8" fontSize="9">Sender AP</text>
              <text x="182" y="165" textAnchor="middle" fill="#4a5a7a" fontSize="9">IMDA-accredited</text>

              {/* C3 */}
              <rect x="264" y="92" width="68" height="56" rx="10" fill="url(#c2Grad4)" stroke="#a78bfa" strokeWidth="1.8" />
              <text x="298" y="118" textAnchor="middle" fill="#e8edf7" fontSize="14" fontWeight="700">C3</text>
              <text x="298" y="134" textAnchor="middle" fill="#cdd5e8" fontSize="9">Receiver AP</text>
              <text x="298" y="165" textAnchor="middle" fill="#4a5a7a" fontSize="9">IMDA-accredited</text>

              {/* C4 */}
              <circle cx="420" cy="120" r="30" fill="url(#c1Grad4)" stroke="#f472b6" strokeWidth="1.8" />
              <circle cx="420" cy="120" r="30" fill="none" stroke="#f472b6" strokeWidth="0.6" opacity="0.3" />
              <text x="420" y="116" textAnchor="middle" fill="#e8edf7" fontSize="14" fontWeight="700">C4</text>
              <text x="420" y="130" textAnchor="middle" fill="#cdd5e8" fontSize="9">Buyer</text>
              <text x="420" y="165" textAnchor="middle" fill="#4a5a7a" fontSize="9">ERP · IRSP</text>

              {/* Arrows */}
              <line x1="94" y1="120" x2="143" y2="120" stroke="#4a5a7a" strokeWidth="1.8" markerEnd="url(#arrow1)" />
              <line x1="217" y1="120" x2="259" y2="120" stroke="#4a5a7a" strokeWidth="1.8" markerEnd="url(#arrow1)" />
              <line x1="333" y1="120" x2="385" y2="120" stroke="#4a5a7a" strokeWidth="1.8" markerEnd="url(#arrow1)" />

              {/* Protocol label */}
              <text x="240" y="72" textAnchor="middle" fill="#4a5a7a" fontSize="9" letterSpacing="0.06em">AS4 · PINT-SG</text>
            </svg>
            <ul className="ba-bullets">
              <li>Invoices move sender → receiver via two Access Points</li>
              <li>No analytical layer; documents not retrievable post-send</li>
              <li>"Network functions like email" — IMDA design tenet</li>
            </ul>
          </div>

          {/* AFTER */}
          <div className="ba-card proposed">
            <span className="ba-tag">Proposed · Federated Analytics Mesh</span>
            <div className="ba-title">Document exchange + privacy-preserving analytics</div>
            <svg className="corner-svg" viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#5a6584" />
                </marker>
                <marker id="arrowg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#39ff84" />
                </marker>
                <marker id="arrowgout" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#39ff84" />
                </marker>
                <linearGradient id="c1Grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3050" />
                  <stop offset="100%" stopColor="#1a2238" />
                </linearGradient>
                <linearGradient id="c2Grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e2545" />
                  <stop offset="100%" stopColor="#1a2238" />
                </linearGradient>
                <linearGradient id="aseGrad5" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0d1a2a" />
                  <stop offset="100%" stopColor="#071018" />
                </linearGradient>
                <filter id="glow5" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Doc-path band label */}
              <text x="118" y="22" textAnchor="middle" fill="#3d4a73" fontSize="9" letterSpacing="0.08em">DOCUMENT PATH (UNCHANGED)</text>

              {/* IR (parallel recipient from C2) */}
              <rect x="332" y="14" width="62" height="22" rx="5" fill="url(#c2Grad5)" stroke="#38bdf8" strokeWidth="1.4" />
              <text x="363" y="29" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">IR</text>
              <line x1="180" y1="56" x2="335" y2="32" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,3" markerEnd="url(#arrow2)" />

              {/* ASE-IR (co-located with IR) */}
              <rect x="408" y="120" width="62" height="34" rx="7" fill="url(#aseGrad5)" stroke="#39ff84" strokeWidth="1.5" />
              <text x="439" y="135" textAnchor="middle" fill="#39ff84" fontSize="11" fontWeight="700">ASE</text>
              <text x="439" y="147" textAnchor="middle" fill="#39ff84" fontSize="7" opacity="0.7">@ IR</text>
              {/* IR → ASE-IR connector — bends east of C4 (max x≈406) */}
              <path d="M 394 25 L 460 25 L 460 120" fill="none" stroke="#39ff84" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" markerEnd="url(#arrowg)" />
              <text x="262" y="40" textAnchor="middle" fill="#38bdf8" fontSize="7" opacity="0.75">parallel forward</text>

              {/* C1 */}
              <circle cx="50" cy="80" r="24" fill="url(#c1Grad5)" stroke="#38bdf8" strokeWidth="1.8" />
              <circle cx="50" cy="80" r="24" fill="none" stroke="#38bdf8" strokeWidth="0.6" opacity="0.3" />
              <text x="50" y="76" textAnchor="middle" fill="#e8edf7" fontSize="12" fontWeight="700">C1</text>
              <text x="50" y="90" textAnchor="middle" fill="#cdd5e8" fontSize="8">Supplier</text>

              {/* C2 */}
              <rect x="136" y="56" width="58" height="48" rx="8" fill="url(#c2Grad5)" stroke="#818cf8" strokeWidth="1.8" />
              <text x="165" y="78" textAnchor="middle" fill="#e8edf7" fontSize="12" fontWeight="700">C2</text>
              <text x="165" y="94" textAnchor="middle" fill="#cdd5e8" fontSize="8">Sender AP</text>

              {/* C3 */}
              <rect x="246" y="56" width="58" height="48" rx="8" fill="url(#c2Grad5)" stroke="#a78bfa" strokeWidth="1.8" />
              <text x="275" y="78" textAnchor="middle" fill="#e8edf7" fontSize="12" fontWeight="700">C3</text>
              <text x="275" y="94" textAnchor="middle" fill="#cdd5e8" fontSize="8">Receiver AP</text>

              {/* C4 */}
              <circle cx="382" cy="80" r="24" fill="url(#c1Grad5)" stroke="#f472b6" strokeWidth="1.8" />
              <circle cx="382" cy="80" r="24" fill="none" stroke="#f472b6" strokeWidth="0.6" opacity="0.3" />
              <text x="382" y="76" textAnchor="middle" fill="#e8edf7" fontSize="12" fontWeight="700">C4</text>
              <text x="382" y="90" textAnchor="middle" fill="#cdd5e8" fontSize="8">Buyer</text>

              {/* Doc path arrows */}
              <line x1="75" y1="80" x2="131" y2="80" stroke="#4a5a7a" strokeWidth="1.5" markerEnd="url(#arrow2)" />
              <line x1="195" y1="80" x2="241" y2="80" stroke="#4a5a7a" strokeWidth="1.5" markerEnd="url(#arrow2)" />
              <line x1="305" y1="80" x2="357" y2="80" stroke="#4a5a7a" strokeWidth="1.5" markerEnd="url(#arrow2)" />

              {/* ASEs */}
              <rect x="136" y="122" width="58" height="34" rx="7" fill="url(#aseGrad5)" stroke="#39ff84" strokeWidth="1.5" />
              <text x="165" y="137" textAnchor="middle" fill="#39ff84" fontSize="11" fontWeight="700">ASE</text>
              <text x="165" y="149" textAnchor="middle" fill="#39ff84" fontSize="7" opacity="0.7">@ C2</text>

              <rect x="246" y="122" width="58" height="34" rx="7" fill="url(#aseGrad5)" stroke="#39ff84" strokeWidth="1.5" />
              <text x="275" y="137" textAnchor="middle" fill="#39ff84" fontSize="11" fontWeight="700">ASE</text>
              <text x="275" y="149" textAnchor="middle" fill="#39ff84" fontSize="7" opacity="0.7">@ C3</text>

              {/* AP → ASE connectors */}
              <line x1="165" y1="104" x2="165" y2="122" stroke="#39ff84" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
              <line x1="275" y1="104" x2="275" y2="122" stroke="#39ff84" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />

              {/* Animated mesh link between ASEs */}
              <line x1="194" y1="139" x2="246" y2="139" stroke="#39ff84" strokeWidth="2" strokeDasharray="5,3">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.4s" repeatCount="indefinite" />
              </line>

              {/* C5 Consumer */}
              <rect x="185" y="188" width="110" height="38" rx="8" fill="#0a0f1c" stroke="#fbbf24" strokeWidth="1.8" />
              <text x="240" y="204" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">IRAS (C5)</text>
              <text x="240" y="218" textAnchor="middle" fill="#cdd5e8" fontSize="8">GST audit · 5th corner</text>

              {/* C2 → IRAS: parallel forward — bends left of ASE@C2 (x=136–194, y=122–156) */}
              <path d="M 136 104 L 112 104 L 112 207 L 185 207" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,3" markerEnd="url(#arrow2)">
                <animate attributeName="stroke-dashoffset" from="21" to="0" dur="1.2s" repeatCount="indefinite" />
              </path>
              <text x="96" y="158" textAnchor="middle" fill="#38bdf8" fontSize="7" opacity="0.75">parallel forward</text>

              {/* Label: analytics overlay */}
              <text x="432" y="140" textAnchor="end" fill="#39ff84" fontSize="8" fontWeight="600" letterSpacing="0.06em">ANALYTICS OVERLAY</text>
              <text x="432" y="151" textAnchor="end" fill="#39ff84" fontSize="7" opacity="0.6">queries only · data stays</text>
            </svg>
            <ul className="ba-bullets">
              <li>Analytical Service Endpoints (ASEs) sit <em>adjacent to</em> APs — never in the document path</li>
              <li>The Invoice Repository (IR) receives a parallel copy of each PEPPOL invoice from C2 — accredited Data Provider, PET-mediated query layer only</li>
              <li>Queries travel to data; data never travels to queries</li>
              <li>Every query logged in tamper-evident transparency log; data owners sign Consent Manifests held by both IR and dex</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============== SECTION 2 — ARCHITECTURE ============== */}
      <section>
        <div className="section-num">02 — ARCHITECTURE</div>
        <h2>The FAM Architecture</h2>
        <p className="section-lede">
          The FAM is not a place — it is a <em>role</em>. Each Access Point operates an Analytical
          Service Endpoint (ASE) holding only cryptographic commitments, attestations and model
          parameters. Documents stay where they were generated.
        </p>

        <div className="arch-container" style={{ padding: 0, aspectRatio: '1140/840', overflow: 'hidden' }}>
          <FamOverviewDiagram />
        </div>
      </section>

      {/* ============== SECTION 3 — PET LAYERS ============== */}
      <section>
        <div className="section-num">03 — PET STACK</div>
        <h2>Three Composable Privacy Layers, Selectively Applied</h2>
        <p className="section-lede">
          PETs and pragmatic alternatives are evaluated <em>in parallel</em> — none is a fallback.
          Each layer addresses a different threat and use-case profile; together they form the
          cryptographic spine of the mesh.
        </p>

        <div className="pet-layers">
          <div className="pet-card l1">
            <div className="pet-layer-label">Layer L1 · Disclosure</div>
            <div className="pet-name">Selective Disclosure &amp; Verifiable Credentials</div>
            <div className="pet-desc">
              Per-invoice attestations issued by IR's VCIS at ingestion (or by per-AP VCIS for
              non-invoice DataElements). Holders reveal only the attributes a counterparty needs —
              total, GST, due date — without the full document.
            </div>
            <div className="pet-tech">
              <span className="pet-chip">W3C VCDM 2.0</span>
              <span className="pet-chip">SD-JWT-VC</span>
              <span className="pet-chip">BBS+</span>
            </div>
            <div className="pet-applies">
              <span className="pet-tag tag-a">Use Case A · Very High</span>
              <span className="pet-tag tag-b">B · High</span>
            </div>
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--text)' }}>Consent Manifest:</strong> a VC-shaped artefact
              issued by the data owner (not by the Provider). Both the data-holding Organization (e.g.
              IR) and dex (admin-corev2) hold a verified copy and check it independently at query time.
              Anchored in the transparency log. Revocation via Status List 2021.
            </div>
          </div>

          <div className="pet-card l2">
            <div className="pet-layer-label">Layer L2 · Learning</div>
            <div className="pet-name">Federated Learning + Differential Privacy</div>
            <div className="pet-desc">
              Each ASE trains a local model on its corner's invoices. Gradients (never invoices) are
              aggregated with secure aggregation and ε-bounded noise.
            </div>
            <div className="pet-tech">
              <span className="pet-chip">NVIDIA FLARE</span>
              <span className="pet-chip">DP ε≤8</span>
              <span className="pet-chip">Secure Agg</span>
            </div>
            <div className="pet-applies">
              <span className="pet-tag tag-a">A · High</span>
              <span className="pet-tag tag-b">B · Medium-High</span>
            </div>
          </div>

          <div className="pet-card l3">
            <div className="pet-layer-label">Layer L3 · Computation</div>
            <div className="pet-name">Confidential Computing + MPC + PSI</div>
            <div className="pet-desc">
              High-assurance joint queries — duplicate-finance, sanctions screening, aggregate
              exposure — execute inside attested enclaves with cryptographic primitives.
            </div>
            <div className="pet-tech">
              <span className="pet-chip">Intel TDX</span>
              <span className="pet-chip">Nitro Enclaves</span>
              <span className="pet-chip">SPDZ</span>
              <span className="pet-chip">PSI</span>
            </div>
            <div className="pet-applies">
              <span className="pet-tag tag-a">A · High</span>
              <span className="pet-tag tag-b">B · High</span>
            </div>
          </div>
        </div>

        {/* ZKP overlay */}
        <div className="zkp-callout">
          <div className="zkp-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5">
              <path d="M12 2L2 7v6c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7L12 2z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="zkp-body">
            <div className="zkp-eyebrow">Cross-cutting · Zero-Knowledge Proofs</div>
            <div className="zkp-title">High-assurance attestations without disclosure</div>
            <div className="zkp-desc">
              Bulletproof range-proofs for receivable thresholds · zk-SNARKs for GST correctness ·
              accumulator membership for duplicate-invoice detection. Soundness bounded by 2<sup>−128</sup>.
            </div>
          </div>
        </div>
      </section>

      {/* ============== SECTION 4 — USE CASES ============== */}
      <section>
        <div className="section-num">04 — APPLICATIONS</div>
        <h2>Three Use-Case Tracks, Prioritised A → B → C</h2>
        <p className="section-lede">
          Each track maps to a distinct consumer cohort with different latency, assurance and
          disclosure profiles. The mesh serves all three from the same substrate.
        </p>

        <div className="usecases">
          <div className="uc-card a">
            <div className="uc-priority">A</div>
            <div className="uc-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
              </svg>
            </div>
            <div className="uc-title">Banks &amp; Lenders</div>
            <div className="uc-audience">Highest priority</div>
            <ul className="uc-list">
              <li>Invoice &amp; supply-chain financing</li>
              <li>Working-capital risk · DSO scoring</li>
              <li>KYB · AML screening</li>
              <li>Cross-bank duplicate-finance check</li>
              <li>Aggregate exposure benchmarks</li>
            </ul>
          </div>

          <div className="uc-card b">
            <div className="uc-priority">B</div>
            <div className="uc-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <div className="uc-title">Regulatory Supervision</div>
            <div className="uc-audience">High priority</div>
            <ul className="uc-list">
              <li>MAS cross-bank exposure FL models</li>
              <li>Sectoral systemic-risk benchmarks</li>
              <li>Cross-FI red flags (MAS COSMIC)</li>
              <li>Federated fraud-pattern detection</li>
              <li>Transfer-pricing PSI cohort analysis</li>
            </ul>
            <div className="uc-aside">
              <div className="uc-aside-label">Out of FAM scope</div>
              <div className="uc-aside-text">
                <strong>IRAS statutory submission</strong> is outside FAM. IRAS receives PEPPOL invoice
                data directly via the GST InvoiceNow Requirement — a regulatory obligation that predates
                and operates independently of FAM's consent-based analytics model. FAM serves analytical
                consumers who query <em>with data-owner consent</em>; IRAS's access is governed by the
                GST Act.
              </div>
            </div>
          </div>

          <div className="uc-card c">
            <div className="uc-priority">C</div>
            <div className="uc-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
            <div className="uc-title">Enterprise Self-Service</div>
            <div className="uc-audience">Medium priority</div>
            <ul className="uc-list">
              <li>Cashflow forecasting</li>
              <li>Counterparty risk scoring</li>
              <li>AR · AP reconciliation</li>
              <li>Sectoral DSO benchmarks</li>
              <li>Audit-its-own-trail dashboards</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============== SECTION 5 — TRUST METRICS ============== */}
      <section>
        <div className="section-num">05 — DATA-OWNER TRUST</div>
        <h2>Six Measurable Confidence Metrics</h2>
        <p className="section-lede">
          Trust is not a sentiment — it is six measurable properties. Each scored against the
          recommended Federated Analytics Mesh (FAM).
        </p>

        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-name">Cryptographic Verifiability</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '95%' }} />
            </div>
            <div className="trust-desc">
              Owner can mathematically verify any analytical result without trusting the operator.
              ZKP-backed.
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-name">Revocation Rights</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '92%' }} />
            </div>
            <div className="trust-desc">
              VCs and ABAC grants are revocable in seconds via the issuer service.
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-name">Query Transparency</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '100%' }} />
            </div>
            <div className="trust-desc">
              100% of queries logged in append-only Merkle log with inclusion proofs.
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-name">Jurisdictional Sovereignty</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '90%' }} />
            </div>
            <div className="trust-desc">
              ASEs domiciled with SG-licensed APs under PDPA and Banking Act controls.
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-name">Opt-In Granularity</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '88%' }} />
            </div>
            <div className="trust-desc">
              Consent dimensions across attribute, use case, counterparty and time-window.
            </div>
          </div>
          <div className="trust-card">
            <div className="trust-name">Auditor Independence</div>
            <div className="trust-bar-wrap">
              <div className="trust-bar" style={{ width: '95%' }} />
            </div>
            <div className="trust-desc">
              Third-party auditors verify everything without operator cooperation. VC-mediated.
            </div>
          </div>
        </div>
      </section>

      {/* ============== SECTION 6 — TIMELINE ============== */}
      <section>
        <div className="section-num">06 — ROADMAP</div>
        <h2>Aligned to the GST InvoiceNow Mandate</h2>
        <p className="section-lede">
          Phased delivery synchronised to IRAS' published rollout milestones — pilot in 2026–27,
          limited production in 2028, full production by 2031.
        </p>

        <div className="timeline">
          <div className="timeline-header">GST INVOICENOW MANDATE TIMELINE</div>

          <div className="timeline-track">
            <div className="timeline-line" />
            <div className="timeline-progress" style={{ width: '18%' }} />
            <div className="timeline-points">
              <div className="tp active">
                <div className="tp-dot" />
                <div className="tp-date">Nov 2025</div>
                <div className="tp-label">Soft launch · new vol. registrants</div>
              </div>
              <div className="tp now">
                <div className="tp-dot" />
                <div className="tp-date">Apr 2026</div>
                <div className="tp-label">All new voluntary registrants</div>
              </div>
              <div className="tp">
                <div className="tp-dot" />
                <div className="tp-date">Apr 2028</div>
                <div className="tp-label">Compulsory + small existing GST</div>
              </div>
              <div className="tp">
                <div className="tp-dot" />
                <div className="tp-date">Apr 2029</div>
                <div className="tp-label">≤ S$1m turnover</div>
              </div>
              <div className="tp">
                <div className="tp-dot" />
                <div className="tp-date">Apr 2030</div>
                <div className="tp-label">≤ S$4m turnover</div>
              </div>
              <div className="tp">
                <div className="tp-dot" />
                <div className="tp-date">Apr 2031</div>
                <div className="tp-label">All GST-registered firms</div>
              </div>
            </div>
          </div>

          <div className="phases">
            <div className="phase">
              <div className="phase-id">PHASE 0</div>
              <div className="phase-title">Foundations</div>
              <div className="phase-period">Now → end-2026</div>
              <div className="phase-desc">
                OpenPeppol Analytical Services Profile draft · IMDA accreditation annex · VC pilot
                for invoice financing · MonetaGo PSI uplift
              </div>
            </div>
            <div className="phase">
              <div className="phase-id">PHASE 1</div>
              <div className="phase-title">Pilot</div>
              <div className="phase-period">2027</div>
              <div className="phase-desc">
                Federated fraud-detection sandbox · IRAS DP validation server · HE-based sectoral
                benchmarks
              </div>
            </div>
            <div className="phase">
              <div className="phase-id">PHASE 2</div>
              <div className="phase-title">Limited Production</div>
              <div className="phase-period">2028</div>
              <div className="phase-desc">
                ASR live in production SML · banks onboarded as Analytical Consumers · transparency-log
                inclusion proofs available to data owners
              </div>
            </div>
            <div className="phase">
              <div className="phase-id">PHASE 3</div>
              <div className="phase-title">Full Production</div>
              <div className="phase-period">2029 → 2031</div>
              <div className="phase-desc">
                Full mesh covering ~90,000 firms · cross-border interoperability with Belgium,
                France, A-NZ, Japan · post-quantum migration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== SECTION 7 — CONSTRAINTS ============== */}
      <section>
        <div className="section-num">07 — CONSTRAINTS</div>
        <h2>Hard Constraints, Verified Satisfied</h2>
        <p className="section-lede">
          Every constraint set by data owners and regulators is preserved by design — not by policy.
        </p>

        <div className="constraints">
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>No centralised analytical store</strong>
              ASEs hold only commitments, attestations and gradients. The Invoice Repository (IR) is
              an accredited, dex-onboarded Data Provider holding full PEPPOL payloads — but consumer
              access is PET-mediated through IR's ASE; no raw query path exists.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>Documents stay distributed</strong>
              The mesh moves queries to data, never the reverse. The standard 4-corner AS4 path is
              unchanged; IR receives a parallel copy under the data owner's signed Consent Manifest.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>PEPPOL-native</strong>
              ASR extends SMP using the same DNS root pattern. Backwards-compatible with PINT-SG.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>Technology-agnostic</strong>
              No vendor lock-in. DLT layer agnostic between XDC, Polygon, Ethereum, Besu.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>PETs evaluated in parallel</strong>
              PETs and pragmatic alternatives composed as peers — not fallbacks.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>Auditor-independent</strong>
              Transparency log verifiable by any third party without operator cooperation.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>Data-owner sovereignty</strong>
              C1 and C4 retain consent control. Revocation is seconds, not days.
            </div>
          </div>
          <div className="constraint">
            <div className="constraint-check">✓</div>
            <div className="constraint-text">
              <strong>Regulator-compatible</strong>
              Aligns with PDPA, MAS notices, IRAS GST mandate, OpenPeppol PIF.
            </div>
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="footer">
        <div>
          <span className="footer-tag">Primary path</span>
          <span className="footer-tag">B-1.a · Federated Analytics Mesh (FAM)</span>
          <span className="footer-tag">Score 42 / 50</span>
        </div>
        <div>
          Architectural blueprint · April 2026 · UK English
        </div>
      </footer>

    </div>
  );
}
