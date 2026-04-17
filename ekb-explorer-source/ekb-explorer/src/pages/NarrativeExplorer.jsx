import React, { useState, useMemo } from 'react';
import { ChevronRight, Target, Building2, Workflow, Database, Gauge, Users, Network, ArrowRight, Layers, Search } from 'lucide-react';

// ============================================================================
// ONTOLOGY FACTS - extracted from iqt_ekb_erp_ontology_v3_final.ttl
// Canonicalized view of the enterprise as Purpose -> Capability -> Process ->
// Record -> Control. This is the PO/PM narrative spine.
// ============================================================================

const PURPOSES = [
  {
    id: 'AcquireWork',
    label: 'Acquisire lavoro',
    subtitle: 'Da lead a contratto firmato',
    narrative: 'La ragione per cui esiste la funzione commerciale. Tutto ciò che precede la firma — CRM, opportunità, offerte, gare — esiste per alimentare questo scopo.',
    color: '#8B2635',
  },
  {
    id: 'DeliverEngineeringService',
    label: 'Erogare servizi di ingegneria',
    subtitle: 'Dal contratto al deliverable',
    narrative: 'Il cuore operativo dell\'azienda. Contratti, incarichi, commesse, WBS, acquisti e fatturazione esistono per trasformare un impegno contrattuale in un servizio consegnato.',
    color: '#3B4E6B',
  },
  {
    id: 'AllocateCompetentResources',
    label: 'Allocare risorse competenti',
    subtitle: 'La persona giusta, al progetto giusto',
    narrative: 'Lo scopo che lega le persone alla produzione. Skill, disponibilità, ruolo di progetto si incontrano qui. Senza questo scopo, il delivery non accade.',
    color: '#5C6B3C',
  },
  {
    id: 'ControlProjectMargin',
    label: 'Controllare il margine di commessa',
    subtitle: 'Il valore, non solo il fatturato',
    narrative: 'Il Direct Costing Evoluto, i BEF, gli avanzamenti, i margini di primo/secondo livello. Questo scopo distingue un\'azienda che fattura da un\'azienda che guadagna.',
    color: '#8C6A1A',
  },
  {
    id: 'EnsureFiscalCompliance',
    label: 'Garantire conformità fiscale',
    subtitle: 'Il contratto con lo Stato',
    narrative: 'Registri IVA, fatturazione elettronica, ritenute, localizzazione italiana (NExIL). Non è burocrazia: è la condizione per operare legalmente.',
    color: '#4A4A4A',
  },
  {
    id: 'SupportPeopleLifecycle',
    label: 'Supportare il ciclo di vita delle persone',
    subtitle: 'Assunzione, presenza, crescita, uscita',
    narrative: 'Timesheet, presenze, note spesa, ferie, recruiting, assegnazione device. Lo scopo che riconosce che senza persone, non c\'è azienda.',
    color: '#6B4E8C',
  },
];

const ORGANIZATION = {
  group: 'IQT Group',
  subsidiaries: [
    { code: 'IT', label: 'IQT Italia' },
    { code: 'IN', label: 'IQT India' },
  ],
  businessUnits: [
    { id: 'BUMobile', label: 'BU Mobile', teams: ['NORD OVEST','MITO','FENICE','VTI','MTV','ADRIATICA','SARDEGNA','CENTRO','MOB AMS Documentale','MOB AMS Consulenza','AMS MOB Contract Management','CERTIFICAZIE','MOB AMS BONIFICHE','CARATTERIZZAZ NORD','CARATTERIZZAZ CENTRO SUD'] },
    { id: 'BUNGN', label: 'BU NGN', teams: ['PCM Construction','PCM Nord Est','PCM Nord Ovest','PCM Centro Sud','PCM TIM FiberCop','PCM Open Fiber','AMS Servizi BD','Back Office','RD NGN'] },
    { id: 'BUHaederaLab', label: 'BU HaederaLab', teams: ['REVAMP Roma','REVAMP Rovigo','REVAMP Milano','EVOLVE PCM','Ferrara','EVOLVE','REFIT'] },
    { id: 'BUUTFrame', label: 'BU UTFrame', teams: ['TIGER Idrico Integrato','TIGER Reti Energetiche'] },
    { id: 'BUEGrid', label: 'BU e-Grid', teams: ['EGRID PCM','EGRID PCM Framework','EGRID PCM Mobility','EGRID PCM Construction','EGRID AMS Cert Infra','EGRID AMS Preventivazione','EGRID AMS Servizi BD'] },
  ],
  staff: [
    'AF / Ufficio Acquisti / CdG','HR & Organizzazione','Ufficio Tecnico','Sistema Integrato',
    'Area Sales','Marketing','Ufficio Gare','Digital Engineering / R&D','ICT',
  ],
  sites: ['ROVIGO 1-8','ANCONA','CAGLIARI','FIRENZE','MILANO','ROMA','TORINO'],
  jobRoles: ['Responsabile BU','Responsabile STAFF','Project Manager','Team Leader','Team Player'],
};

const SERVICE_TAXONOMY = {
  label: 'Servizi IQT',
  children: [
    {
      label: 'Servizi Esterni',
      children: [
        { label: 'PCM', children: [ { label: 'Integrated Design' }, { label: 'Construction Management' } ] },
        { label: 'AMS', children: [
          { label: 'Technical & Administration' },
          { label: 'Safety & Maintenance' },
          { label: 'Program Project Management' },
          { label: 'Digital Engineering' },
        ]},
      ],
    },
    {
      label: 'Servizi Interni',
      children: [{ label: 'AF' }, { label: 'HR' }, { label: 'ICT' }],
    },
  ],
};

