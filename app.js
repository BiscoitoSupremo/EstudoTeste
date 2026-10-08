/* ZELO IMÓVEIS · DASHBOARD 2026
  app.js — Lógica completa + Gráficos Chart.js */

'use strict';

// ── Paleta ──
const C = {
  blue:  '#998cff',
  blueH: '#b49aff',
  blueD: '#7568df',
  white: '#e8eaf0',
  w70:   'rgba(232,234,240,0.76)',
  w40:   'rgba(192,198,210,0.72)',
  w15:   'rgba(153,140,255,0.16)',
  grid:  'rgba(192,198,210,0.12)',
};

Chart.defaults.font.family = 'Poppins';
Chart.defaults.color = C.w40;

// helper tooltip escuro
const tooltip = {
  backgroundColor: '#252436',
  borderColor: C.blue,
  borderWidth: 1,
  titleColor: '#ffffff',
  bodyColor: 'rgba(255,255,255,.78)',
  padding: 10,
};

// 1. NAVEGAÇÃO ENTRE ABAS
const navItems   = document.querySelectorAll('.nav-item');
const pages      = document.querySelectorAll('.page');
const pageTitle  = document.getElementById('pageTitle');

const PAGE_NAMES = {
  overview:    'Visão Geral',
  market:      'Mercado · Campinas-SP',
  social:      'Redes Sociais',
  competitors: 'Concorrentes',
  personas:    'Personas',
};

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const target = item.dataset.page;
    navItems.forEach(n => {
      n.classList.remove('active');
      n.removeAttribute('aria-current');
    });
    item.classList.add('active');
    item.setAttribute('aria-current', 'page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + target).classList.add('active');
    pageTitle.textContent = PAGE_NAMES[target] || target;
    // lazy-render gráficos ao mudar de aba
    if (target === 'market')      renderMarketCharts();
    if (target === 'social')      renderSocialCharts();
    if (target === 'competitors') renderCompetitorCharts();
    if (target === 'personas')    renderPersonaCharts();
  });
});

// 2. MENU HAMBURGUER (mobile)
const burgerBtn = document.getElementById('burgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function setSidebarOpen(open) {
  sidebar.classList.toggle('open', open);
  sidebarBackdrop.classList.toggle('show', open);
  burgerBtn.setAttribute('aria-expanded', String(open));
  sidebar.setAttribute('aria-hidden', String(!open && window.innerWidth <= 900));
  sidebarBackdrop.setAttribute('aria-hidden', String(!open));
}

burgerBtn.addEventListener('click', () => {
  setSidebarOpen(!sidebar.classList.contains('open'));
});
sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('show');
    sidebar.removeAttribute('aria-hidden');
    burgerBtn.setAttribute('aria-expanded', 'false');
  } else if (!sidebar.classList.contains('open')) {
    sidebar.setAttribute('aria-hidden', 'true');
  }
});

if (window.innerWidth <= 900) setSidebarOpen(false);

// fecha o drawer após navegar no mobile
navItems.forEach(item => item.addEventListener('click', () => {
  if (window.innerWidth <= 900) setSidebarOpen(false);
}));

// 2.1 BUSCA GLOBAL NO CONTEÚDO DO DASHBOARD
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchableSelector = '.kpi-item, .data-table tr, .comp-card, .plat-big-card, .section-header, .card-ttl, .report-body, .sources-grid a, .card, .method-note';
const focusedSearchSelector = '.kpi-item, .data-table tr, .comp-card, .plat-big-card, .section-header, .card-ttl, .report-body, .sources-grid a, .method-note';

function normalizeSearchText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function setSearchResultsOpen(open) {
  searchResults.hidden = !open;
  searchInput.setAttribute('aria-expanded', String(open));
}

function getSearchLabel(element) {
  const label = element.matches('.data-table tr')
    ? element.querySelector('th, td')
    : element.matches('.card-ttl, .sources-grid a')
      ? null
      : element.querySelector('.ki-lbl, .comp-info strong, .plat-header strong, .p-name, .report-body strong, .method-note strong, h2, h3, h4');
  return (label ? label.textContent : element.textContent).trim().replace(/\s+/g, ' ').slice(0, 90);
}

