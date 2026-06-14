let allSchools = [];
let moyenne = null;

fetch('schools.json')
  .then(r => r.json())
  .then(data => { allSchools = data; })
  .catch(() => console.error('Impossible de charger schools.json'));

function calculer() {
  const reg = parseFloat(document.getElementById('noteRegionale').value);
  const nat = parseFloat(document.getElementById('noteNationale').value);

  if (isNaN(reg) || isNaN(nat) || reg < 0 || reg > 20 || nat < 0 || nat > 20) {
    alert('Veuillez entrer des notes valides entre 0 et 20.');
    return;
  }

  moyenne = +(0.25 * reg + 0.75 * nat).toFixed(4);

  document.getElementById('resRegionale').textContent = reg.toFixed(2);
  document.getElementById('resNationale').textContent = nat.toFixed(2);
  document.getElementById('resMoyenne').textContent   = moyenne.toFixed(4);

  const rc = document.getElementById('resultCard');
  rc.style.display = 'block';
  rc.classList.remove('fade-in');
  void rc.offsetWidth;
  rc.classList.add('fade-in');

  document.getElementById('schoolsSection').style.display = 'block';
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCategory').value = '';
  filtrer();
}

function getChance(moy, seuil2025) {
  if (moy >= seuil2025) return { cls: 'chance-forte',   label: '🟢 Forte chance' };
  if (moy >= seuil2025 - 0.5) return { cls: 'chance-moyenne', label: '🟡 Chance moyenne' };
  return { cls: 'chance-faible', label: '🔴 Faible chance' };
}

function filtrer() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const cat    = document.getElementById('filterCategory').value;

  let results = allSchools.filter(s => {
    const matchName = s.name.toLowerCase().includes(search) || s.city.toLowerCase().includes(search);
    const matchCat  = cat === '' || s.category === cat;
    return matchName && matchCat;
  });

  if (moyenne !== null) {
    results = results.sort((a, b) => {
      const da = Math.abs(a.thresholds['2025'] - moyenne);
      const db = Math.abs(b.thresholds['2025'] - moyenne);
      return da - db;
    });
  }

  const countEl = document.getElementById('countMsg');
  countEl.textContent = results.length > 0
    ? `${results.length} établissement(s) trouvé(s)`
    : '';

  const list = document.getElementById('schoolsList');
  list.innerHTML = '';

  if (results.length === 0) {
    list.innerHTML = `
      <div class="no-result fade-in">
        <div class="emoji">🎓</div>
        <p>Aucun établissement ne correspond à votre recherche.</p>
      </div>`;
    return;
  }

  results.forEach((s, i) => {
    const seuil25 = s.thresholds['2025'];
    const chance  = moyenne !== null ? getChance(moyenne, seuil25) : null;

    const years = ['2025','2024','2023','2022','2021'];
    const rows  = years.map(y => `
      <tr>
        <td class="year-col">${y}</td>
        <td class="${y === '2025' ? 'seuil-2025' : ''}">${s.thresholds[y] !== undefined ? s.thresholds[y].toFixed(2) : '–'}</td>
      </tr>`).join('');

    const badgeHtml = chance
      ? `<div class="chance-badge ${chance.cls}">${chance.label}</div>`
      : '';

    const card = document.createElement('div');
    card.className = 'school-card fade-in';
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML = `
      <div class="school-header">
        <div class="school-name">${s.name}</div>
        <div class="school-meta">
          <span class="tag tag-city">📍 ${s.city}</span>
          <span class="tag tag-cat">${s.category}</span>
        </div>
      </div>
      ${badgeHtml}
      <table class="thresholds-table">
        <thead>
          <tr><th>Année</th><th>Seuil</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    list.appendChild(card);
  });
}
