// public/frontend.js
document.addEventListener('DOMContentLoaded', () => {
  // Elementos da UI
  const form       = document.getElementById('searchForm');
  const termInput  = document.getElementById('searchTerm');
  const clubInput  = document.getElementById('clubTerm');
  const clearBtn   = document.getElementById('clearClubBtn');
  const clubList   = document.getElementById('clubAutocomplete');
  const loading    = document.getElementById('loading');
  const errorDiv   = document.getElementById('error');
  const tbody      = document.querySelector('#resultsTable tbody');
  const noResults  = document.getElementById('noResults');

  // cache leve no navegador (só nomes de clubes)
  let clubHistory = JSON.parse(localStorage.getItem('clubHistory') || '[]');
  function saveClub(c) {
    if (!c || clubHistory.includes(c)) return;
    clubHistory.unshift(c);
    if (clubHistory.length > 5) clubHistory.pop();
    localStorage.setItem('clubHistory', JSON.stringify(clubHistory));
  }

  const debounce = (fn, ms = 200) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // Autocomplete consultando a SUA API (sem tocar no CouchDB)
  const updateAutocomplete = debounce(async (term) => {
    clubList.innerHTML = '';
    if (!term) return;
    try {
      const res = await fetch(`/api/clubs?query=${encodeURIComponent(term)}`);
      const live = await res.json();
      const historyMatches = clubHistory.filter(c => c.toLowerCase().includes(term.toLowerCase()));
      const suggestions = [...new Set([...historyMatches, ...live])].slice(0, 10);
      clubList.innerHTML = suggestions.map(c => `<li>${c}</li>`).join('');
    } catch {
      /* silenciar */
    }
  });

  clubInput.addEventListener('input', () => {
    clearBtn.style.display = clubInput.value ? 'block' : 'none';
    updateAutocomplete(clubInput.value.trim());
  });
  clearBtn.addEventListener('click', () => {
    clubInput.value = '';
    clearBtn.style.display = 'none';
    clubList.innerHTML = '';
  });
  clubList.addEventListener('click', e => {
    if (e.target.tagName === 'LI') {
      clubInput.value = e.target.textContent;
      clearBtn.style.display = 'block';
      clubList.innerHTML = '';
    }
  });

  function renderResults(docs) {
    if (!Array.isArray(docs) || docs.length === 0) {
      noResults.style.display = 'block';
      tbody.innerHTML = '';
      return;
    }
    noResults.style.display = 'none';
    tbody.innerHTML = docs.map(d => `
      <tr>
        <td>${d._id}</td>
        <td>${d["NOME DO USUARIO"] || ''}</td>
        <td>${d.CPF || ''}</td>
        <td>${d["CLUBE DE ORIGEM"] || ''}</td>
        <td>
          <button class="${d.CHECKOUT === 'Y' ? 'btn-checkout' : 'btn-checkin'}"
                  data-id="${d._id}" data-status="${d.CHECKOUT === 'Y' ? 'Y' : 'N'}">
            ${d.CHECKOUT === 'Y' ? 'Check-out' : 'Check-in'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function doSearch() {
    loading.style.display = 'block';
    errorDiv.textContent = '';
    try {
      const payload = {
        searchTerm: termInput.value.trim(),
        clubFilter: clubInput.value.trim()
      };
      if (payload.clubFilter) saveClub(payload.clubFilter);

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const docs = await res.json();
      renderResults(docs);
    } catch (e) {
      errorDiv.textContent = 'Erro ao buscar';
    } finally {
      loading.style.display = 'none';
    }
  }

  // delegação de evento para check-in/out
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    const isY = btn.dataset.status === 'Y';
    try {
      const endpoint = isY ? '/api/checkout' : '/api/checkin';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await doSearch();
    } catch {}
  });

  form.addEventListener('submit', (e) => { e.preventDefault(); doSearch(); });

  // Primeira busca
  doSearch();
});