function renderSearchResults() {
  const query = searchInput.value.trim();
  searchResults.replaceChildren();
  if (!query) {
    setSearchResultsOpen(false);
    return;
  }

  const normalizedQuery = normalizeSearchText(query);
  const candidates = Array.from(document.querySelectorAll(searchableSelector)).filter(element => {
    if (!element.matches(focusedSearchSelector)) {
      return !element.querySelector(focusedSearchSelector);
    }
    return true;
  });
  const matches = candidates.map(element => {
    const text = element.textContent.trim().replace(/\s+/g, ' ');
    const normalizedText = normalizeSearchText(text);
    return normalizedText.includes(normalizedQuery)
      ? {
          element,
          text,
          pageKey: element.closest('.page')?.id.replace('page-', '') || null,
          titleMatch: normalizeSearchText(getSearchLabel(element)).includes(normalizedQuery),
        }
      : null;
  }).filter(Boolean);

  PERSONAS.forEach((persona, personaIndex) => {
    const text = [
      persona.name,
      persona.role,
      persona.quote,
      ...persona.info.map(([label, value]) => `${label}: ${value}`),
      ...persona.social.map(channel => `${channel.name} ${channel.pct}%`),
    ].join(' ');
    if (normalizeSearchText(text).includes(normalizedQuery)) {
      matches.push({
        personaIndex,
        personaName: `${persona.name} · ${persona.role}`,
        pageKey: 'personas',
        text: text.replace(/\s+/g, ' '),
        titleMatch: normalizeSearchText(persona.name).includes(normalizedQuery),
      });
    }
  });

  Object.entries(reportContent).forEach(([reportType, content]) => {
    const container = document.createElement('div');
    container.innerHTML = content;
    const text = container.textContent.trim().replace(/\s+/g, ' ');
    if (normalizeSearchText(text).includes(normalizedQuery)) {
      matches.push({
        reportType,
        reportTitle: `Relatório de ${reportType}`,
        pageKey: 'overview',
        text,
        titleMatch: normalizeSearchText(reportType).includes(normalizedQuery),
      });
    }
  });

  matches.sort((first, second) => Number(second.titleMatch) - Number(first.titleMatch));
  const limitedMatches = matches.slice(0, 8);

  if (limitedMatches.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'search-empty';
    emptyMessage.textContent = 'Nenhum resultado encontrado no dashboard.';
    searchResults.append(emptyMessage);
  } else {
    limitedMatches.forEach(({ element, text, pageKey, personaIndex, personaName, reportType, reportTitle }) => {
      const result = document.createElement('button');
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      const pageLabel = document.createElement('small');
      result.type = 'button';
      result.className = 'search-result';
      result.setAttribute('role', 'option');
      title.textContent = personaName || reportTitle || getSearchLabel(element);
      detail.textContent = text.length > 150 ? text.slice(0, 147) + '…' : text;
      pageLabel.textContent = pageKey ? PAGE_NAMES[pageKey] || pageKey : 'Fontes e metodologia';
      result.append(title, detail, pageLabel);
      result.addEventListener('click', () => {
        if (pageKey) {
          const navItem = document.querySelector(`.nav-item[data-page="${pageKey}"]`);
          if (navItem) navItem.click();
        }
        if (personaIndex !== undefined) {
          const personaTab = document.querySelector(`.ptab[data-persona="${personaIndex}"]`);
          if (personaTab) personaTab.click();
        }
        if (reportType) {
          const reportTab = Array.from(document.querySelectorAll('.rtag[data-group="report"]'))
            .find(tab => tab.textContent.trim() === reportType);
          if (reportTab) reportTab.click();
        }
        setSearchResultsOpen(false);
        requestAnimationFrame(() => {
          const target = personaIndex !== undefined
            ? document.querySelector('.persona-card')
            : reportType
              ? document.getElementById('reportBody')
              : element;
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
      searchResults.append(result);
    });
  }

  setSearchResultsOpen(true);
}

searchInput.addEventListener('input', renderSearchResults);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    searchInput.value = '';
    setSearchResultsOpen(false);
    searchInput.blur();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search-box')) setSearchResultsOpen(false);
});

// 12. TOGGLE DE TEMA (claro / escuro)
const themeToggle = document.getElementById('themeToggle');
function updateChartTheme(isLight) {
  const previous = { ...C };
  Object.assign(C, isLight ? {
    blue: '#6f66df',
    blueH: '#a987f3',
    blueD: '#5249bb',
    white: '#2f2b3a',
    w70: 'rgba(47,43,58,0.70)',
    w40: 'rgba(47,43,58,0.52)',
    w15: 'rgba(111,102,223,0.10)',
    grid: 'rgba(47,43,58,0.10)',
  } : {
    blue: '#998cff',
    blueH: '#b49aff',
    blueD: '#7568df',
    white: '#e8eaf0',
    w70: 'rgba(232,234,240,0.76)',
    w40: 'rgba(192,198,210,0.72)',
    w15: 'rgba(153,140,255,0.16)',
    grid: 'rgba(192,198,210,0.12)',
  });

  Chart.defaults.color = C.w40;
  Object.values(Chart.instances).forEach(chart => {
    Object.values(chart.options.scales || {}).forEach(scale => {
      if (scale.ticks) scale.ticks.color = C.w40;
      if (scale.grid && scale.grid.display !== false) scale.grid.color = C.grid;
      if (scale.pointLabels) scale.pointLabels.color = C.w70;
    });
    const legendLabels = chart.options.plugins.legend && chart.options.plugins.legend.labels;
    if (legendLabels) legendLabels.color = C.w40;
    chart.data.datasets.forEach(dataset => {
      ['borderColor', 'backgroundColor', 'pointBackgroundColor', 'pointBorderColor'].forEach(key => {
        const recolor = color => {
          if (color === previous.blue) return C.blue;
          if (color === previous.blueH) return C.blueH;
          if (color === previous.blueD) return C.blueD;
          if (color === previous.w70) return C.w70;
          if (color === previous.w40) return C.w40;
          if (color === previous.w15) return C.w15;
          if (color === previous.grid) return C.grid;
          return color;
        };
        if (Array.isArray(dataset[key])) dataset[key] = dataset[key].map(recolor);
        else if (typeof dataset[key] === 'string') dataset[key] = recolor(dataset[key]);
      });
    });
    chart.update('none');
  });
}

function applyTheme(isLight) {
  const body = document.body;
  if (isLight) {
    body.classList.add('theme-light');
    themeToggle.classList.add('on');
    themeToggle.setAttribute('aria-checked', 'true');
    themeToggle.setAttribute('aria-label', 'Tema claro ativado');
  } else {
    body.classList.remove('theme-light');
    themeToggle.classList.remove('on');
    themeToggle.setAttribute('aria-checked', 'false');
    themeToggle.setAttribute('aria-label', 'Tema escuro ativado');
  }
  updateChartTheme(isLight);
}

// inicializa a partir do localStorage (se houver)
try {
  const saved = localStorage.getItem('zelo_theme');
  const isLight = saved === 'light';
  applyTheme(isLight);
} catch (e) {
  // ignore storage errors
}

function toggleTheme() {
  const isLight = !document.body.classList.contains('theme-light');
  applyTheme(isLight);
  try { localStorage.setItem('zelo_theme', isLight ? 'light' : 'dark'); } catch (e) {}
}

themeToggle.addEventListener('click', toggleTheme);
themeToggle.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); }
});

