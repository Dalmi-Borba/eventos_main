// app.js
require('dotenv').config();               // <= novo
const express = require('express');
const PouchDB = require('pouchdb');
const path = require('path');
const cors = require('cors');             // <= opcional (ver nota abaixo)
const helmet = require('helmet');         // <= cabeçalhos de segurança

const app = express();

// Segurança básica de cabeçalhos
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Se você SERVE o frontend pelo MESMO Express, pode dispensar CORS.
// Use CORS só se outro domínio vai consumir sua API:
if (process.env.ALLOWED_ORIGINS) {
  app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(','), methods: ['GET','POST'], credentials: false }));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conecta ao CouchDB remoto SEM credenciais no código
// .env deve ter: COUCH_URL=https://couch.intranet-app.duckdns.org/eventos
//                COUCH_USER=admin
//                COUCH_PASS=****
// (não coloque user:pass na URL)
const db = new PouchDB(process.env.COUCH_URL, {
  auth: { username: process.env.COUCH_USER, password: process.env.COUCH_PASS }
});

// ------- SUAS ROTAS (inalteradas funcionalmente) -------
app.get('/api/aventuri', async (req, res) => {
  try {
    const all = await db.allDocs({ include_docs: true, limit: 1000000 });
    res.json(all.rows.map(r => r.doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// helper para remover acentos e padronizar
const norm = s => (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

app.post('/api/search', async (req, res) => {
  const { searchTerm = '', clubFilter = '' } = req.body;
  try {
    const all = await db.allDocs({ include_docs: true, limit: 1000000 });
    const q = norm(searchTerm);
    const club = norm(clubFilter);

    let docs = all.rows.map(r => r.doc);

    // campos onde a busca geral deve atuar
    const FIELDS = [
      'NOME DO USUARIO',
      'CPF',
      'CLUBE DE ORIGEM',
      '_id'
    ];

    if (q) {
      docs = docs.filter(d => FIELDS.some(f => norm(d[f]).includes(q)));
    }

    if (club) {
      docs = docs.filter(d => norm(d['CLUBE DE ORIGEM']).includes(club));
    }

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/clubs', async (req, res) => {
  const term = (req.query.query || '').toLowerCase();
  try {
    const all = await db.allDocs({ include_docs: true, limit: 1000000 });
    const clubs = Array.from(new Set(all.rows.map(r => r.doc["CLUBE DE ORIGEM"]||'')))
      .filter(c => c.toLowerCase().includes(term))
      .slice(0, 10);
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checkin', async (req, res) => {
  try {
    const doc = await db.get(req.body.id);
    doc.CHECKOUT = 'Y';
    await db.put(doc);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/checkout', async (req, res) => {
  try {
    const doc = await db.get(req.body.id);
    doc.CHECKOUT = 'N';
    await db.put(doc);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