const PROCESSES = [
  { id: 'CRMActivityManagement', label: 'Gestione attività di CRM', family: 'Presales', purpose: 'AcquireWork', roles: ['Sales','SalesManager'], records: [] },
  { id: 'CreateOpportunityPrivateDeal', label: 'Creazione Opportunità (trattativa privata)', family: 'Presales', purpose: 'AcquireWork', roles: ['Sales'], records: ['Opportunity','Lead','Prospect','Customer'] },
  { id: 'CreateOpportunityTender', label: 'Creazione Opportunità (gara)', family: 'Presales', purpose: 'AcquireWork', roles: ['Sales','BackOfficePerson'], records: ['Opportunity','Tender'] },
  { id: 'CreateEstimatePrivateDeal', label: 'Creazione Offerta (trattativa privata)', family: 'Presales', purpose: 'AcquireWork', roles: [], records: ['Estimate'] },
  { id: 'CreateEstimateTender', label: 'Creazione Offerta (gara)', family: 'Presales', purpose: 'AcquireWork', roles: [], records: ['Estimate','Tender'] },
  { id: 'CreateSalesOrderPrivateDeal', label: 'Ordine di Vendita (trattativa privata)', family: 'Presales', purpose: 'AcquireWork', roles: [], records: ['SalesOrder'] },
  { id: 'CreateContract', label: 'Creazione Contratto', family: 'Operations Production', purpose: 'DeliverEngineeringService', roles: ['BackOfficePerson'], records: ['Contract','Customer'] },
  { id: 'CreateContractAssignment', label: 'Creazione Incarico su Contratto', family: 'Operations Production', purpose: 'DeliverEngineeringService', roles: [], records: ['Contract','ContractAssignmentJob'] },
  { id: 'CreateProject', label: 'Creazione Commessa', family: 'Operations Production', purpose: 'DeliverEngineeringService', roles: ['ProjectManager','BackOfficePerson'], records: ['Project','Contract'] },
  { id: 'CreateContractAssignmentJobAndWBS', label: 'Prestazione su Incarico e WBS', family: 'Operations Production', purpose: 'DeliverEngineeringService', roles: [], records: ['ContractAssignmentJob','Project','ProjectTask','ProjectTemplate'] },
  { id: 'ResourceAllocation', label: 'Resource Allocation', family: 'Operations Production', purpose: 'AllocateCompetentResources', roles: ['ResourceManager','ProjectManager'], records: ['Project','ProjectTask','Employee','GenericResource','ResourceGroup'] },
  { id: 'ProductionProgressManagement', label: 'Gestione Avanzamenti di Produzione', family: 'Operations Production', purpose: 'ControlProjectMargin', roles: [], records: [] },
  { id: 'CreateBEFRequest', label: 'Creazione BEF Richieste', family: 'Operations Production', purpose: 'ControlProjectMargin', roles: ['BackOfficePerson','ProjectManager'], records: ['BEFRequest','ContractAssignmentJob'] },
  { id: 'RegisterBEFReceived', label: 'BEF Cliente / BEF Ottenute', family: 'Operations Production', purpose: 'ControlProjectMargin', roles: [], records: ['BEFReceived','BEFRequest'] },
  { id: 'InvoiceFromBEF', label: 'Fatturazione da BEF', family: 'Operations Production', purpose: 'ControlProjectMargin', roles: ['ARAnalyst','BackOfficePerson'], records: ['Invoice','BEFReceived'] },
  { id: 'CreateCustomerOrder', label: 'Creazione ODA Cliente', family: 'Operations Production', purpose: 'DeliverEngineeringService', roles: [], records: ['CustomerOrder','Contract','ContractAssignmentJob'] },
  { id: 'CustomerCreditNote', label: 'Note di credito cliente', family: 'Operations Production', purpose: 'ControlProjectMargin', roles: [], records: ['CreditMemo'] },
  { id: 'LeavePermitOvertimeRequestProcess', label: 'Richiesta Ferie/Permessi/Straordinari', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['EmployeeCenter'], records: ['LeavePermitOvertimeRequest','Timesheet','Employee'] },
  { id: 'DailyPresenceRecording', label: 'Rilevazione Presenze', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['EmployeeCenter'], records: ['AttendanceCertification','Register','Employee'] },
  { id: 'TimesheetSubmission', label: 'Timesheet', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['EmployeeCenter','ProjectManager'], records: ['Timesheet','Project','ProjectTask','Employee'] },
  { id: 'ExpenseReportSubmission', label: 'Nota Spese', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['EmployeeCenter','AccountingManager'], records: ['ExpenseReport','Employee','Project'] },
  { id: 'PurchaseRequestProcess', label: 'Richiesta di Acquisto', family: 'Operations Staff', purpose: 'DeliverEngineeringService', roles: ['EmployeeCenter','PurchasingManager'], records: ['PurchaseRequest','Vendor','Project'] },
  { id: 'PurchaseOrderProcess', label: 'Ordine di Acquisto', family: 'Operations Staff', purpose: 'DeliverEngineeringService', roles: ['PurchasingManager'], records: ['PurchaseOrder','Vendor','Project'] },
  { id: 'VendorBillingProcess', label: 'Fatturazione Passiva', family: 'Operations Staff', purpose: 'EnsureFiscalCompliance', roles: ['APAnalyst','AccountingManager'], records: ['VendorBill','PurchaseOrder','Vendor'] },
  { id: 'RecruitingProcess', label: 'Recruiting', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['EmployeeCenter','Administrator'], records: ['InternalCase','Candidate','Document'] },
  { id: 'DeviceAssignmentProcess', label: 'Assegnazione Device', family: 'Operations Staff', purpose: 'SupportPeopleLifecycle', roles: ['InventoryManager','EmployeeCenter'], records: ['DeviceAssignment','Item','Employee'] },
];

const CONTROL_MODEL = {
  name: 'IQT Direct Costing Evoluto',
  standardDimensions: ['Subsidiary','Department','Class','Location'],
  customDimensions: ['Area Geografica','Unità Locale','Categoria Commessa','Contratto'],
  costTypes: ['Costi specifici','Costi comuni','Costi generali'],
  marginTypes: ['Primo margine','Secondo margine','Margine di contribuzione'],
  ratios: ['Quoziente di liquidità','Rotazione crediti','Tempo medio incasso','Rotazione magazzino','Giorni di giacenza','Rotazione attività','Margine sulle vendite','ROA','ROE','Debt to Assets','Debt to Equity'],
};

