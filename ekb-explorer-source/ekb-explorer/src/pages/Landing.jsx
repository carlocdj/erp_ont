import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Network, ArrowRight, ArrowUpRight } from 'lucide-react';

const ACCENT = '#8B2635';
const INK = '#1A1A1A';
const BG = '#F5F1EA';
const PAPER = '#FAFAF7';
const RULE = '#C9BFAE';
const MUTED = '#6B5F4E';
const GOLD = '#8C6A1A';

export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      color: INK,
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      {/* Masthead */}
      <header style={{
        borderBottom: `3px double ${INK}`,
        padding: '24px 48px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
            color: MUTED, letterSpacing: '0.25em', marginBottom: '4px',
          }}>
            EKB ONTOLOGY RESEARCH PROGRAMME
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
            color: MUTED, letterSpacing: '0.1em',
          }}>
            Ontology Navigator · v1.0 · 2026
          </div>
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
          color: MUTED, letterSpacing: '0.1em', textAlign: 'right',
        }}>
          <div>2,017 triples · 79 classes</div>
          <div>52 object properties</div>
          <div>510 navigable nodes · 505 edges</div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '80px 48px 40px',
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
          color: ACCENT, letterSpacing: '0.2em', marginBottom: '16px',
          textTransform: 'uppercase',
        }}>
          Un'ontologia. Due letture.
        </div>
        <h1 style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 'clamp(42px, 6vw, 72px)',
          fontWeight: 900,
          margin: '0 0 20px 0',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}>
          L'azienda <em style={{ color: ACCENT }}>ontologica.</em>
        </h1>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          lineHeight: 1.5,
          color: INK,
          margin: '0 0 16px 0',
          maxWidth: '760px',
          fontStyle: 'italic',
        }}>
          Un'ontologia OWL formale di dominio — 2.017 triple, 79 classi, 52 relazioni — che rappresenta non un organigramma, non un catalogo ERP, ma il <strong>modello operativo</strong> di una società di ingegneria da 600+ persone.
        </p>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '17px',
          lineHeight: 1.65,
          color: MUTED,
          margin: 0,
          maxWidth: '720px',
        }}>
          Questo progetto ne fornisce due viste complementari. Una <strong style={{ color: INK }}>editoriale</strong>, per stakeholder, project owner e key user che devono capire o spiegare l'azienda. Una <strong style={{ color: INK }}>cockpit</strong>, per analisti e architetti che devono interrogare il grafo in modo strutturato. Stessa ontologia, due attrezzi.
        </p>
      </section>

      {/* Two entry points */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 48px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '20px',
      }}>
        <EntryCard
          to="/narrative"
          kicker="MODO 01"
          title="Narrative"
          subtitle="Per PO, PM, Key User, Stakeholder"
          icon={BookOpen}
          description="Una lettura editoriale in dieci sezioni. I sei scopi che reggono l'azienda, l'organizzazione, i processi, i record, il modello di controllo, i ruoli, i sistemi. Ogni sezione spiega il perché, non solo il cosa."
          features={['Sinossi ontologica', 'Drill-down Scopo → Processo → Record', '26 processi classificati', 'Tassonomia servizi SKOS']}
          theme="editorial"
        />
        <EntryCard
          to="/graph"
          kicker="MODO 02"
          title="Graph Explorer"
          subtitle="Per analisti, data architect, ontologisti"
          icon={Network}
          description="Un cockpit tecnico a sfondo nero. Force-directed graph con espansione on-demand, triple-pattern query, browser delle 505 triple, navigazione della class hierarchy OWL. Nessuna narrativa: solo struttura e relazioni."
          features={['Grafo interattivo con 510 nodi', 'Query ?S ?P ?O con esempi', 'T-Box navigator (79 classi)', 'Inspector in/out per ogni nodo']}
          theme="cockpit"
        />
      </section>

      {/* About the ontology */}
      <section style={{
        borderTop: `1px solid ${RULE}`,
        background: PAPER,
        padding: '60px 48px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
            color: MUTED, letterSpacing: '0.2em', marginBottom: '12px',
          }}>
            CHE COS'È QUESTA ONTOLOGIA
          </div>
          <h2 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '32px', fontWeight: 700, margin: '0 0 24px 0',
            letterSpacing: '-0.01em',
          }}>
            Non un diagramma. <em>Un modello operativo di riferimento.</em>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            <Pillar
              kicker="ORIGINE"
              title="Derivata da un BRD ERP"
              body="L'ontologia formalizza il Business Requirements Document di un'implementazione Oracle NetSuite in un gruppo di ingegneria da 600+ persone con 5 BU operative, 40 team e 7 sistemi satellite."
            />
            <Pillar
              kicker="SCOPO"
              title="Un world model riutilizzabile"
              body="Pensata come substrato semantico per cantieri AI — assistenti ontology-grounded, knowledge base, change impact analysis, compliance auditing. L'ontologia è l'asset, non il deliverable di analisi."
            />
            <Pillar
              kicker="FORMATO"
              title="OWL 2 DL · Turtle · SKOS"
              body="Standard W3C. Namespace modulari, disjointness dichiarata, cardinality constraints via OWL restrictions, tassonomia di servizio in SKOS. Pronta per ragionatori, SHACL validation, query SPARQL."
            />
          </div>
        </div>
      </section>

      {/* Context / author */}
      <section style={{
        borderTop: `1px solid ${RULE}`,
        padding: '60px 48px',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
            color: MUTED, letterSpacing: '0.2em', marginBottom: '12px',
          }}>
            IL PROGRAMMA
          </div>
          <h2 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '28px', fontWeight: 700, margin: '0 0 20px 0',
          }}>
            EKB Ontology Research Programme
          </h2>
          <p style={{
            fontFamily: 'Georgia, serif', fontSize: '16px',
            lineHeight: 1.7, color: INK, margin: '0 0 14px 0',
          }}>
            Un programma di ricerca indipendente sul ruolo delle ontologie nel knowledge management delle organizzazioni di ingegneria. Produce paper accademici, casi d'uso applicati e framework commerciali — con un'ipotesi di lavoro precisa: <em>le ontologie non servono a descrivere la realtà aziendale, servono a <strong>abitare la stessa realtà</strong> dell'ingegnere che la usa</em>.
          </p>
          <p style={{
            fontFamily: 'Georgia, serif', fontSize: '16px',
            lineHeight: 1.7, color: MUTED, margin: 0,
          }}>
            Il caso IQT presentato qui è un esempio di verticalizzazione ontologica di un dominio ERP — la tesi che il valore non risiede nella piattaforma ma nel modello di dominio che la piattaforma instanzia.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${RULE}`,
        padding: '24px 48px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '10px',
        color: MUTED,
        letterSpacing: '0.1em',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>FONTE · iqt_ekb_erp_ontology_v3_final.ttl</div>
        <div>EKB ONTOLOGY RESEARCH PROGRAMME · INDEPENDENT RESEARCHER</div>
        <div>APRILE 2026 · v1.0</div>
      </footer>
    </div>
  );
}

function EntryCard({ to, kicker, title, subtitle, icon: Icon, description, features, theme }) {
  const isEditorial = theme === 'editorial';
  const cardBg = isEditorial ? PAPER : '#0A0A0B';
  const cardInk = isEditorial ? INK : '#E8E8EA';
  const cardMuted = isEditorial ? MUTED : '#7A7A85';
  const cardAccent = isEditorial ? ACCENT : '#E8C77A';
  const cardRule = isEditorial ? RULE : '#2A2A32';

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardRule}`,
          padding: '32px',
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
          fontFamily: 'Georgia, serif',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = isEditorial
            ? `0 10px 30px rgba(139, 38, 53, 0.15)`
            : `0 10px 30px rgba(232, 199, 122, 0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px',
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
              color: cardAccent, letterSpacing: '0.25em', marginBottom: '6px',
            }}>
              {kicker}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={28} color={cardAccent} strokeWidth={1.5} />
              <h3 style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '32px', fontWeight: 700, margin: 0, color: cardInk,
              }}>
                {title}
              </h3>
            </div>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: '13px',
              color: cardMuted, fontStyle: 'italic', marginTop: '4px',
            }}>
              {subtitle}
            </div>
          </div>
          <ArrowUpRight size={20} color={cardMuted} />
        </div>

        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '15px',
          lineHeight: 1.6, color: cardInk, margin: '0 0 24px 0', flex: 1,
        }}>
          {description}
        </p>

        <div style={{
          paddingTop: '20px', borderTop: `1px solid ${cardRule}`,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
              color: cardMuted, letterSpacing: '0.03em',
            }}>
              <span style={{ color: cardAccent, marginRight: '8px' }}>→</span>{f}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
          color: cardAccent, letterSpacing: '0.15em', fontWeight: 600,
        }}>
          <span>APRI</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

function Pillar({ kicker, title, body }) {
  return (
    <div style={{
      borderLeft: `3px solid ${GOLD}`,
      paddingLeft: '20px',
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: '10px',
        color: GOLD, letterSpacing: '0.2em', marginBottom: '6px',
      }}>
        {kicker}
      </div>
      <h3 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '20px', fontWeight: 700, margin: '0 0 10px 0',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6,
        color: MUTED, margin: 0,
      }}>
        {body}
      </p>
    </div>
  );
}