// 3. ROI TOGGLE
const roiToggleEl = document.getElementById('roiToggle');
roiToggleEl.addEventListener('click', function () {
  const extra = document.getElementById('roiExtra');
  extra.classList.toggle('hidden');
  const isHidden = extra.classList.contains('hidden');
  // update aria states and visible label
  this.setAttribute('aria-expanded', String(!isHidden));
  extra.setAttribute('aria-hidden', String(isHidden));
  this.textContent = isHidden ? '▼ Detalhes' : '▲ Ocultar';
});
// support keyboard (Enter / Space) for the ROI toggle
roiToggleEl.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.click();
  }
});

// 4. DIAS DE ENGAJAMENTO
document.querySelectorAll('.day-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.day-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('engBig').innerHTML = this.dataset.eng + '<span>%</span>';
  });
});

// 5. REPORT TAGS
const reportContent = {
  Locação: `<strong>Mercado de Locação · Campinas · setembro/2026</strong><br><br>
    Com data de corte em 30/09/2026, o dado público mais recente do FipeZAP é agosto. Em Campinas, a locação residencial avançou <strong>1,24% no mês</strong>, <strong>10,36% em 2026</strong> e <strong>17,91% em 12 meses</strong>, com preço médio anunciado de <strong>R$ 56,21/m²</strong> e rental yield de <strong>8,23% a.a.</strong>. O ritmo supera a média nacional do índice, que acumulou 9,16% em 12 meses.`,
  Venda: `<strong>Mercado de Venda · Campinas · setembro/2026</strong><br><br>
    No FipeZAP de agosto, Campinas registrou <strong>+1,18% no mês</strong>, <strong>+7,09% em 2026</strong> e <strong>+11,18% em 12 meses</strong>, com preço médio anunciado de <strong>R$ 8.089/m²</strong>. No 2º trimestre, a microrregião registrou <strong>1.880 lançamentos</strong> (+8,5% ante o trimestre anterior) e <strong>2.103 vendas</strong>, segundo o Secovi-SP.`,
  Gestão: `<strong>Gestão e Administração · Zelo 2026</strong><br><br>
    Setembro terminou com Selic em <strong>13,75% a.a.</strong>, ainda pressionando a capacidade de financiamento e reforçando a relevância da locação e da gestão de carteira. Para a Zelo, o foco operacional deve combinar precificação baseada em comparáveis, velocidade de resposta, documentação digital, acompanhamento de leads e serviços recorrentes ao proprietário.`,
};