const SYSTEMS = [
  { id: 'OracleNetSuite', label: 'Oracle NetSuite', role: 'ERP core' },
  { id: 'DocFinance', label: 'DocFinance', role: 'Tesoreria & incassi' },
  { id: 'CentroPaghe', label: 'Centro Paghe', role: 'Paghe & presenze' },
  { id: 'Deepser', label: 'Deepser', role: 'Ticketing ICT' },
  { id: 'Qlik', label: 'Qlik', role: 'BI' },
  { id: 'Outlook', label: 'Outlook', role: 'Calendario & mail' },
  { id: 'HorsaFE', label: 'HorsaFE', role: 'Fatturazione elettronica' },
];

const INTEGRATIONS = [
  { id: 'DocFinanceIntegration', source: 'OracleNetSuite', target: 'DocFinance', payloads: ['Customer/Vendor Open Items','Payment Methods','Payment Terms','Bank Accounts','Due Dates','Currencies','Master Anagrafiche'] },
  { id: 'CentroPagheIntegration', source: 'CentroPaghe', target: 'OracleNetSuite', payloads: ['Saldi presenze & ferie'] },
  { id: 'DeepserIntegration', source: 'Deepser', target: 'OracleNetSuite', payloads: ['Ticket'] },
  { id: 'HorsaFEIntegration', source: 'OracleNetSuite', target: 'HorsaFE', payloads: ['Flussi fattura XML'] },
  { id: 'OutlookIntegration', source: 'OracleNetSuite', target: 'Outlook', payloads: ['Eventi & calendario'] },
];

const USER_ROLES = [
  { id: 'CEO', label: 'Chief Executive Officer', center: 'Executing', dashboard: 'CEO' },
  { id: 'CFO', label: 'Chief Financial Officer', center: 'Accounting', dashboard: 'CFO' },
  { id: 'FinancialController', label: 'Financial Controller', center: 'Accounting', dashboard: null },
  { id: 'AccountingManager', label: 'Accounting Manager', center: 'Accounting', dashboard: 'AccountingManager' },
  { id: 'ARAnalyst', label: 'AR Analyst', center: 'Accounting', dashboard: null },
  { id: 'APAnalyst', label: 'AP Analyst', center: 'Accounting', dashboard: null },
  { id: 'ProjectManager', label: 'Project Manager', center: 'Project', dashboard: 'ProjectManager' },
  { id: 'ResourceManager', label: 'Resource Manager', center: 'Project', dashboard: 'ProjectManager' },
  { id: 'BackOfficePerson', label: 'Back Office', center: 'Project', dashboard: null },
  { id: 'SalesManager', label: 'Sales Manager', center: 'Sales', dashboard: 'AreaSales' },
  { id: 'Sales', label: 'Sales', center: 'Sales', dashboard: 'AreaSales' },
  { id: 'PurchasingManager', label: 'Purchasing Manager', center: 'Vendor', dashboard: null },
  { id: 'InventoryManager', label: 'Inventory Manager', center: 'Vendor', dashboard: null },
  { id: 'EmployeeCenter', label: 'Dipendente (Self-Service)', center: 'Employee Self-Service', dashboard: 'EmployeeSelfService' },
  { id: 'Administrator', label: 'Administrator', center: 'Accounting', dashboard: null },
  { id: 'Accounting', label: 'Accounting', center: 'Accounting', dashboard: null },
];

const BUSINESS_RULES = [
  { id: 'ExpenseApprovalForPartnersAndAdministrators', kind: 'Approval', desc: 'Per amministratori e soci l\'approvazione nota spese avviene da HR.' },
  { id: 'CollaboratorHigherAllowanceRule', kind: 'Approval', desc: 'Soci e collaboratori con indennità maggiore e valore default dedicato.' },
  { id: 'PurchaseApprovalByThresholdAndCategory', kind: 'Approval', desc: 'Richieste di acquisto approvate per soglie e categorie merceologiche.' },
  { id: 'VendorInvoiceRequiresAcceptance', kind: 'Approval', desc: 'La fatturazione passiva richiede benestare alla fatturazione.' },
  { id: 'RegisterVsTimesheetReconciliation', kind: 'Approval', desc: 'HR confronta presenze e timesheet per rilevare squadrature.' },
  { id: 'ProbationExpiryNotification', kind: 'Notification', desc: 'Notifica automatica a scadenza periodo di prova.' },
];

// ============================================================================
// DESIGN SYSTEM — Editorial/technical, for a 600+ engineering firm boardroom
// ============================================================================

const STYLES = {
  bg: '#F5F1EA',
  ink: '#1A1A1A',
  paper: '#FAFAF7',
  rule: '#C9BFAE',
  muted: '#6B5F4E',
  accent: '#8B2635',
  gold: '#8C6A1A',
};

// ============================================================================
// COMPONENTS
// ============================================================================

function Pill({ children, color = STYLES.muted, bg = 'transparent' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', fontSize: '10px',
      letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
      border: `1px solid ${color}`, color, background: bg, fontFamily: 'ui-monospace, monospace',
    }}>{children}</span>
  );
}

function SectionTitle({ num, title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px', borderBottom: `1px solid ${STYLES.rule}`, paddingBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: STYLES.muted, letterSpacing: '0.15em' }}>§ {num}</span>
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', margin: 0, color: STYLES.ink, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ marginTop: '6px', marginLeft: '38px', fontSize: '14px', color: STYLES.muted, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{subtitle}</p>}
    </div>
  );
}

function NavTab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(id)} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 14px', border: 'none', background: active ? STYLES.ink : 'transparent',
      color: active ? STYLES.paper : STYLES.ink, cursor: 'pointer',
      fontFamily: 'ui-monospace, monospace', fontSize: '11px', letterSpacing: '0.1em',
      textTransform: 'uppercase', fontWeight: 500, transition: 'all 0.15s',
      borderLeft: active ? `3px solid ${STYLES.accent}` : `3px solid transparent`,
    }}>
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

// --- OVERVIEW TAB ------------------------------------------------------------

