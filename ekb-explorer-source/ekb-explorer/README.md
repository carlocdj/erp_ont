# EKB Ontology Explorer

Una single-page application per navigare l'**ontologia IQT EKB ERP** (v3 final) in due modi complementari:

- **Narrative Explorer** — lettura editoriale per PO, PM, Key User e Stakeholder. Dieci sezioni che spiegano ontologicamente cos'è l'azienda.
- **Graph Explorer** — cockpit tecnico per analisti e data architect. Grafo interattivo, triple-pattern query, browser di 505 triple, navigazione della class hierarchy.

L'ontologia sottostante: **2.017 triple, 79 classi OWL, 52 object property** — derivata dal BRD di un'implementazione Oracle NetSuite in una società di ingegneria da 600+ persone.

---

## Quick start

Serve Node.js 18+ (consigliato 20 LTS).

```bash
npm install
npm run dev
```

Apre su [http://localhost:5173](http://localhost:5173).

### Build di produzione

```bash
npm run build      # genera la build statica in ./dist
npm run preview    # serve la build su localhost per verificarla
```

La cartella `dist/` è una build statica completa — pronta da deployare su:

- **Netlify, Vercel, Cloudflare Pages** — drag & drop della cartella `dist/`
- **GitHub Pages** — copia il contenuto di `dist/` nel branch `gh-pages`
- **Amazon S3 + CloudFront** — upload di `dist/` in un bucket statico
- **Qualsiasi server HTTP** — `dist/` contiene solo asset statici

Il `base: './'` in `vite.config.js` e l'uso di `HashRouter` rendono la build portabile: funziona anche se servita da un path non-root (es. `https://example.com/my/nested/path/`) o aperta direttamente via `file://` (doppio-click su `dist/index.html`).

---

## Struttura del progetto

```
ekb-explorer/
├── index.html                    Entry HTML con preload Google Fonts
├── package.json                  Dipendenze: React, React Router, lucide-react
├── vite.config.js                Configurazione Vite (base relativo)
├── src/
│   ├── main.jsx                  Bootstrap React con HashRouter
│   ├── App.jsx                   Routing e mode switcher flottante
│   ├── theme.js                  Design tokens condivisi
│   ├── components/
│   │   └── ModeSwitcher.jsx      UI di switch tra narrative / graph / home
│   ├── pages/
│   │   ├── Landing.jsx           Home page introduttiva con due entry card
│   │   ├── NarrativeExplorer.jsx Esperienza editoriale in 10 sezioni
│   │   └── GraphExplorer.jsx     Cockpit: graph + query + triples + schema
│   └── data/
│       └── graph.js              Ontologia serializzata: 510 nodi, 505 archi
└── README.md
```

---

## Routing

| Rotta           | Pagina              | Audience                         |
|-----------------|---------------------|----------------------------------|
| `/`             | Landing             | Primo contatto, presentazione    |
| `/#/narrative`  | Narrative Explorer  | PO, PM, Key User, Stakeholder    |
| `/#/graph`      | Graph Explorer      | Analisti, architect, ontologisti |

Il `/#/` deriva da HashRouter — scelta deliberata per portabilità su hosting statico.

---

## Note di design

**Perché due UI distinte e non una unificata?** Deliberatamente. Le due audience hanno bisogni cognitivi diversi: uno stakeholder vuole una narrazione ordinata, un analista vuole un grafo interrogabile. Uno stesso UI fallirebbe entrambi. Il progetto è la dimostrazione che la stessa ontologia regge letture radicalmente diverse — questa è la sua forza.

**Tipografia.** Playfair Display (serif editoriale) per la vista narrativa, JetBrains Mono (technical) per la vista graph. Caricate via Google Fonts con preconnect.

**Persistenza dati.** Nessuna. Non ci sono stati lato client, cookie o localStorage — l'app è puramente presentazionale. Ogni ricarica riparte dalla landing.

---

## Credits

**EKB Ontology Research Programme** — Independent Researcher, Aprile 2026.  
Fonte: `iqt_ekb_erp_ontology_v3_final.ttl` (Turtle, 81 KB, 1.101 righe).

Progetto rilasciato come dimostratore. Per licensing, advisory o delivery contattare l'autore.