document.querySelectorAll('.rtag[data-group="report"]').forEach(tag => {
  tag.addEventListener('click', function () {
    document.querySelectorAll('.rtag[data-group="report"]').forEach(t => {
      t.classList.remove('on');
      t.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('on');
    this.setAttribute('aria-pressed', 'true');
    document.getElementById('reportBody').innerHTML = reportContent[this.textContent.trim()] || '';
  });
});

function extractText(element) {
  const blockElements = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'DT', 'DD',
    'FIGCAPTION', 'FIGURE', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'SECTION', 'TABLE',
    'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'UL',
  ]);

  function readNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches('canvas, script, style')) return '';
    if (node.tagName === 'BR') return '\n';

    const content = Array.from(node.childNodes, readNode).join('');
    return blockElements.has(node.tagName) ? `\n${content}\n` : content;
  }

  return readNode(element).replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function buildCompleteReport() {
  const generatedAt = new Date().toLocaleDateString('pt-BR');
  const sections = Array.from(document.querySelectorAll('.page')).map(page => {
    const heading = page.querySelector('.section-header h2');
    return `${heading ? heading.textContent.trim() : PAGE_NAMES[page.id.replace('page-', '')]}\n${extractText(page)}`;
  });
  const reportSections = Object.entries(reportContent).map(([title, content]) => {
    const container = document.createElement('div');
    container.innerHTML = content;
    return `${title}\n${extractText(container)}`;
  });
  const personaSections = PERSONAS.map(persona => [
    `${persona.name} · ${persona.role}`,
    persona.quote,
    ...persona.info.map(([label, value]) => `${label}: ${value}`),
    `Canais digitais: ${persona.social.map(channel => `${channel.name} (${channel.pct}%)`).join(', ')}`,
  ].join('\n'));
  const sources = Array.from(document.querySelectorAll('.sources-grid a'))
    .map(link => `- ${link.textContent.trim()}: ${link.href}`)
    .join('\n');
  const methodology = extractText(document.querySelector('.method-note'));

  return [
    'ZELO IMÓVEIS — RELATÓRIO DE MERCADO',
    'Campinas · setembro/2026',
    `Arquivo gerado em ${generatedAt}`,
    'Data de corte do estudo: 30/09/2026',
    '',
    ...sections,
    '',
    'RELATÓRIOS TEMÁTICOS',
    ...reportSections,
    '',
    'PERSONAS — HIPÓTESES ESTRATÉGICAS',
    ...personaSections,
    '',
    'FONTES',
    sources,
    '',
    'NOTA METODOLÓGICA',
    methodology,
  ].join('\n\n');
}