function OverviewTab({ setTab, setFocus }) {
  return (
    <div>
      <SectionTitle num="00" title="Che cos'è, ontologicamente, l'azienda." subtitle="Una lettura per Product Owner, Project Manager, Key User e Stakeholder." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '28px 32px', marginBottom: '28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted }}>Tesi 1 di 3</div>
        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', lineHeight: 1.45, color: STYLES.ink, margin: 0, fontWeight: 500 }}>
          L'azienda <em>non</em> è un organigramma, e <em>non</em> è un catalogo di moduli ERP.
          È un sistema di <span style={{ color: STYLES.accent, fontStyle: 'italic' }}>sei scopi</span> — sei ragioni di esistere — che si materializzano attraverso cinque anelli concentrici.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'SCOPO', sub: 'Perché',  go: 'purposes', count: '6' },
          { label: 'ORGANIZZAZIONE', sub: 'Chi', go: 'organization', count: '5 BU' },
          { label: 'PROCESSO', sub: 'Come', go: 'processes', count: '39+' },
          { label: 'RECORD', sub: 'Cosa', go: 'records', count: '55+' },
          { label: 'CONTROLLO', sub: 'Con quale lente', go: 'control', count: '8 dim.' },
        ].map((x, i) => (
          <div key={i} onClick={() => setTab(x.go)} style={{
            padding: '18px 14px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`,
            cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = STYLES.ink; e.currentTarget.style.color = STYLES.paper; }}
          onMouseLeave={e => { e.currentTarget.style.background = STYLES.paper; e.currentTarget.style.color = STYLES.ink; }}
          >
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', letterSpacing: '0.15em', color: STYLES.muted, marginBottom: '4px' }}>ANELLO {i + 1}</div>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{x.label}</div>
            <div style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.7, marginBottom: '8px' }}>{x.sub}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', opacity: 0.6 }}>{x.count}</div>
          </div>
        ))}
      </div>

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '28px 32px', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '8px' }}>TESI 2 DI 3</div>
        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', lineHeight: 1.5, margin: 0 }}>
          Ogni azione operativa — una nota spese, una richiesta BEF, un timesheet — è <em>tracciabile fino al suo scopo</em>. Se un'attività non risale a uno dei sei scopi, non dovrebbe esistere.
        </p>
      </div>

      <div style={{ background: STYLES.ink, color: STYLES.paper, padding: '28px 32px', marginBottom: '40px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.rule, letterSpacing: '0.15em', marginBottom: '8px' }}>TESI 3 DI 3 — PER I PO/PM</div>
        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', lineHeight: 1.5, margin: 0 }}>
          Quando un key user chiede "<em>perché questo campo è obbligatorio?</em>", la risposta non è "lo dice NetSuite". La risposta è: <span style={{ color: '#E8C77A' }}>perché risale a uno scopo aziendale</span>. Questa ontologia rende quella risalita esplicita.
        </p>
      </div>

      <SectionTitle num="01" title="I sei scopi." subtitle="Clicca su uno scopo per vedere i processi, i ruoli e i dati che lo servono." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {PURPOSES.map((p, i) => (
          <div key={p.id} onClick={() => { setFocus({ kind: 'purpose', id: p.id }); setTab('purposes'); }}
            style={{
              padding: '20px', background: STYLES.paper, borderLeft: `4px solid ${p.color}`,
              border: `1px solid ${STYLES.rule}`, cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em' }}>PURPOSE {String(i + 1).padStart(2, '0')}</div>
              <ChevronRight size={14} color={STYLES.muted} />
            </div>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', margin: '0 0 4px 0', color: STYLES.ink }}>{p.label}</h3>
            <div style={{ fontSize: '12px', fontStyle: 'italic', color: STYLES.muted, marginBottom: '10px' }}>{p.subtitle}</div>
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: STYLES.ink, margin: 0, fontFamily: 'Georgia, serif' }}>{p.narrative}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PURPOSES TAB ------------------------------------------------------------

function PurposesTab({ focus, setFocus, setTab }) {
  const selected = focus?.kind === 'purpose' ? PURPOSES.find(p => p.id === focus.id) : PURPOSES[0];
  const relatedProcs = PROCESSES.filter(pr => pr.purpose === selected.id);
  const relatedRoles = [...new Set(relatedProcs.flatMap(pr => pr.roles))];
  const relatedRecords = [...new Set(relatedProcs.flatMap(pr => pr.records))];

  return (
    <div>
      <SectionTitle num="01" title="Scopi → Processi → Dati" subtitle="La catena causale. Da 'perché facciamo questo' a 'quali dati lo rendono reale'." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>I SEI SCOPI</div>
          {PURPOSES.map(p => (
            <div key={p.id} onClick={() => setFocus({ kind: 'purpose', id: p.id })} style={{
              padding: '12px 14px', background: selected.id === p.id ? STYLES.ink : STYLES.paper,
              color: selected.id === p.id ? STYLES.paper : STYLES.ink,
              borderLeft: `4px solid ${p.color}`, border: `1px solid ${STYLES.rule}`,
              borderBottom: 'none', cursor: 'pointer',
            }}>
              <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '14px', fontWeight: 700 }}>{p.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{p.subtitle}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ padding: '24px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`, borderLeft: `4px solid ${selected.color}`, marginBottom: '20px' }}>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', margin: '0 0 4px 0' }}>{selected.label}</h3>
            <div style={{ fontSize: '13px', fontStyle: 'italic', color: STYLES.muted, marginBottom: '14px' }}>{selected.subtitle}</div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '15px', lineHeight: 1.6, color: STYLES.ink, margin: 0 }}>{selected.narrative}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '16px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>PROCESSI · {relatedProcs.length}</div>
              {relatedProcs.map(pr => (
                <div key={pr.id} onClick={() => { setFocus({ kind: 'process', id: pr.id }); setTab('processes'); }} style={{
                  fontSize: '12px', padding: '6px 0', borderBottom: `1px dotted ${STYLES.rule}`, cursor: 'pointer',
                }}>{pr.label}</div>
              ))}
            </div>

            <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '16px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>RUOLI · {relatedRoles.length}</div>
              {relatedRoles.map(r => (
                <div key={r} style={{ fontSize: '12px', padding: '6px 0', borderBottom: `1px dotted ${STYLES.rule}` }}>{r}</div>
              ))}
              {relatedRoles.length === 0 && <div style={{ fontSize: '11px', fontStyle: 'italic', color: STYLES.muted }}>Non mappato esplicitamente.</div>}
            </div>

            <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '16px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>RECORD · {relatedRecords.length}</div>
              {relatedRecords.map(r => (
                <div key={r} style={{ fontSize: '12px', padding: '6px 0', borderBottom: `1px dotted ${STYLES.rule}`, fontFamily: 'ui-monospace, monospace' }}>{r}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ORGANIZATION TAB --------------------------------------------------------

function OrganizationTab() {
  return (
    <div>
      <SectionTitle num="02" title="L'organizzazione" subtitle="Chi. Un gruppo, due subsidiary, cinque BU di produzione, nove funzioni di staff, quaranta team." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '32px', fontWeight: 700 }}>{ORGANIZATION.group}</div>
          <Pill color={STYLES.accent}>Organization · radice</Pill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {ORGANIZATION.subsidiaries.map(s => (
            <div key={s.code} style={{ padding: '14px', border: `1px solid ${STYLES.rule}`, background: STYLES.bg }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em' }}>SUBSIDIARY · {s.code}</div>
              <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '12px' }}>BUSINESS UNITS · {ORGANIZATION.businessUnits.length}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {ORGANIZATION.businessUnits.map(bu => (
            <details key={bu.id} style={{ padding: '14px', border: `1px solid ${STYLES.rule}`, background: STYLES.bg }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '18px', fontWeight: 700 }}>{bu.label}</div>
                  <Pill>{bu.teams.length} team</Pill>
                </div>
              </summary>
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {bu.teams.map(t => (
                  <span key={t} style={{ fontSize: '10px', padding: '2px 6px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`, fontFamily: 'ui-monospace, monospace' }}>{t}</span>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '12px' }}>STAFF FUNCTIONS · {ORGANIZATION.staff.length}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
          {ORGANIZATION.staff.map(s => (
            <span key={s} style={{ padding: '6px 12px', background: STYLES.bg, border: `1px solid ${STYLES.rule}`, fontSize: '12px', fontFamily: 'Georgia, serif' }}>{s}</span>
          ))}
        </div>

        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '12px' }}>OPERATIONAL SITES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
          {ORGANIZATION.sites.map(s => (
            <span key={s} style={{ padding: '4px 10px', background: STYLES.bg, border: `1px solid ${STYLES.rule}`, fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>{s}</span>
          ))}
        </div>

        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '12px' }}>JOB ROLES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ORGANIZATION.jobRoles.map(r => (
            <Pill key={r} color={STYLES.ink} bg={STYLES.bg}>{r}</Pill>
          ))}
        </div>
      </div>

      <div style={{ background: STYLES.ink, color: STYLES.paper, padding: '20px 24px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.rule, letterSpacing: '0.15em', marginBottom: '8px' }}>NOTA ONTOLOGICA</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Il Team è l'unità che porta <em>contemporaneamente</em> un'identità geografica (area) e un'identità di servizio (PCM, AMS, ecc.). Per questo il modello di controllo usa "Area Geografica" e "Unità Locale" come dimensioni custom <em>oltre</em> alle dimensioni standard NetSuite — la verticalizzazione del dominio arriva a questo livello.
        </p>
      </div>
    </div>
  );
}

// --- PROCESSES TAB -----------------------------------------------------------

function ProcessesTab({ focus, setFocus, setTab }) {
  const [filterFamily, setFilterFamily] = useState('ALL');
  const [filterPurpose, setFilterPurpose] = useState('ALL');

  const families = ['ALL', ...new Set(PROCESSES.map(p => p.family))];
  const filtered = PROCESSES.filter(p =>
    (filterFamily === 'ALL' || p.family === filterFamily) &&
    (filterPurpose === 'ALL' || p.purpose === filterPurpose)
  );

  const selected = focus?.kind === 'process' ? PROCESSES.find(p => p.id === focus.id) : filtered[0];

  return (
    <div>
      <SectionTitle num="03" title="I processi" subtitle="Come lo facciamo. Ogni processo ha un ruolo che lo esegue, record che lo alimentano, uno scopo che lo giustifica." />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em' }}>FILTRA PER FAMIGLIA →</span>
        {families.map(f => (
          <button key={f} onClick={() => setFilterFamily(f)} style={{
            padding: '4px 10px', border: `1px solid ${STYLES.rule}`, background: filterFamily === f ? STYLES.ink : 'transparent',
            color: filterFamily === f ? STYLES.paper : STYLES.ink, cursor: 'pointer', fontSize: '11px', fontFamily: 'ui-monospace, monospace',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em' }}>FILTRA PER SCOPO →</span>
        <button onClick={() => setFilterPurpose('ALL')} style={{
          padding: '4px 10px', border: `1px solid ${STYLES.rule}`, background: filterPurpose === 'ALL' ? STYLES.ink : 'transparent',
          color: filterPurpose === 'ALL' ? STYLES.paper : STYLES.ink, cursor: 'pointer', fontSize: '11px', fontFamily: 'ui-monospace, monospace',
        }}>ALL</button>
        {PURPOSES.map(p => (
          <button key={p.id} onClick={() => setFilterPurpose(p.id)} style={{
            padding: '4px 10px', border: `1px solid ${p.color}`,
            background: filterPurpose === p.id ? p.color : 'transparent',
            color: filterPurpose === p.id ? STYLES.paper : p.color,
            cursor: 'pointer', fontSize: '11px', fontFamily: 'ui-monospace, monospace',
          }}>{p.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>PROCESSI · {filtered.length}</div>
          <div style={{ maxHeight: '600px', overflowY: 'auto', border: `1px solid ${STYLES.rule}` }}>
            {filtered.map(pr => {
              const purp = PURPOSES.find(p => p.id === pr.purpose);
              const active = selected?.id === pr.id;
              return (
                <div key={pr.id} onClick={() => setFocus({ kind: 'process', id: pr.id })} style={{
                  padding: '10px 14px', background: active ? STYLES.ink : STYLES.paper,
                  color: active ? STYLES.paper : STYLES.ink,
                  borderLeft: `4px solid ${purp?.color || STYLES.muted}`,
                  borderBottom: `1px solid ${STYLES.rule}`, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 500 }}>{pr.label}</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', opacity: 0.6 }}>{pr.family.split(' ').pop()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected && <ProcessDetail proc={selected} setFocus={setFocus} setTab={setTab} />}
      </div>
    </div>
  );
}

function ProcessDetail({ proc, setFocus, setTab }) {
  const purp = PURPOSES.find(p => p.id === proc.purpose);
  return (
    <div>
      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, borderTop: `4px solid ${purp.color}`, padding: '20px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '4px' }}>{proc.family.toUpperCase()}</div>
        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '24px', margin: '0 0 16px 0' }}>{proc.label}</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px dotted ${STYLES.rule}` }}>
          <Target size={14} color={purp.color} />
          <span style={{ fontSize: '11px', color: STYLES.muted }}>supporta lo scopo</span>
          <span onClick={() => { setFocus({ kind: 'purpose', id: purp.id }); setTab('purposes'); }} style={{
            fontSize: '13px', fontWeight: 500, color: purp.color, cursor: 'pointer', textDecoration: 'underline',
            fontFamily: 'Georgia, serif',
          }}>{purp.label}</span>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '8px' }}>ESEGUITO DA</div>
          {proc.roles.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {proc.roles.map(r => (
                <span key={r} style={{ padding: '4px 10px', background: STYLES.bg, border: `1px solid ${STYLES.rule}`, fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>{r}</span>
              ))}
            </div>
          ) : <div style={{ fontSize: '11px', fontStyle: 'italic', color: STYLES.muted }}>Mapping ruolo non esplicito in ontologia.</div>}
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '8px' }}>SUPPORTATO DAL SISTEMA</div>
          <Pill color={STYLES.ink} bg={STYLES.bg}>Oracle NetSuite</Pill>
        </div>

        <div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '8px' }}>RECORD TYPE COINVOLTI · {proc.records.length}</div>
          {proc.records.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {proc.records.map(r => (
                <span key={r} style={{ padding: '4px 10px', background: STYLES.ink, color: STYLES.paper, fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>{r}</span>
              ))}
            </div>
          ) : <div style={{ fontSize: '11px', fontStyle: 'italic', color: STYLES.muted }}>Nessun record esplicitamente dichiarato.</div>}
        </div>
      </div>
    </div>
  );
}

// --- RECORDS TAB -------------------------------------------------------------

function RecordsTab() {
  const records = useMemo(() => {
    const all = new Set();
    PROCESSES.forEach(p => p.records.forEach(r => all.add(r)));
    // Plus the full list from ontology
    const standard = ['Employee','WorkCalendar','SkillCategory','SkillSet','BillingClass','Group','GenericResource','ResourceGroup','Item','Contact','Lead','Prospect','Customer','Partner','Vendor','Competitor','Project','ProjectTemplate','ProjectTask','FixedAsset','Budget'];
    const custom = ['Tender','Contract','ContractAssignmentJob','CustomerOrder','Document','Candidate','Complaint','NonConformity','Register','AttendanceCertification','LeavePermitOvertimeRequest','DeviceAssignment','InternalCase','BEFRequest','BEFReceived','Worksite','Network'];
    const transaction = ['Timesheet','ExpenseReport','PurchaseRequest','PurchaseContract','PurchaseOrder','ItemReceipt','VendorBill','VendorReturnAuthorization','InventoryCount','InventoryAdjustment','TransferOrder','Estimate','Opportunity','SalesOrder','Invoice','CreditMemo','JournalEntry'];
    return { standard, custom, transaction };
  }, []);

  const groups = [
    { title: 'Record Standard', sub: 'Forniti da NetSuite out-of-the-box', items: records.standard, color: STYLES.muted },
    { title: 'Record Custom', sub: 'Specifici del dominio IQT — la verticalizzazione', items: records.custom, color: STYLES.accent },
    { title: 'Record Transazionali', sub: 'Documenti che producono scritture contabili', items: records.transaction, color: STYLES.gold },
  ];

  return (
    <div>
      <SectionTitle num="04" title="I record" subtitle="Cosa manipoliamo. La materia prima informativa dell'azienda, classificata in tre nature." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '20px 24px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          La differenza tra un record <strong>standard</strong> e uno <strong>custom</strong> non è tecnica: è ontologica. I record custom sono il <em>vocabolario specifico</em> dell'ingegneria IQT —
          <code style={{ background: STYLES.bg, padding: '1px 5px', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>Tender</code>, <code style={{ background: STYLES.bg, padding: '1px 5px', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>Contract</code>, <code style={{ background: STYLES.bg, padding: '1px 5px', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>BEFRequest</code>, <code style={{ background: STYLES.bg, padding: '1px 5px', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>ContractAssignmentJob</code> —
          concetti che NetSuite non conosce perché sono patrimonio del dominio. I record transazionali sono invece quelli che <em>lasciano traccia contabile</em>: se scorrono, scorre il ledger.
        </p>
      </div>

      {groups.map(g => (
        <div key={g.title} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', margin: 0, color: g.color }}>{g.title}</h3>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: STYLES.muted, fontFamily: 'Georgia, serif' }}>{g.sub}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: STYLES.muted }}>{g.items.length} record</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {g.items.map(r => (
              <div key={r} style={{
                padding: '8px 10px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`,
                borderLeft: `3px solid ${g.color}`, fontSize: '11px', fontFamily: 'ui-monospace, monospace',
              }}>{r}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- CONTROL MODEL TAB -------------------------------------------------------

function ControlTab() {
  return (
    <div>
      <SectionTitle num="05" title="Il modello di controllo" subtitle="Con quale lente leggiamo tutto il resto. Il Direct Costing Evoluto è l'ottica finanziaria dell'azienda." />

      <div style={{ background: STYLES.ink, color: STYLES.paper, padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#E8C77A', letterSpacing: '0.15em', marginBottom: '6px' }}>CONTROL MODEL</div>
        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', margin: '0 0 12px 0' }}>{CONTROL_MODEL.name}</h3>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
          Ogni transazione è osservata attraverso <strong>otto dimensioni</strong> — quattro standard NetSuite, quattro custom IQT. È così che un ordine di acquisto diventa leggibile come "costo specifico, categoria commessa X, area geografica Nord Est" — e non solo come "fattura di 12.000 euro".
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>DIMENSIONI STANDARD · 4</div>
          {CONTROL_MODEL.standardDimensions.map(d => (
            <div key={d} style={{ padding: '8px 0', borderBottom: `1px dotted ${STYLES.rule}`, fontFamily: 'Georgia, serif', fontSize: '14px' }}>{d}</div>
          ))}
        </div>
        <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, borderLeft: `4px solid ${STYLES.accent}`, padding: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.accent, letterSpacing: '0.15em', marginBottom: '10px' }}>DIMENSIONI CUSTOM IQT · 4</div>
          {CONTROL_MODEL.customDimensions.map(d => (
            <div key={d} style={{ padding: '8px 0', borderBottom: `1px dotted ${STYLES.rule}`, fontFamily: 'Georgia, serif', fontSize: '14px' }}>{d}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>TIPI DI COSTO</div>
          {CONTROL_MODEL.costTypes.map((d, i) => (
            <div key={d} style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px' }}>{d}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted }}>L{i + 1}</span>
            </div>
          ))}
        </div>
        <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '18px' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>TIPI DI MARGINE</div>
          {CONTROL_MODEL.marginTypes.map((d, i) => (
            <div key={d} style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px' }}>{d}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.gold }}>M{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '18px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '10px' }}>INDICATORI FINANZIARI · {CONTROL_MODEL.ratios.length}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {CONTROL_MODEL.ratios.map(r => (
            <div key={r} style={{ padding: '6px 10px', background: STYLES.bg, border: `1px solid ${STYLES.rule}`, fontSize: '12px', fontFamily: 'Georgia, serif' }}>{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- ROLES TAB ---------------------------------------------------------------

function RolesTab() {
  const centers = [...new Set(USER_ROLES.map(r => r.center))];
  return (
    <div>
      <SectionTitle num="06" title="I ruoli e i centri" subtitle="L'ontologia del punto di vista. Ogni ruolo vede un sottoinsieme del sistema — questa è la sua 'finestra cognitiva'." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '20px 24px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          In NetSuite, un <strong>Center</strong> è una "casa" — una vista omogenea dei dati pertinenti a un ruolo. Un Project Manager abita il Project Center; un CFO abita l'Accounting Center. Lo stesso record (un Timesheet) viene osservato in modo diverso a seconda della finestra da cui si guarda.
        </p>
      </div>

      {centers.map(c => {
        const roles = USER_ROLES.filter(r => r.center === c);
        return (
          <div key={c} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
              <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', margin: 0 }}>{c} Center</h3>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted }}>{roles.length} ruoli</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {roles.map(r => (
                <div key={r.id} style={{ padding: '14px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`, borderLeft: `3px solid ${STYLES.ink}` }}>
                  <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{r.label}</div>
                  {r.dashboard && (
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted }}>
                      <Gauge size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      dashboard · {r.dashboard}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- SYSTEMS TAB -------------------------------------------------------------

function SystemsTab() {
  return (
    <div>
      <SectionTitle num="07" title="I sistemi e le integrazioni" subtitle="Il tessuto tecnologico. Un core (NetSuite) più sei sistemi satellite, uniti da flussi espliciti." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
        {SYSTEMS.map(s => (
          <div key={s.id} style={{
            padding: '16px', background: s.id === 'OracleNetSuite' ? STYLES.ink : STYLES.paper,
            color: s.id === 'OracleNetSuite' ? STYLES.paper : STYLES.ink,
            border: `1px solid ${STYLES.rule}`,
            borderLeft: s.id === 'OracleNetSuite' ? `4px solid #E8C77A` : `1px solid ${STYLES.rule}`,
          }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px', letterSpacing: '0.15em', opacity: 0.7, marginBottom: '4px' }}>
              {s.id === 'OracleNetSuite' ? 'ERP CORE' : 'SATELLITE'}
            </div>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.8 }}>{s.role}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em', marginBottom: '12px' }}>INTEGRAZIONI · {INTEGRATIONS.length}</div>
      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}` }}>
        {INTEGRATIONS.map((i, idx) => (
          <div key={i.id} style={{ padding: '14px 18px', borderBottom: idx < INTEGRATIONS.length - 1 ? `1px solid ${STYLES.rule}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <Pill color={STYLES.ink} bg={STYLES.bg}>{i.source}</Pill>
              <ArrowRight size={14} color={STYLES.accent} />
              <Pill color={STYLES.ink} bg={STYLES.bg}>{i.target}</Pill>
            </div>
            <div style={{ marginLeft: '4px', fontSize: '11px', color: STYLES.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              trasporta: {i.payloads.join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- RULES TAB ---------------------------------------------------------------

function RulesTab() {
  return (
    <div>
      <SectionTitle num="08" title="Regole di business" subtitle="Le regole sono l'ontologia 'normativa': condizioni che governano quando un'azione è lecita, quando serve un'approvazione, quando scatta una notifica." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '20px 24px', marginBottom: '20px' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Queste regole <em>non</em> sono personalizzazioni tecniche: sono <strong>impegni aziendali espliciti</strong>. Modificarne una significa modificare un'assunzione organizzativa. Per questo ogni regola è un'entità ontologica di primo livello, non un dettaglio di configurazione.
        </p>
      </div>

      {BUSINESS_RULES.map(r => (
        <div key={r.id} style={{
          padding: '16px 20px', background: STYLES.paper, border: `1px solid ${STYLES.rule}`,
          borderLeft: `4px solid ${r.kind === 'Approval' ? STYLES.accent : STYLES.gold}`,
          marginBottom: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '15px', fontWeight: 700 }}>{r.id.replace(/([A-Z])/g, ' $1').trim()}</div>
            <Pill color={r.kind === 'Approval' ? STYLES.accent : STYLES.gold}>{r.kind}</Pill>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: 1.5, margin: 0, color: STYLES.ink }}>{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

// --- SERVICES TAB ------------------------------------------------------------

function ServicesTab() {
  const renderNode = (node, depth = 0) => (
    <div key={node.label} style={{ marginLeft: depth * 20, marginBottom: '6px' }}>
      <div style={{
        padding: '8px 12px',
        background: depth === 0 ? STYLES.ink : (depth === 1 ? STYLES.paper : STYLES.bg),
        color: depth === 0 ? STYLES.paper : STYLES.ink,
        border: `1px solid ${STYLES.rule}`,
        borderLeft: `3px solid ${depth === 0 ? '#E8C77A' : depth === 1 ? STYLES.accent : STYLES.muted}`,
        fontFamily: depth === 0 ? '"Playfair Display", Georgia, serif' : 'Georgia, serif',
        fontSize: depth === 0 ? '16px' : depth === 1 ? '14px' : '13px',
        fontWeight: depth < 2 ? 700 : 400,
      }}>{node.label}</div>
      {node.children && node.children.map(c => renderNode(c, depth + 1))}
    </div>
  );

  return (
    <div>
      <SectionTitle num="09" title="La tassonomia dei servizi" subtitle="Come l'azienda classifica quello che produce. Una SKOS taxonomy: non un organigramma, ma un'ontologia di offering." />

      <div style={{ background: STYLES.paper, border: `1px solid ${STYLES.rule}`, padding: '24px' }}>
        {renderNode(SERVICE_TAXONOMY)}
      </div>

      <div style={{ marginTop: '20px', background: STYLES.ink, color: STYLES.paper, padding: '20px 24px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#E8C77A', letterSpacing: '0.15em', marginBottom: '6px' }}>DISTINCTION</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Questa tassonomia non coincide con le BU. Una BU può erogare più servizi; un servizio può essere erogato da più BU. Per questo la tassonomia vive in SKOS (vocabolario controllato), mentre le BU vivono nell'ontologia organizzativa — e il mapping tra le due è un'informazione aggiuntiva, non un'identità.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function NarrativeExplorer() {
  const [tab, setTab] = useState('overview');
  const [focus, setFocus] = useState(null);

  const TABS = [
    { id: 'overview', label: 'Sinossi', icon: Layers },
    { id: 'purposes', label: 'Scopi', icon: Target },
    { id: 'organization', label: 'Organizzazione', icon: Building2 },
    { id: 'processes', label: 'Processi', icon: Workflow },
    { id: 'records', label: 'Record', icon: Database },
    { id: 'control', label: 'Controllo', icon: Gauge },
    { id: 'roles', label: 'Ruoli', icon: Users },
    { id: 'systems', label: 'Sistemi', icon: Network },
    { id: 'services', label: 'Servizi', icon: Layers },
    { id: 'rules', label: 'Regole', icon: Search },
  ];

  const renderTab = () => {
    switch (tab) {
      case 'overview': return <OverviewTab setTab={setTab} setFocus={setFocus} />;
      case 'purposes': return <PurposesTab focus={focus} setFocus={setFocus} setTab={setTab} />;
      case 'organization': return <OrganizationTab />;
      case 'processes': return <ProcessesTab focus={focus} setFocus={setFocus} setTab={setTab} />;
      case 'records': return <RecordsTab />;
      case 'control': return <ControlTab />;
      case 'roles': return <RolesTab />;
      case 'systems': return <SystemsTab />;
      case 'services': return <ServicesTab />;
      case 'rules': return <RulesTab />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: STYLES.bg, color: STYLES.ink,
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; }
        details summary::-webkit-details-marker { display: none; }
        button:hover { opacity: 0.88; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${STYLES.bg}; }
        ::-webkit-scrollbar-thumb { background: ${STYLES.rule}; }
      `}</style>

      {/* Masthead */}
      <header style={{
        borderBottom: `3px double ${STYLES.ink}`, padding: '20px 32px 16px', background: STYLES.bg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.2em', marginBottom: '4px' }}>
              IQT ENTERPRISE KNOWLEDGE BASE — v3 · ERP ONTOLOGY
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '42px', margin: 0, fontWeight: 900, letterSpacing: '-0.02em', color: STYLES.ink }}>
              L'azienda <span style={{ fontStyle: 'italic', color: STYLES.accent }}>ontologica</span>
            </h1>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'italic', color: STYLES.muted, marginTop: '2px' }}>
              Una guida per PO, PM, Key User e Stakeholder
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.1em' }}>
            <div>79 classi · 52 relazioni</div>
            <div>39 processi · 55 record type · 6 scopi</div>
            <div>5 BU · 40 team · 16 ruoli utente</div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 'calc(100vh - 120px)' }}>
        {/* Nav */}
        <nav style={{ borderRight: `1px solid ${STYLES.rule}`, background: STYLES.bg, padding: '20px 0' }}>
          <div style={{ padding: '0 20px 10px', fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.15em' }}>
            NAVIGAZIONE
          </div>
          {TABS.map(t => (
            <NavTab key={t.id} {...t} active={tab === t.id} onClick={setTab} />
          ))}
          <div style={{ padding: '20px', marginTop: '20px', borderTop: `1px solid ${STYLES.rule}`, fontSize: '11px', color: STYLES.muted, fontStyle: 'italic', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
            «Un'ontologia non è un dizionario: è il <em>modello operativo</em> dell'azienda.»
          </div>
        </nav>

        {/* Content */}
        <main style={{ padding: '32px 40px', maxWidth: '1100px' }}>
          {renderTab()}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${STYLES.rule}`, padding: '16px 32px', background: STYLES.bg,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: STYLES.muted, letterSpacing: '0.1em',
      }}>
        <div>FONTE · iqt_ekb_erp_ontology_v3_final.ttl</div>
        <div>NORMALIZED · Project / Contract / ContractAssignmentJob · NetSuite dimensions</div>
        <div>v3.0-final</div>
      </footer>
    </div>
  );
}
