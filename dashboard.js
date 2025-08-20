const MONTHS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

let tableItemLimit = 5
let selectedMonths = []
let monthsBlocksRendered = []
const monthBlocks = new Map();

function getMonthData(platform) {
  let data = {};
  const monthObj = window.monthsData ?? {};
  const platformSelectDiv = document?.getElementById('platformCustomSelect');
  const device = platform || platformSelectDiv?.querySelector('.custom-select-value')?.textContent?.trim()?.toLowerCase()

  Object.keys(monthObj).forEach(monthKey => {
    if (device === 'desktop e mobile') {
      const m = monthObj[monthKey].mobile || { historicoDiario: {} };
      const d = monthObj[monthKey].desktop || { historicoDiario: {} };

      const historicoDiario = {};

      const todasDatas = new Set([
        ...Object.keys(m.historicoDiario || {}),
        ...Object.keys(d.historicoDiario || {})
      ]);

      todasDatas.forEach(dataDia => {
        const mob = m.historicoDiario?.[dataDia] || {};
        const desk = d.historicoDiario?.[dataDia] || {};

        const r1 = mob.resumoDiario || {};
        const r2 = desk.resumoDiario || {};

        const resumo = {
          origem: device,
          buscasComResultado: Number(r1.buscasComResultado || 0) + Number(r2.buscasComResultado || 0),
          buscasSemResultado: Number(r1.buscasSemResultado || 0) + Number(r2.buscasSemResultado || 0),
          cliques: Number(r1.cliques || 0) + Number(r2.cliques || 0),
          cliquesUnicos: Number(r1.cliquesUnicos || 0) + Number(r2.cliquesUnicos || 0),
          pedidos: Number(r1.pedidos || 0) + Number(r2.pedidos || 0),
          vendas: Number(r1.vendas || 0) + Number(r2.vendas || 0),
          ctr: 0,
          conversao: 0,
          ticketMedio: 0
        };

        resumo.ctr = resumo.cliques && resumo.buscasComResultado
          ? +(resumo.cliques / resumo.buscasComResultado * 100).toFixed(2)
          : 0;

        resumo.conversao = resumo.pedidos && resumo.cliques
          ? +(resumo.pedidos / resumo.cliques * 100).toFixed(2)
          : 0;

        resumo.ticketMedio = resumo.pedidos
          ? +(resumo.vendas / resumo.pedidos).toFixed(2)
          : 0;

        historicoDiario[dataDia] = {
          resumoDiario: resumo,
          termosSemResultado: [...(mob.termosSemResultado || []), ...(desk.termosSemResultado || [])],
          termosComResultado: [...(mob.termosComResultado || []), ...(desk.termosComResultado || [])]
        };
      });

      const dias = Object.values(historicoDiario);
      let totalBuscas = 0
      let buscasComResultado = 0
      let buscasSemResultado = 0
      let conversaoSoma = 0
      let ctrSoma = 0
      let ticketSoma = 0
      let vendas = 0
      let pedidos = 0;

      dias.forEach(dia => {
        const r = dia.resumoDiario || {};

        totalBuscas += Number(r.buscasSemResultado || 0) + Number(r.buscasComResultado || 0);
        buscasComResultado += Number(r.buscasComResultado || 0);
        buscasSemResultado += Number(r.buscasSemResultado || 0);
        conversaoSoma += Number(r.conversao || 0);
        ctrSoma += Number(r.ctr || 0);
        ticketSoma += Number(r.ticketMedio || 0);
        vendas += Number(r.vendas || 0);
        pedidos += Number(r.pedidos || 0);
      });

      const diasCount = dias.length;
      data[monthKey] = {
        name: m.name || d.name,
        year: m.year || d.year,
        available: (m.available || d.available) && diasCount > 0,
        historicoDiario,
        totalBuscas,
        buscasComResultado,
        buscasSemResultado,
        conversao: diasCount ? +(conversaoSoma / diasCount).toFixed(2) : 0,
        ctr: diasCount ? +(ctrSoma / diasCount).toFixed(1) : 0,
        ticketMedio: diasCount ? +(ticketSoma / diasCount).toFixed(2) : 0,
        vendas,
        pedidos
      };
    } else {
      data[monthKey] = monthObj[monthKey][device];
    }
  });

  return data;
}