const downloadButton = document.getElementById('dlBtn');
const downloadStatus = document.getElementById('downloadStatus');
downloadButton.addEventListener('click', () => {
  try {
    if (typeof Blob === 'undefined' || !URL.createObjectURL) {
      throw new Error('Este navegador não oferece suporte ao download do relatório.');
    }

    const report = buildCompleteReport();
    const file = new Blob(['\uFEFF', report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-zelo-mercado-campinas-2026.txt';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    downloadStatus.textContent = 'Relatório completo baixado em formato TXT.';
    downloadStatus.classList.remove('error');
  } catch (error) {
    console.error('Não foi possível gerar o relatório completo.', error);
    downloadStatus.textContent = error.message || 'Não foi possível gerar o relatório. Tente novamente.';
    downloadStatus.classList.add('error');
  }
});

// 6. EXPORT BUTTON
document.getElementById('exportBtn').addEventListener('click', () => {
  window.print();
});

// 7. GRÁFICOS — VISÃO GERAL (carrega ao iniciar)
function renderOverviewCharts() {

  // Donut portfólio
  new Chart(document.getElementById('donutPortfolio'), {
    type: 'doughnut',
    data: {
      labels: ['Locação', 'Venda'],
      datasets: [{
        data: [62, 38],
        backgroundColor: ['#c9f35d', 'rgba(255,255,255,0.20)'],
        borderWidth: 0,
        hoverOffset: 5,
      }],
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw}%` } } },
      animation: { duration: 1200 },
    },
  });

  // ROI line
  new Chart(document.getElementById('roiLine'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        data: [48, 52, 55, 59, 63, 68],
        borderColor: C.blue,
        backgroundColor: 'rgba(37,99,235,0.15)',
        fill: true,
        tension: 0.45,
        pointRadius: 0,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { display: false }, y: { display: false } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });

  // Trend main
  const trendChart = new Chart(document.getElementById('trendMain'), {
    type: 'line',
    data: {
      labels: ['Venda 12 meses', 'Venda acumulado 2026'],
      datasets: [
        {
          label: 'Variação em Campinas (%)',
          data: [11.18, 7.09],
          borderColor: C.blue,
          backgroundColor: 'rgba(37,99,235,0.1)',
          fill: true, tension: 0.45,
          pointRadius: 5, pointBackgroundColor: C.blue, pointBorderColor: '#ffffff', pointBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: 'Referência nacional (%)',
          data: [5.49, 3.44],
          borderColor: C.blueH,
          backgroundColor: 'rgba(59,130,246,0.05)',
          fill: true, tension: 0.45,
          pointRadius: 4, pointBackgroundColor: C.blueH,
          borderWidth: 2, borderDash: [5, 4],
        },
        {
          label: 'IPCA de referência (%)',
          data: [4.14, 3.02],
          borderColor: C.w40,
          backgroundColor: 'transparent',
          fill: false, tension: 0.4,
          pointRadius: 3, pointBackgroundColor: '#ffffff',
          borderWidth: 1.5, borderDash: [2, 3],
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 11 } } },
        y: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 11 }, callback: v => v + '%' } },
        y2: { display: true, position: 'right', grid: { display: false }, ticks: { color: 'rgba(47,43,58,0.25)', font: { size: 10 }, callback: v => v != null ? v + '%' : '' } },
      },
      plugins: {
        legend: { labels: { color: C.w40, font: { size: 11 }, boxWidth: 10 } },
        tooltip,
      },
    },
  });

  const trendSeries = {
    trendVendas: {
      labels: ['Venda 12 meses', 'Venda acumulado 2026'],
      campinasLabel: 'Preço de venda em Campinas (FipeZAP)',
      campinas: [11.18, 7.09],
      nacional: [5.49, 3.44],
      ipca: [4.14, 3.02],
    },
    trendLocacao: {
      labels: ['Locação 12 meses', 'Locação acumulado 2026'],
      campinasLabel: 'Preço de locação em Campinas (FipeZAP)',
      campinas: [17.91, 10.36],
      nacional: [9.16, 6.56],
      ipca: [4.22, 3.11],
    },
  };
  const trendChartContainer = document.getElementById('trendChartContainer');
  const trendChartMessage = document.getElementById('trendChartMessage');
  const trendChips = document.querySelectorAll('.trend-top .chip');

  trendChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const series = trendSeries[this.dataset.target];
      trendChips.forEach(control => {
        const isSelected = control === this;
        control.classList.toggle('on', isSelected);
        control.setAttribute('aria-pressed', String(isSelected));
      });

      if (!series) {
        trendChartContainer.hidden = true;
        trendChartMessage.hidden = false;
        return;
      }

      trendChartContainer.hidden = false;
      trendChartMessage.hidden = true;
      trendChart.data.labels = series.labels;
      trendChart.data.datasets[0].label = series.campinasLabel;
      trendChart.data.datasets[0].data = series.campinas;
      trendChart.data.datasets[1].data = series.nacional;
      trendChart.data.datasets[2].data = series.ipca;
      trendChart.resize();
      trendChart.update();
    });
  });
}

// 8. GRÁFICOS — MERCADO
let marketRendered = false;
function renderMarketCharts() {
  if (marketRendered) return;
  marketRendered = true;

  // Locação por tipologia (dados QuintoAndar Campinas)
  new Chart(document.getElementById('locacaoChart'), {
    type: 'bar',
    data: {
      labels: ['1 dormitório', '2 dormitórios', '3 dormitórios', '4+ dormitórios'],
      datasets: [{
        label: 'Preço médio de locação (R$/m²)',
        data: [72.41, 51.13, 46.86, 48.28],
        backgroundColor: [C.blue, C.blue, C.blueH, C.blueH, C.blueH, C.blue, C.blue, C.blue],
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: C.w40, font: { size: 10 } } },
        y: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 }, callback: v => 'R$ ' + v.toLocaleString('pt-BR') } },
      },
      plugins: { legend: { display: false }, tooltip },
    },
  });

  // Lançamentos por segmento (Secovi-SP/ABRAINC 2024)
  new Chart(document.getElementById('lancamentosChart'), {
    type: 'doughnut',
    data: {
      labels: ['Minha Casa, Minha Vida', 'Demais segmentos'],
      datasets: [{
        data: [1313, 790],
        backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom', labels: { color: C.w70, font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip,
      },
    },
  });

  // Preço m² por bairro
  new Chart(document.getElementById('m2Chart'), {
    type: 'bar',
    data: {
      labels: ['Venda resid. 12m', 'Locação resid. 12m', 'Yield resid.', 'Venda com. 12m', 'Locação com. 12m', 'Yield com.'],
      datasets: [{
        label: 'Percentual (%)',
        data: [11.18, 17.91, 8.23, 4.58, 7.23, 8.87],
        backgroundColor: C.blue,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 }, callback: v => v + '%' } },
        y: { grid: { display: false }, ticks: { color: C.w70, font: { size: 11 } } },
      },
      plugins: { legend: { display: false }, tooltip },
    },
  });

  // Histórico de vendas
  new Chart(document.getElementById('vendasHistChart'), {
    type: 'line',
    data: {
      labels: ['Lançamentos 2T26', 'Vendas 2T26'],
      datasets: [{
        label: 'Unidades',
        data: [1880, 2103],
        borderColor: C.blue,
        backgroundColor: 'rgba(37,99,235,0.12)',
        fill: true, tension: 0.4,
        pointRadius: 4, pointBackgroundColor: C.blue, pointBorderColor: '#ffffff', pointBorderWidth: 2,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: C.w40, font: { size: 10 } } },
        y: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 } } },
      },
      plugins: { legend: { display: false }, tooltip },
    },
  });

  // Tipos mais buscados
  new Chart(document.getElementById('buscasChart'), {
    type: 'pie',
    data: {
      labels: ['Econômico', 'Médio padrão', 'Médio/alto', 'Alto padrão'],
      datasets: [{
        data: [58479, 13057, 8150, 7215],
        backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: C.w70, font: { size: 10 }, boxWidth: 10, padding: 6 } },
        tooltip,
      },
    },
  });
}

// 9. GRÁFICOS — REDES SOCIAIS
let socialRendered = false;
function renderSocialCharts() {
  if (socialRendered) return;
  socialRendered = true;

  // Donut leads por plataforma
  new Chart(document.getElementById('leadsDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Instagram', 'WhatsApp', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn'],
      datasets: [{
        data: [30, 27, 14, 16, 9, 4],
        backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { color: C.w70, font: { size: 11 }, boxWidth: 8, padding: 8 } },
        tooltip: { ...tooltip, callbacks: { label: c => ` ${c.label}: ${c.raw}% dos leads` } },
      },
    },
  });

  // Radar engajamento vs conversão
  new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: {
      labels: ['Instagram', 'WhatsApp', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn'],
      datasets: [
        {
          label: 'Engajamento',
          data: [90, 92, 55, 76, 72, 48],
          borderColor: C.blue,
          backgroundColor: 'rgba(37,99,235,0.15)',
          pointBackgroundColor: C.blue,
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Conversão em Lead',
          data: [76, 95, 54, 58, 34, 46],
          borderColor: C.w40,
          backgroundColor: 'rgba(169,135,243,0.08)',
          pointBackgroundColor: '#ffffff',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: 'rgba(37,99,235,0.15)' },
          angleLines: { color: 'rgba(37,99,235,0.12)' },
          ticks: { display: false },
          pointLabels: { color: C.w70, font: { size: 11, family: 'Poppins' } },
          suggestedMin: 0, suggestedMax: 100,
        },
      },
      plugins: {
        legend: { labels: { color: C.w40, font: { size: 11 }, boxWidth: 10 } },
        tooltip,
      },
    },
  });
}

// 10. GRÁFICOS — CONCORRENTES
let compRendered = false;
function renderCompetitorCharts() {
  if (compRendered) return;
  compRendered = true;

  // Comparativo estratégico de maturidade digital (hipótese interna; validar com Analytics)
  new Chart(document.getElementById('instagramComp'), {
    type: 'bar',
    data: {
      labels: ['Start Imóveis', 'D. Lange', 'Cássia Adala', 'QuintoAndar', 'Zelo Imóveis'],
      datasets: [{
        label: 'Índice de maturidade digital',
        data: [88, 78, 74, 96, 58],
        backgroundColor: (ctx) => ctx.dataIndex === 4 ? C.blue : C.w15,
        borderColor: (ctx) => ctx.dataIndex === 4 ? C.blueH : C.w15,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 }, callback: v => v + ' pts' } },
        y: { grid: { display: false }, ticks: { color: C.w70, font: { size: 10 } } },
      },
      plugins: { legend: { display: false }, tooltip },
    },
  });

  // Portfólio comparativo
  new Chart(document.getElementById('portfolioComp'), {
    type: 'bar',
    data: {
      labels: ['Zelo Imóveis', 'QuintoAndar\n(Campinas)', 'Cássia Adala', 'Start Imóveis', 'D. Lange'],
      datasets: [
        {
          label: 'Índice relativo de escala',
          data: [100, 85, 62, 58, 55],
          backgroundColor: [C.blue, 'rgba(249,115,22,0.5)', C.w15, C.w15, C.w15],
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: 'y',
        },
        {
          label: 'Anos de Atuação',
          data: [50, 12, 14, 9, 21],
          backgroundColor: 'rgba(37,99,235,0.2)',
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: 'y2',
          type: 'line',
          borderColor: C.blueH,
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: C.blueH,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: C.w40, font: { size: 11 } } },
        y: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 }, callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v } },
        y2: { position: 'right', grid: { display: false }, ticks: { color: 'rgba(59,130,246,0.6)', font: { size: 10 }, callback: v => v + ' anos' } },
      },
      plugins: { legend: { labels: { color: C.w40, font: { size: 11 }, boxWidth: 10 } }, tooltip },
    },
  });
}

// 11. PERSONAS
const PERSONAS = [
  {
    emoji: '👩‍💼',
    name: 'Ana Lima (hipótese CRM)',
    role: 'Locatária Digital · 28 anos',
    quote: '"Busco praticidade. Quero resolver tudo pelo celular, tour virtual antes de visitar e contrato rápido."',
    info: [
      ['Idade', '25–34 anos'],
      ['Cidade', 'Campinas / Barão Geraldo'],
      ['Renda', 'R$ 4.500–R$ 7.000/mês'],
      ['Objetivo', 'Alugar apto 1–2Q próximo à UNICAMP'],
      ['Orçamento', 'R$ 1.800–R$ 2.800/mês'],
      ['Decisão', '2–3 semanas'],
      ['Dor', 'Fiador e burocracia excessiva'],
      ['Concorrente', 'QuintoAndar (sem fiador)'],
    ],
    social: [
      { icon: '📸', name: 'Instagram', pct: 95 },
      { icon: '💬', name: 'WhatsApp', pct: 90 },
      { icon: '🎵', name: 'TikTok', pct: 70 },
      { icon: '▶️', name: 'YouTube', pct: 55 },
      { icon: '👤', name: 'Facebook', pct: 20 },
      { icon: '💼', name: 'LinkedIn', pct: 35 },
    ],
  },
  {
    emoji: '👨‍👩‍👧',
    name: 'Carlos Souza (hipótese CRM)',
    role: 'Comprador Família · 38 anos',
    quote: '"Preciso de segurança, escola boa por perto e um lugar onde minha filha possa crescer bem."',
    info: [
      ['Idade', '35–44 anos'],
      ['Cidade', 'Campinas / Taquaral / Guanabara'],
      ['Renda', 'R$ 8.000–R$ 15.000/mês'],
      ['Objetivo', 'Comprar casa ou apto 3Q'],
      ['Orçamento', 'R$ 450k–R$ 700k'],
      ['Decisão', '3–6 meses'],
      ['Dor', 'Taxa de juros alta / parcelas altas'],
      ['Plataforma', 'ZAP Imóveis, YouTube, WhatsApp'],
    ],
    social: [
      { icon: '💬', name: 'WhatsApp', pct: 95 },
      { icon: '👤', name: 'Facebook', pct: 75 },
      { icon: '▶️', name: 'YouTube', pct: 80 },
      { icon: '📸', name: 'Instagram', pct: 65 },
      { icon: '🎵', name: 'TikTok', pct: 20 },
      { icon: '💼', name: 'LinkedIn', pct: 40 },
    ],
  },
  {
    emoji: '📱',
    name: 'Giovanna Reis (hipótese CRM)',
    role: 'Gen Z TikTok · 22 anos',
    quote: '"Vi um Reels de um apê no Cambuí e fui atrás. Se não está nas redes, pra mim não existe."',
    info: [
      ['Idade', '18–24 anos'],
      ['Cidade', 'Campinas / Cambuí / Centro'],
      ['Renda', 'R$ 2.000–R$ 3.500/mês'],
      ['Objetivo', 'Primeiro aluguel solo ou studio'],
      ['Orçamento', 'R$ 900–R$ 1.600/mês'],
      ['Decisão', '1–2 semanas'],
      ['Dor', 'Comprovação de renda / fiador'],
      ['Canal preferido', 'Instagram DM e TikTok'],
    ],
    social: [
      { icon: '🎵', name: 'TikTok', pct: 98 },
      { icon: '📸', name: 'Instagram', pct: 92 },
      { icon: '💬', name: 'WhatsApp', pct: 80 },
      { icon: '▶️', name: 'YouTube', pct: 60 },
      { icon: '👤', name: 'Facebook', pct: 10 },
      { icon: '💼', name: 'LinkedIn', pct: 15 },
    ],
  },
  {
    emoji: '💼',
    name: 'Roberto Almeida (hipótese CRM)',
    role: 'Investidor Imobiliário · 48 anos',
    quote: '"Quero dados de valorização, cap rate e rentabilidade. Tomada de decisão baseada em números."',
    info: [
      ['Idade', '45–55 anos'],
      ['Cidade', 'Campinas / Mansões / Cambuí'],
      ['Renda', 'R$ 20.000+/mês'],
      ['Objetivo', 'Adquirir imóvel para renda passiva'],
      ['Orçamento', 'R$ 600k–R$ 2M'],
      ['Decisão', '1–3 meses'],
      ['Dor', 'Falta de dados analíticos rápidos'],
      ['Canal preferido', 'LinkedIn, Email, WhatsApp'],
    ],
    social: [
      { icon: '💼', name: 'LinkedIn', pct: 90 },
      { icon: '💬', name: 'WhatsApp', pct: 85 },
      { icon: '▶️', name: 'YouTube', pct: 70 },
      { icon: '👤', name: 'Facebook', pct: 50 },
      { icon: '📸', name: 'Instagram', pct: 40 },
      { icon: '🎵', name: 'TikTok', pct: 5 },
    ],
  },
  {
    emoji: '👵',
    name: 'Marta Costa (hipótese CRM)',
    role: 'Relocadora Madura · 58 anos',
    quote: '"Quero um lugar mais calmo, seguro, menor. Atendimento presencial e alguém de confiança."',
    info: [
      ['Idade', '55+ anos'],
      ['Cidade', 'Campinas / bairros residenciais'],
      ['Renda', 'Aposentadoria + renda extra'],
      ['Objetivo', 'Reduzir imóvel / trocar localização'],
      ['Orçamento', 'Flexível (tem imóvel a vender)'],
      ['Decisão', '3–8 meses'],
      ['Dor', 'Desconfiança em plataformas online'],
      ['Canal preferido', 'WhatsApp, Facebook, indicação'],
    ],
    social: [
      { icon: '💬', name: 'WhatsApp', pct: 95 },
      { icon: '👤', name: 'Facebook', pct: 80 },
      { icon: '▶️', name: 'YouTube', pct: 50 },
      { icon: '📸', name: 'Instagram', pct: 35 },
      { icon: '🎵', name: 'TikTok', pct: 5 },
      { icon: '💼', name: 'LinkedIn', pct: 20 },
    ],
  },
];

function renderPersonaCard(index) {
  const p = PERSONAS[index];
  const socialRows = p.social.map(s => `
    <div class="p-social-row">
      <span>${s.icon}</span>
      <span class="psr-name">${s.name}</span>
      <div class="psr-bar-wrap"><div class="psr-bar" style="width:${s.pct}%"></div></div>
      <span class="psr-pct">${s.pct}%</span>
    </div>`).join('');
  const infoRows = p.info.map(([l, v]) => `
    <div class="pi"><span class="pi-label">${l}</span><span class="pi-val">${v}</span></div>`).join('');

  document.getElementById('personaDisplay').innerHTML = `
    <div class="persona-card">
      <div class="persona-avatar-col">
        <div class="p-avatar">${p.emoji}</div>
        <div>
          <div class="p-name">${p.name}</div>
          <div class="p-role">${p.role}</div>
          <div class="p-quote" style="margin-top:10px">${p.quote}</div>
        </div>
      </div>
      <div class="persona-info-col">
        <h4>📋 Perfil Detalhado</h4>
        <div class="p-info-list">${infoRows}</div>
      </div>
      <div class="persona-social-col">
        <h4>📱 Uso de Redes Sociais</h4>
        <div class="p-social-list">${socialRows}</div>
      </div>
    </div>`;
}

document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.ptab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    renderPersonaCard(+this.dataset.persona);
  });
});

let personaRendered = false;
function renderPersonaCharts() {
  if (personaRendered) return;
  personaRendered = true;

  renderPersonaCard(0);

  // Comportamento por persona
  new Chart(document.getElementById('personaBehavior'), {
    type: 'bar',
    data: {
      labels: ['Instagram', 'WhatsApp', 'Facebook', 'YouTube', 'TikTok', 'LinkedIn'],
      datasets: [
        { label: 'Ana (Locatária 28)', data: [95, 90, 20, 55, 70, 35], backgroundColor: 'rgba(37,99,235,0.7)', borderRadius: 4 },
        { label: 'Carlos (Família 38)', data: [65, 95, 75, 80, 20, 40], backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 4 },
        { label: 'Giovanna (Gen Z 22)', data: [92, 80, 10, 60, 98, 15], backgroundColor: 'rgba(96,165,250,0.5)', borderRadius: 4 },
        { label: 'Roberto (Investidor)', data: [40, 85, 50, 70, 5, 90], backgroundColor: 'rgba(147,197,253,0.5)', borderRadius: 4 },
        { label: 'Marta (55+)', data: [35, 95, 80, 50, 5, 20], backgroundColor: 'rgba(219,234,254,0.5)', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: C.w70, font: { size: 11 } } },
        y: { grid: { color: C.grid }, ticks: { color: C.w40, font: { size: 10 }, callback: v => v + '%' }, max: 100 },
      },
      plugins: {
        legend: { labels: { color: C.w40, font: { size: 11 }, boxWidth: 10 } },
        tooltip,
      },
    },
  });
}

// INIT
renderOverviewCharts();