function generateTableHTML(headers, rows) {
  let html = '<table class="mini-data-table"><thead><tr>';
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => { html += `<td>${cell}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

document.addEventListener('DOMContentLoaded', function () {
  const versaoEl = document.getElementById('versao-dash');
  if (versaoEl) versaoEl.textContent = `Versão ${window.ENV.VERSION}`;

  const ultimaAtualizacaoEl = document.getElementById('ultima-atualizacao-valor');
  if (ultimaAtualizacaoEl) ultimaAtualizacaoEl.textContent = window.ENV.LAST_UPDATE;

  if (!(window.monthsData && typeof window.monthsData === "object")) return;

  const dataMonths = getMonthData();

  initializeMonthSelector(dataMonths);
  initializeModals();
  updateDashboard(dataMonths);
});

function initializeMonthSelector(dataMonths, flag) {
  const timeline = document.getElementById('monthTimeline');
  timeline.innerHTML = '';

  Object.keys(dataMonths).forEach(monthKey => {
    const monthObj = dataMonths[monthKey];

    const isAvailable = !!monthObj.available && Object.keys(monthObj.historicoDiario || {}).length > 0;

    const card = document.createElement('div');

    if (isAvailable) {
      card.addEventListener('click', function () { toggleMonth(monthKey, dataMonths) })
    }

    card.className = `month-card${!isAvailable ? ' disabled' : ''}${selectedMonths.includes(monthKey) ? ' selected' : ''}`;
    card.dataset.month = monthKey;
    card.innerHTML = `<div class="month-name">${monthObj.name}</div><div class="month-year">${monthObj.year}</div>`;

    timeline.appendChild(card);
  });
}


function toggleMonth(monthKey, dataMonths) {
  const idx = selectedMonths.indexOf(monthKey);

  if (idx > -1) {
    selectedMonths.splice(idx, 1);
  } else {
    selectedMonths.push(monthKey);

    selectedMonths.sort((a, b) => {
      const ma = dataMonths[a];
      const mb = dataMonths[b];

      if (ma.year !== mb.year) return ma.year - mb.year;

      const ordemMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      return ordemMeses.indexOf(ma.name) - ordemMeses.indexOf(mb.name);
    });
  }

  initializeModals();
  updateDashboard(dataMonths);
  initializeMonthSelector(dataMonths)
}

function updateDashboard(dataMonths) {
  const keyMetrics = document.getElementById('keyMetrics');
  const chartsSection = document.getElementById('chartsSection');
  const tableSection = document.getElementById('tableSection');
  const insightsSection = document.getElementById('insightsSection');
  const monthsBlocksContainer = document.getElementById('selected-months-blocks');
  const limitSelect = document.getElementById('itemLimit');

  if (limitSelect) {
    limitSelect.value = tableItemLimit;
    limitSelect.addEventListener('change', function () {
      tableItemLimit = parseInt(this.value);
      updateDetailedTable(dataMonths);
    });
  }

  if (monthsBlocksContainer) {
    monthsBlocksContainer.innerHTML = '';
    monthsBlocksRendered = [];
    selectedMonths.forEach(monthKey => { addSelectedMonthBlock(monthKey); });
    initializeModals()
  }

  if (selectedMonths.length === 0) {
    document.getElementById('kpiGrid').innerHTML = '<div style="text-align:center;color:#eaf7fb;font-size:1.2em;margin:15px 0;">Selecione pelo menos um mês acima.</div>';

    if (keyMetrics) keyMetrics.style.display = 'none';
    if (chartsSection) chartsSection.style.display = 'none';
    if (tableSection) tableSection.style.display = 'none';
    if (insightsSection) insightsSection.style.display = 'none';

  } else {
    if (keyMetrics) keyMetrics.style.display = '';
    if (chartsSection) chartsSection.style.display = '';
    if (tableSection) tableSection.style.display = '';
    if (insightsSection) insightsSection.style.display = '';

    updateKPIs(dataMonths);
    updateMainCharts(dataMonths);
    updateDetailedTable(dataMonths);
    updateInsights(dataMonths);
  }
}

function updateKPIs(dataMonths) {
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';

  // Novo: Utilitário para somar ou tirar média dos KPIs dos dias
  function _aggregateKPI(month) {
    if (!month || !month.historicoDiario) return {
      totalBuscas: 0, buscasComResultado: 0, conversao: 0, ctr: 0, ticketMedio: 0, vendas: 0, pedidos: 0
    };
    const dias = Object.values(month.historicoDiario);
    if (!dias.length) return {
      totalBuscas: 0, buscasComResultado: 0, conversao: 0, ctr: 0, ticketMedio: 0, vendas: 0, pedidos: 0
    };
    let totalBuscas = 0, buscasComResultado = 0, conversaoSoma = 0, ctrSoma = 0, ticketSoma = 0, vendas = 0, pedidos = 0;

    dias.forEach(d => {
      const r = d.resumoDiario || {};
      const buscas = Number(r.buscasSemResultado || 0) + Number(r.buscasComResultado || 0);
      totalBuscas += buscas;
      buscasComResultado += Number(r.buscasComResultado || 0);
      conversaoSoma += Number(r.conversao || 0);
      ctrSoma += Number(r.ctr || 0);
      ticketSoma += Number((r.vendas / r.pedidos) || 0);
      vendas += Number(r.vendas || 0);
      pedidos += Number(r.pedidos || 0);
    });

    const diasCount = dias.length;
    return {
      totalBuscas,
      buscasComResultado,
      conversao: diasCount ? +(conversaoSoma / diasCount).toFixed(2) : 0,
      ctr: diasCount ? +(ctrSoma / diasCount).toFixed(1) : 0,
      ticketMedio: diasCount ? +(ticketSoma / diasCount).toFixed(2) : 0,
      vendas,
      pedidos
    };
  }

  // Acumula os meses selecionados
  let totalBuscas = 0, buscasComResultado = 0, conversao = 0, ctr = 0, ticketMedio = 0, vendas = 0, pedidos = 0, meses = 0;
  selectedMonths.forEach(m => {
    const kpi = _aggregateKPI(dataMonths[m]);
    totalBuscas += kpi.totalBuscas;
    buscasComResultado += kpi.buscasComResultado;
    conversao += kpi.conversao;
    ctr += kpi.ctr;
    ticketMedio += kpi.ticketMedio;
    vendas += kpi.vendas;
    pedidos += kpi.pedidos;
    meses += 1;
  });

  // Para médias entre meses
  conversao = meses ? (conversao / meses) : 0;
  ctr = meses ? (ctr / meses) : 0;
  ticketMedio = meses ? (ticketMedio / meses) : 0;

  const kpis = [
    { label: 'Total de Buscas', value: totalBuscas.toLocaleString() },
    { label: 'Buscas com Resultado', value: buscasComResultado.toLocaleString() },
    { label: 'Taxa de Conversão', value: conversao.toFixed(2) + '%' },
    { label: 'CTR Médio', value: ctr.toFixed(1) + '%' },
    { label: 'Ticket Médio', value: 'R$ ' + ticketMedio.toFixed(2) },
  ];
  kpis.forEach(kpi => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `<div class="kpi-value">${kpi.value}</div>
                      <div class="kpi-label">${kpi.label}</div>`;
    grid.appendChild(card);
  });
}


function updateMainCharts(dataMonths) {
  const grid = document.getElementById('mainChartsGrid');
  grid.innerHTML = `
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Top 10 Termos Buscados
          <span class="info-trigger" data-modal="info-top10bar">i</span>
        </div>
      </div>
      <canvas id="chartTop10TermosBuscados"></canvas>
      <div id="table-chartTop10TermosBuscados" class="chart-table"></div>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Proporção Top 10 Buscas
          <span class="info-trigger" data-modal="info-top10pie">i</span>
        </div>
      </div>
      <canvas id="chartProporcaoTop10Buscas"></canvas>
      <div id="table-chartProporcaoTop10Buscas" class="chart-table"></div>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Taxa de Conversão
          <span class="info-trigger" data-modal="info-conversao">i</span>
        </div>
      </div>
      <canvas id="chartTaxaConversao"></canvas>
      <div id="table-chartTaxaConversao" class="chart-table"></div>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Evolução das Buscas
          <span class="info-trigger" data-modal="info-evolucao">i</span>
        </div>
      </div>
      <canvas id="chartEvolucaoBuscas"></canvas>
      <div id="table-chartEvolucaoBuscas" class="chart-table"></div>
    </div>
  `;

  // Utilitário para somar termos do mês (acumula por termo e ordena)
  function getTopTerms(dataMonths, monthsList, limit = 10) {
    const termoMap = {};
    monthsList.forEach(monthKey => {
      const month = dataMonths[monthKey];
      if (!month || !month.historicoDiario) return;
      Object.values(month.historicoDiario).forEach(dayObj => {
        (dayObj.termosComResultado || []).forEach(item => {
          if (!item.termo) return;
          if (!termoMap[item.termo]) {
            termoMap[item.termo] = { ...item };
          } else {
            termoMap[item.termo].buscas += item.buscas;
          }
        });
      });
    });
    return Object.values(termoMap).sort((a, b) => b.buscas - a.buscas).slice(0, limit);
  }

  // Para gráficos e tabelas principais
  const labelsTop = [];
  const valuesTop = [];
  const selected = selectedMonths;
  const topTerms = getTopTerms(dataMonths, selected, 10);
  topTerms.forEach(item => {
    labelsTop.push(item.termo);
    valuesTop.push(item.buscas);
  });

  // Gráfico Top 10 Termos Buscados (barra)
  renderBarTop10TermosBuscados(labelsTop, valuesTop);

  // Gráfico Proporção Top 10 (pizza)
  renderPieProporcaoTop10Buscas(labelsTop, valuesTop);

  // Tabelas dos gráficos
  const tableBarTopEl = document.getElementById('table-chartTop10TermosBuscados');
  if (tableBarTopEl) {
    const rows = labelsTop.map((label, i) => [label, valuesTop[i].toLocaleString()]);
    tableBarTopEl.innerHTML = generateTableHTML(['Termo', 'Buscas'], rows);
  }
  const tablePieTopEl = document.getElementById('table-chartProporcaoTop10Buscas');
  if (tablePieTopEl) {
    const totalSum = valuesTop.reduce((acc, val) => acc + val, 0);
    const rows = labelsTop.map((label, i) => {
      const pct = totalSum ? ((valuesTop[i] / totalSum) * 100).toFixed(1) + '%' : '0%';
      return [label, valuesTop[i].toLocaleString(), pct];
    });
    tablePieTopEl.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], rows);
  }

  // Gráfico Taxa de Conversão (barra)
  const monthNames = selected.map(m => dataMonths[m]?.name || '');
  const convValues = selected.map(m => {
    const month = dataMonths[m];
    if (!month || !month.historicoDiario) return 0;
    const dias = Object.values(month.historicoDiario);
    if (!dias.length) return 0;
    const soma = dias.reduce((a, d) => a + Number(d.resumoDiario?.conversao || 0), 0);
    return +(soma / dias.length).toFixed(2);
  });
  renderBarTaxaConversao(monthNames, convValues);
  const tableConvEl = document.getElementById('table-chartTaxaConversao');
  if (tableConvEl) {
    const rows = selected.map((monthKey, idx) => {
      return [monthNames[idx], convValues[idx].toFixed(2) + '%'];
    });
    tableConvEl.innerHTML = generateTableHTML(['Mês', 'Conversão (%)'], rows);
  }

  // Gráfico Evolução das Buscas (linha)
  const totalValues = selected.map(m => {
    const month = dataMonths[m];
    if (!month || !month.historicoDiario) return 0;
    const dias = Object.values(month.historicoDiario);
    return dias.reduce((a, d) =>
      a + Number(d.resumoDiario?.buscasSemResultado || 0) + Number(d.resumoDiario?.buscasComResultado || 0)
      , 0);
  });
  const comResultadoValues = selected.map(m => {
    const month = dataMonths[m];
    if (!month || !month.historicoDiario) return 0;
    const dias = Object.values(month.historicoDiario);
    return dias.reduce((a, d) => a + Number(d.resumoDiario?.buscasComResultado || 0), 0);
  });
  renderLineEvolucaoBuscas(monthNames, totalValues, comResultadoValues);
  const tableEvolEl = document.getElementById('table-chartEvolucaoBuscas');
  if (tableEvolEl) {
    const rows = selected.map((monthKey, idx) => {
      const total = totalValues[idx];
      const comRes = comResultadoValues[idx];
      const semRes = total - comRes;
      return [monthNames[idx], total.toLocaleString(), comRes.toLocaleString(), semRes.toLocaleString()];
    });
    tableEvolEl.innerHTML = generateTableHTML(['Mês', 'Total', 'Com Resultado', 'Sem Resultado'], rows);
  }

  initializeModals();
}

function updateDetailedTable(dataMonths) {
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');

  // Monta header dinâmico
  let headerHTML = '<tr><th rowspan="2">Termo de Busca</th>';
  headerHTML += `<th colspan="${selectedMonths.length}">Buscas</th>`;
  headerHTML += `<th colspan="${selectedMonths.length}">Vendas</th>`;
  headerHTML += `<th colspan="${selectedMonths.length}">Conversão (%)</th>`;
  headerHTML += '<th rowspan="2">Tendência</th></tr>';
  headerHTML += '<tr>';
  selectedMonths.forEach(month => headerHTML += `<th>${dataMonths[month].name}</th>`);
  selectedMonths.forEach(month => headerHTML += `<th>${dataMonths[month].name}</th>`);
  selectedMonths.forEach(month => headerHTML += `<th>${dataMonths[month].name}</th>`);
  headerHTML += '</tr>';
  tableHead.innerHTML = headerHTML;

  // Utilitário: acumula os termos dos dias do(s) mês(es)
  function collectTermsByMonth(monthObj) {
    const termsMap = {};
    if (!monthObj || !monthObj.historicoDiario) return [];
    Object.values(monthObj.historicoDiario).forEach(dayObj => {
      (dayObj.termosComResultado || []).forEach(term => {
        if (!term.termo) return;
        if (!termsMap[term.termo]) {
          termsMap[term.termo] = { ...term };
        } else {
          // Soma buscas, vendas, pedidos, recalcula conversão
          termsMap[term.termo].buscas += term.buscas;
          termsMap[term.termo].vendas += term.vendas || 0;
          termsMap[term.termo].pedidos += term.pedidos || 0;
        }
      });
    });
    // Recalcula conversão no final (se quiser usar pedidos, pode ajustar)
    Object.values(termsMap).forEach(t => {
      t.conversao = t.buscas > 0 ? +(t.pedidos / t.buscas * 100).toFixed(2) : 0;
    });
    return Object.values(termsMap);
  }

  // Junta os top termos dos meses selecionados
  const allTerms = new Set();
  const monthTerms = {}; // termo por mês: { [monthKey]: { termo: obj } }
  selectedMonths.forEach(monthKey => {
    const terms = collectTermsByMonth(dataMonths[monthKey]);
    monthTerms[monthKey] = {};
    terms.forEach(item => {
      allTerms.add(item.termo);
      monthTerms[monthKey][item.termo] = item;
    });
  });

  // Limita a lista aos tableItemLimit termos mais buscados (soma dos meses)
  const termBuscas = {};
  allTerms.forEach(termo => {
    termBuscas[termo] = selectedMonths.reduce((a, m) => a + (monthTerms[m][termo]?.buscas || 0), 0);
  });
  const uniqueTerms = Object.entries(termBuscas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, tableItemLimit)
    .map(x => x[0]);

  // Monta corpo da tabela
  tableBody.innerHTML = '';
  uniqueTerms.forEach(termo => {
    let rowHTML = `<td><strong>${termo}</strong></td>`;
    const buscasValues = [], vendasValues = [], conversaoValues = [];

    selectedMonths.forEach(month => {
      const found = monthTerms[month][termo];
      rowHTML += found ? `<td>${found.buscas.toLocaleString()}</td>` : '<td>-</td>';
      buscasValues.push(found ? found.buscas : 0);
    });
    selectedMonths.forEach(month => {
      const found = monthTerms[month][termo];
      rowHTML += found ? `<td>${found.vendas?.toLocaleString?.() || 0}</td>` : '<td>-</td>';
      vendasValues.push(found ? found.vendas || 0 : 0);
    });
    selectedMonths.forEach(month => {
      const found = monthTerms[month][termo];
      rowHTML += found ? `<td>${found.conversao.toFixed(2)}%</td>` : '<td>-</td>';
      conversaoValues.push(found ? found.conversao : 0);
    });

    let trendIcon = '→', trendClass = 'neutral';
    if (buscasValues.length > 1) {
      const first = buscasValues[0], last = buscasValues[buscasValues.length - 1];
      if (last > first * 1.1) { trendIcon = '↗'; trendClass = 'positive'; }
      else if (last < first * 0.9) { trendIcon = '↘'; trendClass = 'negative'; }
    }

    rowHTML += `<td><span class="kpi-change ${trendClass}">${trendIcon}</span></td>`;

    const row = document.createElement('tr');
    row.innerHTML = rowHTML;
    tableBody.appendChild(row);
  });
}


function updateInsights(dataMonths) {
  const container = document.getElementById('insightsContainer');
  container.innerHTML = '';

  function aggregateKPI(month) {
    if (!month || !month.historicoDiario) return { conversao: 0, totalBuscas: 0, ticketMedio: 0 };
    const dias = Object.values(month.historicoDiario);
    if (!dias.length) return { conversao: 0, totalBuscas: 0, ticketMedio: 0 };
    let totalBuscas = 0, conversaoSoma = 0, ticketSoma = 0;
    dias.forEach(d => {
      const r = d.resumoDiario || {};
      totalBuscas += Number(r.buscasSemResultado || 0) + Number(r.buscasComResultado || 0);
      conversaoSoma += Number(r.conversao || 0);
      ticketSoma += Number(r.ticketMedio || 0);
    });
    return {
      conversao: +(conversaoSoma / dias.length).toFixed(2),
      totalBuscas,
      ticketMedio: +(ticketSoma / dias.length).toFixed(2)
    };
  }

  let insights = [];
  if (selectedMonths.length < 2) {
    insights.push({ tipo: '', icon: '📊', title: 'Selecione mais meses', description: 'Compare pelo menos 2 meses para gerar insights.' });
  } else {
    const first = aggregateKPI(dataMonths[selectedMonths[0]]);
    const last = aggregateKPI(dataMonths[selectedMonths[selectedMonths.length - 1]]);

    const variacao = first.conversao === 0 ? 0 : ((last.conversao - first.conversao) / first.conversao) * 100;
    if (Math.abs(variacao) > 5) {
      insights.push({
        tipo: variacao > 0 ? 'positive' : 'negative',
        icon: variacao > 0 ? '📈' : '⚠️',
        title: 'Variação de Conversão',
        description: `Mudança de ${(variacao > 0 ? '+' : '') + variacao.toFixed(1)}% na conversão de ${selectedMonths[0]} para ${selectedMonths[selectedMonths.length - 1]}.`
      });
    }

    const variacaoBuscas = first.totalBuscas === 0 ? 0 : ((last.totalBuscas - first.totalBuscas) / first.totalBuscas) * 100;
    if (variacaoBuscas > 10) {
      insights.push({
        tipo: 'positive',
        icon: '🚀',
        title: 'Crescimento de Buscas',
        description: `O volume de buscas cresceu ${variacaoBuscas.toFixed(1)}% no período.`
      });
    } else if (variacaoBuscas < -10) {
      insights.push({
        tipo: 'negative',
        icon: '📉',
        title: 'Queda nas Buscas',
        description: `O volume de buscas diminuiu ${Math.abs(variacaoBuscas).toFixed(1)}% no período.`
      });
    }

    const variacaoTicket = first.ticketMedio === 0 ? 0 : ((last.ticketMedio - first.ticketMedio) / first.ticketMedio) * 100;
    if (variacaoTicket > 5) {
      insights.push({
        tipo: 'positive',
        icon: '💰',
        title: 'Aumento do Ticket Médio',
        description: `O ticket médio aumentou ${variacaoTicket.toFixed(1)}%.`
      });
    }
    insights.push({
      tipo: '',
      icon: '💡',
      title: 'Oportunidade Identificada',
      description: 'Termos com alta conversão constante merecem destaque em campanhas e vitrines.'
    });
  }

  insights.forEach(insight => {
    const card = document.createElement('div');
    card.className = `insight-card ${insight.tipo || ''}`;
    card.innerHTML = `<div class="insight-icon">${insight.icon}</div>
                      <div class="insight-title">${insight.title}</div>
                      <div class="insight-description">${insight.description}</div>`;
    container.appendChild(card);
  });
}

function initializeModals() {
  document.querySelectorAll('.info-trigger').forEach(trigger => {
    const modalId = trigger.dataset.modal;
    const modal = document.getElementById(modalId);
    let hideTimeout;

    trigger.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      document.querySelectorAll('.info-modal').forEach(m => m.style.display = 'none');
      if (modal) modal.style.display = 'block';
    });

    trigger.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        if (modal) modal.style.display = 'none';
      }, 220);
    });

    if (modal) {
      modal.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        modal.style.display = 'block';
      });
      modal.addEventListener('mouseleave', () => {
        modal.style.display = 'none';
      });
    }

    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.info-modal').forEach(m => m.style.display = 'none');
      if (modal) modal.style.display = 'block';

      const hide = () => {
        if (modal) modal.style.display = 'none';
        document.removeEventListener('click', hide);
      };
      setTimeout(() => {
        document.addEventListener('click', hide);
      }, 10);
    });
  });
}

function addSelectedMonth(monthKey, monthName, monthYear, uniqueId) {
  const block = document.createElement('div');

  block.className = 'selected-month-block';
  block.dataset.monthKey = monthKey;

  block.innerHTML = `
  <div class="selected-month-block-space">
    <div class="selected-month-block-header">
      <h3>${monthName} ${monthYear} </h3> 
      <button class="selected-month-toggle" aria-label="Expandir">
        <svg viewBox="0 0 20 20"><polyline points="6 8 10 12 14 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="month-range" id="monthRange">
      <label for="rangeStart-${monthName}">De</label>
      <input type="date" id="rangeStart-${monthName}" name="rangeStart-${monthName}" />
      <label for="rangeEnd-${monthName}">Até</label>
      <input type="date" id="rangeEnd-${monthName}" name="rangeEnd-${monthName}" />
    </div>
  </div>

  <div class="selected-month-block-content">

    <!-- 1. Proporção Geral de Buscas com e sem Resultado -->
    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Proporção Geral de Buscas com e sem Resultado
          <span class="info-trigger" data-modal="modal-info-proporcao-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Pizza e tabela com o percentual e volume de buscas que retornaram produtos versus as que não retornaram durante <b>${monthName} de ${monthYear}</b>.
        </div>
      </div>
      
      <div class="pie-chart-table-row">
        <div class="pie-chart-half">
          <canvas id="pieProporcaoBuscas-${uniqueId}"></canvas>
        </div>
        <div class="pie-chart-half chart-table" id="table-pieProporcaoBuscas-${uniqueId}"></div>
      </div>
      
    </div>

    <!-- 2. Evolução Diária de Buscas com Resultado -->
    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Evolução Diária de Buscas com Resultado
          <span class="info-trigger" data-modal="info-evol-diaria-com-resultado-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Gráfico de linha mostrando o volume diário de buscas com retorno de produtos em <b>${monthName} de ${monthYear}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoBuscasComResultado-${uniqueId}"></canvas>
    </div>

    <!-- 3. Evolução Diária de Buscas sem Resultado -->
    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Evolução Diária de Buscas sem Resultado
          <span class="info-trigger" data-modal="info-evol-diaria-sem-resultado-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Volume diário de buscas que não retornaram produtos em <b>${monthName} de ${monthYear}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoBuscasSemResultado-${uniqueId}"></canvas>
    </div>

    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Evolução Diária do STR (Cliques)
          <span class="info-trigger" data-modal="info-evol-diaria-str-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Cliques gerados pelas buscas, dia a dia em <b>${monthName} de ${monthYear}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoSTR-${uniqueId}"></canvas>
    </div>

    <!-- 4. Evolução Diária do CTR (%) -->
    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Evolução Diária do CTR (%)
          <span class="info-trigger" data-modal="info-evol-diaria-ctr-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Clique por busca (%) ao longo de cada dia em <b>${monthName} de ${monthYear}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoCTR-${uniqueId}"></canvas>
    </div>

    <!-- Indicadores Avançados (expansível) -->
    <div class="section advanced-section">
      <div class="advanced-header">
        <h3 class="section-title" style="text-align:center;">Indicadores Avançados</h3>
        <button class="advanced-toggle" aria-label="Expandir">
          <svg viewBox="0 0 20 20" width="22" height="22">
          <polyline points="6 8 10 12 14 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      
      <div class="advanced-charts-content" style="display:none;">
        <div class="advanced-charts-grid">
          <!-- 5. Top 10 Buscas com Resultado (barra) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Top 10 Buscas com Resultado
                <span class="info-trigger" data-modal="info-top10-com-resultado-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Gráfico de barras com os 10 termos mais buscados que retornaram resultados no site durante <b>${monthName} de ${monthYear}</b>.
              </div>
            </div>
            <canvas id="barTop10BuscasComResultado-${uniqueId}"></canvas>
            <div id="table-barTop10BuscasComResultado-${uniqueId}" class="chart-table"></div>
          </div>

          <!-- 6. Top 10 Buscas sem Resultado (barra) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Top 10 Buscas sem Resultado
                <span class="info-trigger" data-modal="info-top10-sem-resultado-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Visualização dos termos mais buscados que não retornaram nenhum produto no período analisado.
              </div>
            </div>
            <canvas id="barTop10BuscasSemResultado-${uniqueId}"></canvas>
            <div id="table-barTop10BuscasSemResultado-${uniqueId}" class="chart-table"></div>
          </div>

          <!-- 7. Buscas com Resultado, mas Sem Vendas (barra) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Buscas com Resultado, mas Sem Vendas
                <span class="info-trigger" data-modal="info-com-sem-venda-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Termos de busca que exibiram produtos, mas não geraram vendas em <b>${monthName} de ${monthYear}</b>.
              </div>
            </div>
            <canvas id="barBuscasComResultadoSemVendas-${uniqueId}"></canvas>
            <div id="table-barBuscasComResultadoSemVendas-${uniqueId}" class="chart-table"></div>
          </div>

          <!-- 8. Distribuição das Top 10 Buscas com Resultado (pizza) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Distribuição das Top 10 Buscas com Resultado
                <span class="info-trigger" data-modal="info-pie-top10-com-resultado-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Pizza com a proporção das 10 principais buscas com resultado durante <b>${monthName} de ${monthYear}</b>.
              </div>
            </div>
            <div class="pizza-table-row">
              <div class="pizza-half">
                <canvas id="pieDistribuicaoTop10BuscasComResultado-${uniqueId}"></canvas>
              </div>
              <div class="pizza-half chart-table" id="table-pieDistribuicaoTop10BuscasComResultado-${uniqueId}"></div>
            </div>
          </div>

          <!-- 9. Distribuição das Top 10 Buscas sem Vendas (pizza) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Distribuição das Top 10 Buscas sem Vendas
                <span class="info-trigger" data-modal="info-pie-top10-sem-venda-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Pizza com a proporção das 10 principais buscas sem venda durante <b>${monthName} de ${monthYear}</b>.
              </div>
            </div>
            <div class="pizza-table-row">
              <div class="pizza-half">
                <canvas id="pieDistribuicaoTop10BuscasSemVendas-${uniqueId}"></canvas>
              </div>
              <div class="pizza-half chart-table" id="table-pieDistribuicaoTop10BuscasSemVendas-${uniqueId}"></div>
            </div>
          </div>

          <!-- 10. Distribuição das Top 10 Buscas sem Resultado (pizza) -->
          <div class="advanced-chart-container">
            <div class="advanced-chart-header">
              <div class="advanced-chart-title">
                Distribuição das Top 10 Buscas sem Resultado
                <span class="info-trigger" data-modal="info-pie-top10-sem-resultado-${uniqueId}">i</span>
              </div>
              <div class="advanced-chart-desc">
                Pizza com a proporção das 10 principais buscas sem resultado durante <b>${monthName} de ${monthYear}</b>.
              </div>
            </div>
            <div class="pizza-table-row">
              <div class="pizza-half">
                <canvas id="pieDistribuicaoTop10BuscasSemResultado-${uniqueId}"></canvas>
              </div>
              <div class="pizza-half chart-table" id="table-pieDistribuicaoTop10BuscasSemResultado-${uniqueId}"></div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <div class="info-modal" id="modal-info-proporcao-${uniqueId}">
      <div class="info-content">
        <strong>Proporção Geral de Buscas com e sem Resultado</strong>
        <p>
          Exibe a proporção de buscas realizadas no período que retornaram produtos (<b>com resultado</b>) versus as que não retornaram nenhum produto (<b>sem resultado</b>).
        </p>
        <div class="info-formula">
          <b>Fórmula:</b> Proporção (%) = (Tipo de Busca / Total de Buscas do Mês) × 100
        </div>
        <div class="dica">
          <b>Orientação:</b> Se houver muitos termos sem resultado, isso indica oportunidades de ajustes no catálogo ou nos sinônimos da busca.<br>
          Ideal para identificar problemas de cobertura do portfólio e lacunas no sortimento.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-evol-diaria-com-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Evolução Diária de Buscas com Resultado</strong>
        <p>
          Mostra o volume de buscas que retornaram produtos, dia a dia durante o mês.
        </p>
        <div class="info-formula">
          <b>Leitura:</b> Tendências crescentes sugerem maior aderência dos clientes aos produtos disponíveis.
        </div>
        <div class="dica">
          <b>Orientação:</b> Analise picos ou quedas para identificar impacto de campanhas, sazonalidades ou problemas técnicos na busca.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-evol-diaria-sem-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Evolução Diária de Buscas sem Resultado</strong>
        <p>
          Exibe diariamente o volume de buscas sem retorno de produtos.
        </p>
        <div class="info-formula">
          <b>Dica:</b> Relacione picos com campanhas, lançamentos ou falta de estoque.
        </div>
        <div class="dica">
          <b>Orientação:</b> Observe períodos com alta incidência de buscas sem resultado. Esses picos indicam possíveis demandas não atendidas.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-evol-diaria-str-${uniqueId}">
      <div class="info-content">
        <strong>Evolução Diária do STR (Cliques)</strong>
        <p>Exibe o total de cliques gerados pelas buscas em cada dia do mês.</p>
        <div class="info-formula"><b>Leitura:</b> Picos de STR indicam maior interesse/engajamento com os resultados exibidos.</div>
      </div>
    </div>

    <div class="info-modal" id="info-evol-diaria-ctr-${uniqueId}">
      <div class="info-content">
        <strong>Evolução Diária do CTR (%)</strong>
        <p>Mostra o percentual de buscas que geraram ao menos um clique em produtos ao longo de cada dia do mês.</p>
        <div class="info-formula">
          <b>Fórmula:</b> CTR (%) = (Cliques / Buscas) × 100
        </div>
        <div class="dica">
          <b>Orientação:</b> Monitorar quedas bruscas no CTR pode indicar problemas de relevância dos resultados ou experiências ruins de navegação.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-top10-com-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Top 10 Buscas com Resultado</strong>
        <p>Lista os 10 termos mais pesquisados que apresentaram resultados no mês.</p>
        <div class="info-formula">
          <b>Dica:</b> Analise se os termos do top 10 estão convertendo bem em vendas.
        </div>
        <div class="dica">
          <b>Orientação:</b> Esses termos são fortes candidatos para campanhas, banners ou expansão de estoque.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-top10-sem-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Top 10 Buscas sem Resultado</strong>
        <p>
          Mostra os termos mais buscados que não retornaram nenhum produto.
        </p>
        <div class="info-formula">
          <b>Dica:</b> Monitore esses termos para reduzir atrito e perda de vendas.
        </div>
        <div class="dica">
          <b>Orientação:</b> Oportunidade clara para revisar cadastro de produtos, criar redirecionamentos ou sugerir alternativas.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-com-sem-venda-${uniqueId}">
      <div class="info-content">
        <strong>Buscas com Resultado, mas Sem Vendas</strong>
        <p>
          Lista termos que exibiram produtos aos clientes, mas não geraram vendas.
        </p>
        <div class="info-formula">
          <b>Leitura:</b> Pode indicar falta de competitividade, imagens ruins ou problemas de usabilidade.
        </div>
        <div class="dica">
          <b>Orientação:</b> Revise preço, disponibilidade e destaque desses produtos. Indica gargalos na jornada de compra.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-pie-top10-com-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Distribuição das Top 10 Buscas com Resultado</strong>
        <p>
          Visualiza a participação de cada termo mais buscado entre o total dos que retornaram resultado.
        </p>
        <div class="dica">
          <b>Orientação:</b> Identifique termos dominantes ou concentração excessiva de buscas em poucos produtos.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-pie-top10-sem-venda-${uniqueId}">
      <div class="info-content">
        <strong>Distribuição das Top 10 Buscas sem Vendas</strong>
        <p>
          Exibe a representatividade dos termos mais buscados que não geraram vendas.
        </p>
        <div class="dica">
          <b>Orientação:</b> Ajuda a identificar padrões de interesse não convertidos.
        </div>
      </div>
    </div>

    <div class="info-modal" id="info-pie-top10-sem-resultado-${uniqueId}">
      <div class="info-content">
        <strong>Distribuição das Top 10 Buscas sem Resultado</strong>
        <p>
          Apresenta os termos com maior peso entre as buscas sem resultado.
        </p>
        <div class="dica">
          <b>Orientação:</b> Indica oportunidades de melhoria no sortimento e na gestão de sinônimos.
        </div>
      </div>
    </div>

  </div>
  `;

  return block;
}

function addSelectedMonthBlock(monthKey) {
  const dataMonths = getMonthData();
  const platformSelectDiv = document?.getElementById('platformCustomSelect');
  const device = platformSelectDiv?.querySelector('.custom-select-value')?.textContent?.trim()?.toLowerCase();
  const uniqueId = `${monthKey}-${device}`;
  let firstInclusion = false;
  let month = dataMonths[monthKey];
  let block;

  const start = document.getElementById(`rangeStart-${month.name}`)?.value;
  const end = document.getElementById(`rangeEnd-${month.name}`)?.value;

  if (start || end) {
    let monthRestructured = {
      name: month.name,
      year: month.year,
      available: true,
      buscasComResultado: 0,
      buscasSemResultado: 0,
      pedidos: 0,
      totalBuscas: 0,
      vendas: 0,
      historicoDiario: {}
    }

    let ctrSoma = 0
    let ticketMedioSoma = 0
    let conversaoSoma = 0

    Object.keys(month.historicoDiario).forEach(data => {
      if (data >= start && data <= end) {
        monthRestructured.historicoDiario[data] = month.historicoDiario[data]
        monthRestructured.buscasComResultado += month.historicoDiario[data].resumoDiario.buscasComResultado
        monthRestructured.buscasSemResultado += month.historicoDiario[data].resumoDiario.buscasSemResultado
        monthRestructured.pedidos += month.historicoDiario[data].resumoDiario.pedidos
        monthRestructured.vendas += month.historicoDiario[data].resumoDiario.vendas
        monthRestructured.totalBuscas += month.historicoDiario[data].resumoDiario.buscasComResultado + month.historicoDiario[data].resumoDiario.buscasSemResultado

        ctrSoma += month.historicoDiario[data].resumoDiario.ctr
        ticketMedioSoma += month.historicoDiario[data].resumoDiario.ticketMedio
        conversaoSoma += month.historicoDiario[data].resumoDiario.conversao
      }
    })

    const diasCount = Object.keys(monthRestructured.historicoDiario).length

    monthRestructured.conversao = diasCount ? +(conversaoSoma / diasCount).toFixed(2) : 0;
    monthRestructured.ctr = diasCount ? +(ctrSoma / diasCount).toFixed(2) : 0;
    monthRestructured.ticketMedio = diasCount ? +(ticketMedioSoma / diasCount).toFixed(2) : 0;

    month = monthRestructured
  }

  // Caso ja renderizado deve alterar somente os valores
  if (monthsBlocksRendered.includes(monthKey)) {
    block = monthBlocks.get(monthKey);
  } else {
    block = addSelectedMonth(monthKey, month.name, month.year, uniqueId)

    firstInclusion = true
    monthsBlocksRendered.push(monthKey);
  }

  const container = document.getElementById('selected-months-blocks');

  const toggleBtn = block.querySelector('.selected-month-toggle');
  // Alterna a expansão do bloco e renderiza os gráficos diários quando expandido

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = block.classList.toggle('expanded');
    if (expanded) {
      // Renderiza os gráficos e tabelas apenas ao expandir o bloco
      renderPieProporcaoBuscas(uniqueId, month);
      renderLineEvolucaoBuscasComResultado(uniqueId, month);
      renderLineEvolucaoBuscasSemResultado(uniqueId, month);
      renderLineEvolucaoSTR(uniqueId, month);
      renderLineEvolucaoCTR(uniqueId, month);

      const total = Object.values(month.historicoDiario || {}).reduce(
        (acc, d) => {
          acc.com += Number(d.resumoDiario?.buscasComResultado || 0);
          acc.sem += Number(d.resumoDiario?.buscasSemResultado || 0);
          return acc;
        }, { com: 0, sem: 0 }
      );
      const geralRows = [
        ['Com Resultado', total.com.toLocaleString(), (total.com + total.sem) ? ((total.com / (total.com + total.sem)) * 100).toFixed(1) + '%' : '0%'],
        ['Sem Resultado', total.sem.toLocaleString(), (total.com + total.sem) ? ((total.sem / (total.com + total.sem)) * 100).toFixed(1) + '%' : '0%']
      ];
      const tableEl = document.getElementById(`table-pieProporcaoBuscas-${uniqueId}`);
      if (tableEl) {
        tableEl.innerHTML = generateTableHTML(['Tipo', 'Buscas', 'Proporção'], geralRows);
      }
    }
  });

  // Também permite expandir/recolher clicando na header do bloco (exceto botão)
  block.querySelector('.selected-month-block-header').addEventListener('click', (e) => {
    if (e.target !== toggleBtn) {
      const expanded = block.classList.toggle('expanded');
      if (expanded) {
        renderPieProporcaoBuscas(uniqueId, month);
        renderLineEvolucaoBuscasComResultado(uniqueId, month);
        renderLineEvolucaoBuscasSemResultado(uniqueId, month);
        renderLineEvolucaoSTR(uniqueId, month);
        renderLineEvolucaoCTR(uniqueId, month);

        const total = Object.values(month.historicoDiario || {}).reduce(
          (acc, d) => {
            acc.com += Number(d.resumoDiario?.buscasComResultado || 0);
            acc.sem += Number(d.resumoDiario?.buscasSemResultado || 0);
            return acc;
          }, { com: 0, sem: 0 }
        );
        const geralRows = [
          ['Com Resultado', total.com.toLocaleString(), (total.com + total.sem) ? ((total.com / (total.com + total.sem)) * 100).toFixed(1) + '%' : '0%'],
          ['Sem Resultado', total.sem.toLocaleString(), (total.com + total.sem) ? ((total.sem / (total.com + total.sem)) * 100).toFixed(1) + '%' : '0%']
        ];
        const tableEl = document.getElementById(`table-pieProporcaoBuscas-${uniqueId}`);
        if (tableEl) {
          tableEl.innerHTML = generateTableHTML(['Tipo', 'Buscas', 'Proporção'], geralRows);
        }
      }
    }
  });

  if (firstInclusion) {
    container.appendChild(block);
  }

  monthBlocks.set(monthKey, block);

  const advancedToggleBtn = block.querySelector('.advanced-toggle');
  const advancedChartsContent = block.querySelector('.advanced-charts-content');
  let advancedChartsRendered = false;

  if (firstInclusion) {
    listenMonthRange(month, monthKey)
  }

  // Alterna a área de indicadores avançados. Ao abrir pela primeira vez,
  // os gráficos são renderizados utilizando os dados do mês.
  advancedToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const visible = advancedChartsContent.style.display === 'block';
    if (visible) {
      advancedChartsContent.style.display = 'none';
      advancedToggleBtn.classList.remove('expanded');
    } else {
      advancedChartsContent.style.display = 'block';
      advancedToggleBtn.classList.add('expanded');
      if (!advancedChartsRendered) {
        renderBarTop10BuscasComResultado(uniqueId, month);
        renderBarTop10BuscasSemResultado(uniqueId, month);
        renderBarBuscasComResultadoSemVendas(uniqueId, month);
        renderPieDistribuicaoTop10BuscasComResultado(uniqueId, month);
        renderPieDistribuicaoTop10BuscasSemVendas(uniqueId, month);
        renderPieDistribuicaoTop10BuscasSemResultado(uniqueId, month);

        _filterTopTerms = (filter, pct, numItens = 10) => {
          const terms = []
          const agregados = {}

          for (const day in month.historicoDiario) {
            const dayTerm = month.historicoDiario[day][filter] || [];
            terms.push(...dayTerm);
          }

          terms.forEach(({ termo, buscas }) => {
            agregados[termo] = (agregados[termo] || 0) + buscas;
          });

          const rows = Object.entries(agregados)
            .sort((a, b) => b[1] - a[1])
            .slice(0, numItens)

          if (pct) {
            const sumCom = rows.reduce((acc, [, i]) => acc + i, 0);
            return rows.map(([termo, buscas]) => [termo, buscas, sumCom ? ((buscas / sumCom) * 100).toFixed(1) + '%' : '0%'])
          } else {
            return rows
          }
        }

        _filterTopTermsNoSales = (pct, numItens = 10) => {
          const agregados = {};

          for (const dia in month.historicoDiario) {
            const termosDia = month.historicoDiario[dia].termosComResultado || [];

            termosDia.forEach(({ termo, buscas, vendas }) => {
              if (!agregados[termo])
                agregados[termo] = { buscas: 0, teveVenda: false };

              if (vendas > 0)
                agregados[termo].teveVenda = true;


              agregados[termo].buscas += buscas;
            });
          }

          const rows = Object.entries(agregados)
            .filter(([, data]) => !data.teveVenda)
            .sort((a, b) => b[1].buscas - a[1].buscas)
            .slice(0, numItens)
            .map(([termo, data]) => ([termo, data.buscas]));

          if (pct) {
            const sumCom = rows.reduce((acc, [, i]) => acc + i, 0);
            return rows.map(([termo, buscas]) => [termo, buscas, sumCom ? ((buscas / sumCom) * 100).toFixed(1) + '%' : '0%'])
          } else {
            return rows
          }
        }

        // 5. Top 10 Buscas com Resultado
        const tableCom = document.getElementById(`table-barTop10BuscasComResultado-${uniqueId}`);
        if (tableCom)
          tableCom.innerHTML = generateTableHTML(['Termo', 'Buscas'], _filterTopTerms('termosComResultado'));

        // 6. Top 10 Buscas sem Resultado
        const tableSem = document.getElementById(`table-barTop10BuscasSemResultado-${uniqueId}`);
        if (tableSem)
          tableSem.innerHTML = generateTableHTML(['Termo', 'Buscas'], _filterTopTerms('termosSemResultado'));

        // 7. Buscas com Resultado, mas Sem Vendas
        const tableSemVenda = document.getElementById(`table-barBuscasComResultadoSemVendas-${uniqueId}`);
        if (tableSemVenda)
          tableSemVenda.innerHTML = generateTableHTML(['Termo', 'Buscas'], _filterTopTermsNoSales());

        // 8. Distribuição das Top 10 Buscas com Resultado
        const tablePieCom = document.getElementById(`table-pieDistribuicaoTop10BuscasComResultado-${uniqueId}`);
        if (tablePieCom)
          tablePieCom.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], _filterTopTerms('termosComResultado', true));

        // 9. Distribuição das Top 10 Buscas sem Vendas
        const tablePieSemVenda = document.getElementById(`table-pieDistribuicaoTop10BuscasSemVendas-${uniqueId}`);
        if (tablePieSemVenda)
          tablePieSemVenda.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], _filterTopTermsNoSales(true));

        // 10. Distribuição das Top 10 Buscas sem Resultado
        const tablePieSemResultado = document.getElementById(`table-pieDistribuicaoTop10BuscasSemResultado-${uniqueId}`);
        if (tablePieSemResultado)
          tablePieSemResultado.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], _filterTopTerms('termosSemResultado', true));

        advancedChartsRendered = true;
      }
    }
  });
}

function renderMonthBlockCharts(monthKey, uniqueId) {
  const dataMonths = getMonthData()

  const month = dataMonths[monthKey];

  if (!month) return;

  const proporcaoLabels = ['Com Resultado', 'Sem Resultado'];
  const proporcaoData = [
    month.buscasComResultado,
    month.buscasSemResultado
  ];

  // Proporção geral de buscas (resultado vs sem resultado)
  new Chart(document.getElementById(`pieProporcaoBuscas-${uniqueId}`), {
    type: 'pie',
    data: {
      labels: proporcaoLabels,
      datasets: [{
        data: proporcaoData,
        backgroundColor: ["#46f39c", "#ff7d78"],
        borderWidth: 2,
        borderColor: "#eaf7fb"
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: "#eaf7fb", font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb"
        }
      }
    }
  });

  const top10Com = (month.top50MaisPesquisados || []).slice(0, 10);

  new Chart(document.getElementById(`pieDistribuicaoTop10BuscasComResultado-${uniqueId}`), {
    type: 'pie',
    data: {
      labels: top10Com.map(i => i.termo),
      datasets: [{
        data: top10Com.map(i => i.buscas),
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: "#eaf7fb"
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: "#eaf7fb", font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb"
        }
      }
    }
  });

  const tableComEl = document.getElementById(`table-top10-com-resultado-${uniqueId}`);
  if (tableComEl) tableComEl.innerHTML = `
  <table class="proporcao-mini-table">
    <thead>
      <tr>
        <th>Termo</th>
        <th>Buscas</th>
        <th>Vendas</th>
      </tr>
    </thead>
    <tbody>
      ${top10Com.map((i, idx) => `
        <tr>
          <td>
            <span class="proporcao-icon" style="background:${CHART_COLORS[idx % CHART_COLORS.length]};"></span>
            ${i.termo}
          </td>
          <td>${i.buscas.toLocaleString()}</td>
          <td>${i.vendas.toLocaleString()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  `;

  const top10SemVenda = (month.top50SemVenda || []).slice(0, 10);

  new Chart(document.getElementById(`pieDistribuicaoTop10BuscasSemVendas-${uniqueId}`), {
    type: 'pie',
    data: {
      labels: top10SemVenda.map(i => i.termo),
      datasets: [{
        data: top10SemVenda.map(i => i.buscas),
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: "#eaf7fb"
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: "#eaf7fb", font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb"
        }
      }
    }
  });

  const tableSemVendaEl = document.getElementById(`table-top10-sem-venda-${uniqueId}`);
  if (tableSemVendaEl) tableSemVendaEl.innerHTML = `
  <table class="proporcao-mini-table">
    <thead>
      <tr>
        <th>Termo</th>
        <th>Buscas</th>
      </tr>
    </thead>
    <tbody>
      ${top10SemVenda.map((i, idx) => `
        <tr>
          <td>
            <span class="proporcao-icon" style="background:${CHART_COLORS[idx % CHART_COLORS.length]};"></span>
            ${i.termo}
          </td>
          <td>${i.buscas.toLocaleString()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  `;

  const top10SemResultado = (month.top50SemResultado || []).slice(0, 10);

  new Chart(document.getElementById(`pieDistribuicaoTop10BuscasSemResultado-${uniqueId}`), {
    type: 'pie',
    data: {
      labels: top10SemResultado.map(i => i.termo),
      datasets: [{
        data: top10SemResultado.map(i => i.buscas),
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: "#eaf7fb"
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: "#eaf7fb", font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb"
        }
      }
    }
  });

  const tableSemResultadoEl = document.getElementById(`table-top10-sem-resultado-${uniqueId}`);
  if (tableSemResultadoEl) tableSemResultadoEl.innerHTML = `
  <table class="proporcao-mini-table">
    <thead>
      <tr>
        <th>Termo</th>
        <th>Buscas</th>
      </tr>
    </thead>
    <tbody>
      ${top10SemResultado.map((i, idx) => `
        <tr>
          <td>
            <span class="proporcao-icon" style="background:${CHART_COLORS[idx % CHART_COLORS.length]};"></span>
            ${i.termo}
          </td>
          <td>${i.buscas.toLocaleString()}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  `;
}

document.querySelectorAll('.custom-select').forEach((select) => {
  const valueSpan = select.querySelector('.custom-select-value')
  const options = select.querySelectorAll('.custom-select-option')

  select.addEventListener('click', function () {
    select.classList.toggle('open')
  });

  options.forEach(function (option) {
    option.addEventListener('click', function (e) {
      e.stopPropagation()
      options.forEach(o => o.classList.remove('selected'))
      option.classList.add('selected')
      valueSpan.textContent = option.textContent
      select.classList.remove('open')

      if (select.id === 'platformCustomSelect') {
        selectedMonths = []
        document.getElementById('selected-months-blocks').innerHTML = ''
      }

      const dataMonths = getMonthData();

      initializeMonthSelector(dataMonths)
      updateDashboard(dataMonths)
      initializeModals()
    });
  });

  document.addEventListener('click', function (e) {
    if (!select.contains(e.target)) {
      select.classList.remove('open')
    }
  });
});

function initializeExportBlock(dataMonths) {
  const todasDatas = [];

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');

  const primeiroDia = `${ano}-${mes}-01`;

  Object.values(dataMonths).forEach(chave => {
    if (chave.available)
      for (const d in chave.historicoDiario)
        todasDatas.push(d);
  });

  if (!todasDatas.length) return;

  const menorData = todasDatas.reduce((a, b) => a < b ? a : b);
  const maiorData = todasDatas.reduce((a, b) => a > b ? a : b);

  const iniInput = document.getElementById('dataInicioExportReport');
  const fimInput = document.getElementById('dataFimExportReport');

  iniInput.min = menorData;
  iniInput.max = maiorData;
  fimInput.min = menorData;
  fimInput.max = maiorData;

  iniInput.value = primeiroDia;
  fimInput.value = maiorData;
}

document.getElementById('btnExportReport').addEventListener('click', () => {
  const hojeStr = new Date().toISOString().split('T')[0];
  const ini = document.getElementById('dataInicioExportReport').value;
  const fim = document.getElementById('dataFimExportReport').value;
  const qtd = parseInt(document.getElementById('qtdTopExport').value, 10) || 10;
  const platform = document.getElementById('platformExport').value || 'desktop e mobile';

  if (!ini || !fim) {
    alert('Preencha as datas.');
    return;
  }
  if (ini > fim) {
    alert('Data inicial não pode ser maior que a final.');
    return;
  }
  if (fim > hojeStr || ini > hojeStr) {
    alert('Datas não podem ser maiores que o dia de hoje.');
    return;
  }

  const dataMonths = getMonthData(platform);
  const agreg = {};

  Object.values(dataMonths).forEach(monthObj => {
    if (monthObj.available) {
      for (const dia in monthObj.historicoDiario) {
        if (dia >= ini && dia <= fim) {
          (monthObj.historicoDiario[dia].termosComResultado).forEach(({ termo = '', buscas = 0, pedidos = 0, vendas = 0 }) => {
            if (!agreg[termo])
              agreg[termo] = { buscas: 0, pedidos: 0, vendas: 0 };
            agreg[termo].buscas += buscas;
            agreg[termo].pedidos += pedidos;
            agreg[termo].vendas += vendas;
          });
        }
      }
    }
  });

  const rows = Object.entries(agreg)
    .sort((a, b) => b[1].buscas - a[1].buscas)
    .slice(0, qtd)
    .map(([termo, v]) => [termo, v.buscas, v.pedidos, v.vendas]);

  if (!rows.length) {
    alert('Nenhum termo no intervalo.');
    return;
  }

  const aoa = [['Termos', 'Buscas', 'Pedidos', 'Vendas'], ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const last = aoa.length;
  const platformName = platform === 'desktop e mobile' ? 'Desktop_e_Mobile' : platform.charAt(0).toUpperCase() + platform.slice(1);
  const iniName = ini.split('-').reverse().join('-');
  const fimName = fim.split('-').reverse().join('-');

  for (let r = 2; r <= last; r++) {
    ws[`B${r}`].t = 'n'; ws[`B${r}`].z = '#,##0';
    ws[`C${r}`].t = 'n'; ws[`C${r}`].z = '#,##0';
    ws[`D${r}`].t = 'n'; ws[`D${r}`].z = '"R$" #,##0.00';
  }

  ws['!cols'] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  ws['!autofilter'] = { ref: `A1:D${last}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `relatorio-buscas-${platformName}-${iniName}_a_${fimName}.xlsx`);
});

function initMonthRange(year, monthIndex, monthName) {
  const start = document.getElementById(`rangeStart-${monthName}`);
  const end = document.getElementById(`rangeEnd-${monthName}`);

  if (!(start && end)) return;

  const first = new Date(year, monthIndex - 1, 1);
  const last = new Date(year, monthIndex, 0);
  const toISO = d => d.toISOString().slice(0, 10);

  const firstISO = toISO(first);
  const lastISO = toISO(last);

  start.min = firstISO;
  start.max = lastISO;
  start.value = firstISO;

  end.min = firstISO;
  end.max = lastISO;
  end.value = lastISO;
}

function listenMonthRange(month, monthKey) {
  const monthIndex = MONTHS.indexOf(month.name.toLowerCase()) + 1;

  initMonthRange(month.year, monthIndex, month.name);

  const start = document.getElementById(`rangeStart-${month.name}`);
  const end = document.getElementById(`rangeEnd-${month.name}`);

  if (!(start && end)) return;

  function onChange() {
    const startDate = start.value;
    const endDate = end.value;

    if (startDate && endDate && startDate <= endDate) {
      addSelectedMonthBlock(monthKey)

      const block = monthBlocks.get(monthKey);

      if (!block) return;

      block.classList.remove('expanded');
    }
  }

  if (start) {
    start.addEventListener("change", onChange);
    start.addEventListener("input", onChange);
  }

  if (end) {
    end.addEventListener("change", onChange);
    end.addEventListener("input", onChange);
  }
}

document.getElementById('openExportModal').addEventListener('click', () => {
  document.getElementById('exportModal').style.display = 'block';
});

document.getElementById('closeExportModal').addEventListener('click', () => {
  document.getElementById('exportModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target.id === 'exportModal') {
    document.getElementById('exportModal').style.display = 'none';
  }
});