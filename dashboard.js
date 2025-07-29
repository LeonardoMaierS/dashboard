let tableItemLimit = 5;
let selectedMonths = [];
let monthsBlocksRendered = [];

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
  if (!window.monthsData) return;

  initializeMonthSelector();
  initializeModals();
  updateDashboard();
});

function initializeMonthSelector() {
  const timeline = document.getElementById('monthTimeline');
  timeline.innerHTML = '';
  Object.keys(monthsData).forEach(monthKey => {
    const month = monthsData[monthKey];
    const card = document.createElement('div');
    card.className = `month-card${!month.available ? ' disabled' : ''}${selectedMonths.includes(monthKey) ? ' selected' : ''}`;
    card.dataset.month = monthKey;
    card.innerHTML = `<div class="month-name">${month.name}</div><div class="month-year">${month.year}</div>`;
    if (month.available) {
      card.addEventListener('click', function () {
        toggleMonth(monthKey);
      });
    }
    timeline.appendChild(card);
  });
}

function toggleMonth(monthKey) {
  const idx = selectedMonths.indexOf(monthKey);
  if (idx > -1) {
    selectedMonths.splice(idx, 1);
  } else {
    selectedMonths.push(monthKey);

    selectedMonths.sort((a, b) => {
      const ma = monthsData[a];
      const mb = monthsData[b];

      if (ma.year !== mb.year) return ma.year - mb.year;

      const ordemMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      return ordemMeses.indexOf(ma.name) - ordemMeses.indexOf(mb.name);
    });
  }
  initializeMonthSelector();
  updateDashboard();
}

function updateDashboard() {
  const chartsSection = document.getElementById('chartsSection');
  const tableSection = document.getElementById('tableSection');
  const insightsSection = document.getElementById('insightsSection');
  const monthsBlocksContainer = document.getElementById('selected-months-blocks');

  const limitSelect = document.getElementById('itemLimit');
  if (limitSelect) {
    limitSelect.value = tableItemLimit;
    limitSelect.addEventListener('change', function () {
      tableItemLimit = parseInt(this.value);
      updateDetailedTable();
    });
  }

  if (monthsBlocksContainer) {
    monthsBlocksContainer.innerHTML = '';
    monthsBlocksRendered = [];
    selectedMonths.forEach(monthKey => {
      addSelectedMonthBlock(monthKey);
    });
  }

  if (selectedMonths.length === 0) {
    document.getElementById('kpiGrid').innerHTML = '<div style="text-align:center;color:#64748b;font-size:1.2em;margin:36px 0;">Selecione pelo menos um mês acima.</div>';
    if (chartsSection) chartsSection.style.display = 'none';
    if (tableSection) tableSection.style.display = 'none';
    if (insightsSection) insightsSection.style.display = 'none';
    return;
  }
  if (chartsSection) chartsSection.style.display = '';
  if (tableSection) tableSection.style.display = '';
  if (insightsSection) insightsSection.style.display = '';

  updateKPIs();
  updateMainCharts();
  updateDetailedTable();
  updateInsights();
}

function updateKPIs() {
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';
  const kpis = [
    { label: 'Total de Buscas', value: selectedMonths.reduce((a, m) => a + monthsData[m].totalBuscas, 0).toLocaleString() },
    { label: 'Buscas com Resultado', value: selectedMonths.reduce((a, m) => a + monthsData[m].buscasComResultado, 0).toLocaleString() },
    { label: 'Taxa de Conversão', value: (selectedMonths.reduce((a, m) => a + monthsData[m].conversao, 0) / selectedMonths.length).toFixed(2) + '%' },
    { label: 'CTR Médio', value: (selectedMonths.reduce((a, m) => a + monthsData[m].ctr, 0) / selectedMonths.length).toFixed(1) + '%' },
    { label: 'Ticket Médio', value: 'R$ ' + (selectedMonths.reduce((a, m) => a + monthsData[m].ticketMedio, 0) / selectedMonths.length).toFixed(2) },
  ];
  kpis.forEach(kpi => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `<div class="kpi-value">${kpi.value}</div>
                      <div class="kpi-label">${kpi.label}</div>`;
    grid.appendChild(card);
  });
}

function updateMainCharts() {
  // Atualiza a grade de gráficos principais com novos IDs padronizados
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
  // Chama as funções de renderização com as listas combinadas
  const combined = getCombinedTopTerms();
  const labelsTop = combined.map(item => item.termo);
  const valuesTop = combined.map(item => item.buscas);
  renderBarTop10TermosBuscados(labelsTop, valuesTop);
  renderPieProporcaoTop10Buscas(labelsTop, valuesTop);
  const monthNames = selectedMonths.map(m => monthsData[m].name);
  const convValues = selectedMonths.map(m => monthsData[m].conversao);
  renderBarTaxaConversao(monthNames, convValues);
  const totalValues = selectedMonths.map(m => monthsData[m].totalBuscas);
  const comResultadoValues = selectedMonths.map(m => monthsData[m].buscasComResultado);
  renderLineEvolucaoBuscas(monthNames, totalValues, comResultadoValues);

  // Gera tabelas de dados para cada gráfico principal
  // 1. Tabela de Top 10 Termos Buscados (barra)
  const tableBarTopEl = document.getElementById('table-chartTop10TermosBuscados');
  if (tableBarTopEl) {
    const rows = labelsTop.map((label, i) => [label, valuesTop[i].toLocaleString()]);
    tableBarTopEl.innerHTML = generateTableHTML(['Termo', 'Buscas'], rows);
  }

  // 2. Tabela de Proporção Top 10 Buscas (pizza)
  const tablePieTopEl = document.getElementById('table-chartProporcaoTop10Buscas');
  if (tablePieTopEl) {
    const totalSum = valuesTop.reduce((acc, val) => acc + val, 0);
    const rows = labelsTop.map((label, i) => {
      const pct = totalSum ? ((valuesTop[i] / totalSum) * 100).toFixed(1) + '%' : '0%';
      return [label, valuesTop[i].toLocaleString(), pct];
    });
    tablePieTopEl.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], rows);
  }

  // 3. Tabela de Taxa de Conversão (barra)
  const tableConvEl = document.getElementById('table-chartTaxaConversao');
  if (tableConvEl) {
    const rows = selectedMonths.map((monthKey) => {
      const m = monthsData[monthKey];
      return [m.name, m.conversao.toFixed(2) + '%'];
    });
    tableConvEl.innerHTML = generateTableHTML(['Mês', 'Conversão (%)'], rows);
  }

  // 4. Tabela de Evolução das Buscas (linha)
  const tableEvolEl = document.getElementById('table-chartEvolucaoBuscas');
  if (tableEvolEl) {
    const rows = selectedMonths.map((monthKey) => {
      const m = monthsData[monthKey];
      const semRes = m.totalBuscas - m.buscasComResultado;
      return [m.name, m.totalBuscas.toLocaleString(), m.buscasComResultado.toLocaleString(), semRes.toLocaleString()];
    });
    tableEvolEl.innerHTML = generateTableHTML(['Mês', 'Total', 'Com Resultado', 'Sem Resultado'], rows);
  }

  initializeModals();
}

function getCombinedTopTerms() {
  const termoMap = {};
  selectedMonths.forEach(monthKey => {
    const arr = monthsData[monthKey].top50MaisPesquisados || [];
    arr.forEach(item => {
      if (!termoMap[item.termo]) {
        termoMap[item.termo] = { ...item };
      } else {
        termoMap[item.termo].buscas += item.buscas;
      }
    });
  });

  return Object.values(termoMap).sort((a, b) => b.buscas - a.buscas).slice(0, 10);
}

function updateDetailedTable() {
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');

  let headerHTML = '<tr><th rowspan="2">Termo de Busca</th>';
  headerHTML += `<th colspan="${selectedMonths.length}">Buscas</th>`;
  headerHTML += `<th colspan="${selectedMonths.length}">Vendas</th>`;
  headerHTML += `<th colspan="${selectedMonths.length}">Conversão (%)</th>`;
  headerHTML += '<th rowspan="2">Tendência</th></tr>';
  headerHTML += '<tr>';
  selectedMonths.forEach(month => headerHTML += `<th>${monthsData[month].name}</th>`);
  selectedMonths.forEach(month => headerHTML += `<th>${monthsData[month].name}</th>`);
  selectedMonths.forEach(month => headerHTML += `<th>${monthsData[month].name}</th>`);
  headerHTML += '</tr>';
  tableHead.innerHTML = headerHTML;

  const allTerms = new Set();
  selectedMonths.forEach(month => {
    (monthsData[month].top50MaisPesquisados || []).forEach(item => allTerms.add(item.termo));
  });

  const uniqueTerms = Array.from(allTerms).slice(0, tableItemLimit);

  tableBody.innerHTML = '';
  uniqueTerms.forEach(termo => {
    let rowHTML = `<td><strong>${termo}</strong></td>`;
    const buscasValues = [], vendasValues = [], conversaoValues = [];

    selectedMonths.forEach(month => {
      const found = (monthsData[month].top50MaisPesquisados || []).find(t => t.termo === termo);
      rowHTML += found ? `<td>${found.buscas.toLocaleString()}</td>` : '<td>-</td>';
      buscasValues.push(found ? found.buscas : 0);
    });

    selectedMonths.forEach(month => {
      const found = (monthsData[month].top50MaisPesquisados || []).find(t => t.termo === termo);
      rowHTML += found ? `<td>${found.vendas.toLocaleString()}</td>` : '<td>-</td>';
      vendasValues.push(found ? found.vendas : 0);
    });

    selectedMonths.forEach(month => {
      const found = (monthsData[month].top50MaisPesquisados || []).find(t => t.termo === termo);
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

function updateInsights() {
  const container = document.getElementById('insightsContainer');
  container.innerHTML = '';
  const insights = generateInsights(selectedMonths, monthsData);
  insights.forEach(insight => {
    const card = document.createElement('div');
    card.className = `insight-card ${insight.tipo || ''}`;
    card.innerHTML = `<div class="insight-icon">${insight.icon}</div>
                      <div class="insight-title">${insight.title}</div>
                      <div the="insight-description">${insight.description}</div>`;
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

function addSelectedMonthBlock(monthKey) {
  if (monthsBlocksRendered.includes(monthKey)) return;
  monthsBlocksRendered.push(monthKey);

  const month = monthsData[monthKey];
  if (!month) return;
  const uniqueId = monthKey;
  const container = document.getElementById('selected-months-blocks');
  const block = document.createElement('div');
  block.className = 'selected-month-block';

  block.innerHTML = `
  <div class="selected-month-block-header">
    <h3>${month.name} ${month.year} </h3> 
    <button class="selected-month-toggle" aria-label="Expandir">
      <svg viewBox="0 0 20 20"><polyline points="6 8 10 12 14 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
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
          Pizza e tabela com o percentual e volume de buscas que retornaram produtos versus as que não retornaram durante <b>${month.name} de ${month.year}</b>.
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
          Gráfico de linha mostrando o volume diário de buscas com retorno de produtos em <b>${month.name} de ${month.year}</b>.
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
          Volume diário de buscas que não retornaram produtos em <b>${month.name} de ${month.year}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoBuscasSemResultado-${uniqueId}"></canvas>
    </div>

    <!-- 4. Evolução Diária do CTR (%) -->
    <div class="mes-section-block">
      <div class="mes-chart-header">
        <div class="mes-chart-title">
          Evolução Diária do CTR (%)
          <span class="info-trigger" data-modal="info-evol-diaria-ctr-${uniqueId}">i</span>
        </div>
        <div class="mes-chart-desc">
          Clique por busca (%) ao longo de cada dia em <b>${month.name} de ${month.year}</b>.
        </div>
      </div>
      <canvas id="lineEvolucaoCTR-${uniqueId}"></canvas>
    </div>

    <!-- Indicadores Avançados (expansível) -->
    <div class="section advanced-section">
      <div class="advanced-header">
        <h3 class="section-title" style="text-align:center;">Indicadores Avançados</h3>
        <button class="advanced-toggle" aria-label="Expandir">
          <svg viewBox="0 0 20 20" width="22" height="22"><polyline points="6 8 10 12 14 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
                Gráfico de barras com os 10 termos mais buscados que retornaram resultados no site durante <b>${month.name} de ${month.year}</b>.
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
                Termos de busca que exibiram produtos, mas não geraram vendas em <b>${month.name} de ${month.year}</b>.
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
                Pizza com a proporção das 10 principais buscas com resultado durante <b>${month.name} de ${month.year}</b>.
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
                Pizza com a proporção das 10 principais buscas sem venda durante <b>${month.name} de ${month.year}</b>.
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
                Pizza com a proporção das 10 principais buscas sem resultado durante <b>${month.name} de ${month.year}</b>.
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

    <div class="info-modal" id="info-evol-diaria-ctr-${uniqueId}">
      <div class="info-content">
        <strong>Evolução Diária do CTR (%)</strong>
        <p>
          Mostra o percentual de buscas que geraram ao menos um clique em produtos ao longo de cada dia do mês.
        </p>
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
        <p>
          Lista os 10 termos mais pesquisados que apresentaram resultados no mês.
        </p>
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
          Visualiza a participação de cada termo mais buscado entre todos que retornaram resultado.
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

  const toggleBtn = block.querySelector('.selected-month-toggle');
  // Alterna a expansão do bloco e renderiza os gráficos diários quando expandido
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = block.classList.toggle('expanded');
    if (expanded) {
      // Renderiza gráficos diários apenas quando abrir
      renderPieProporcaoBuscas(uniqueId, month);
      renderLineEvolucaoBuscasComResultado(uniqueId, month);
      renderLineEvolucaoBuscasSemResultado(uniqueId, month);
      renderLineEvolucaoCTR(uniqueId, month);
      // Gera tabela para proporção geral
      const total = month.buscasComResultado + month.buscasSemResultado;
      const geralRows = [
        ['Com Resultado', month.buscasComResultado.toLocaleString(), total ? ((month.buscasComResultado / total) * 100).toFixed(1) + '%' : '0%'],
        ['Sem Resultado', month.buscasSemResultado.toLocaleString(), total ? ((month.buscasSemResultado / total) * 100).toFixed(1) + '%' : '0%']
      ];
      const tableEl = document.getElementById(`table-pieProporcaoBuscas-${uniqueId}`);
      if (tableEl) {
        tableEl.innerHTML = generateTableHTML(['Tipo', 'Buscas', 'Proporção'], geralRows);
      }
    }
  });

  block.querySelector('.selected-month-block-header').addEventListener('click', (e) => {
    if (e.target !== toggleBtn) {
      const expanded = block.classList.toggle('expanded');
      if (expanded) {
        renderPieProporcaoBuscas(uniqueId, month);
        renderLineEvolucaoBuscasComResultado(uniqueId, month);
        renderLineEvolucaoBuscasSemResultado(uniqueId, month);
        renderLineEvolucaoCTR(uniqueId, month);
        // Atualiza a tabela de proporção geral
        const total = month.buscasComResultado + month.buscasSemResultado;
        const geralRows = [
          ['Com Resultado', month.buscasComResultado.toLocaleString(), total ? ((month.buscasComResultado / total) * 100).toFixed(1) + '%' : '0%'],
          ['Sem Resultado', month.buscasSemResultado.toLocaleString(), total ? ((month.buscasSemResultado / total) * 100).toFixed(1) + '%' : '0%']
        ];
        const tableEl = document.getElementById(`table-pieProporcaoBuscas-${uniqueId}`);
        if (tableEl) {
          tableEl.innerHTML = generateTableHTML(['Tipo', 'Buscas', 'Proporção'], geralRows);
        }
      }
    }
  });

  container.appendChild(block);

  const advancedToggleBtn = block.querySelector('.advanced-toggle');
  const advancedChartsContent = block.querySelector('.advanced-charts-content');
  let advancedChartsRendered = false;

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

        // 5. Top 10 Buscas com Resultado
        const topCom = (month.top50MaisPesquisados || []).slice(0, 10);
        const rowsCom = topCom.map(item => [item.termo, item.buscas.toLocaleString()]);
        const tableCom = document.getElementById(`table-barTop10BuscasComResultado-${uniqueId}`);
        if (tableCom) {
          tableCom.innerHTML = generateTableHTML(['Termo', 'Buscas'], rowsCom);
        }
        // 6. Top 10 Buscas sem Resultado
        const topSem = (month.top50SemResultado || []).slice(0, 10);
        const rowsSem = topSem.map(item => [item.termo, item.buscas.toLocaleString()]);
        const tableSem = document.getElementById(`table-barTop10BuscasSemResultado-${uniqueId}`);
        if (tableSem) {
          tableSem.innerHTML = generateTableHTML(['Termo', 'Buscas'], rowsSem);
        }
        // 7. Buscas com Resultado, mas Sem Vendas
        const topSemVenda = (month.top50SemVenda || []).slice(0, 10);
        const rowsSemVenda = topSemVenda.map(item => [item.termo, item.buscas.toLocaleString()]);
        const tableSemVenda = document.getElementById(`table-barBuscasComResultadoSemVendas-${uniqueId}`);
        if (tableSemVenda) {
          tableSemVenda.innerHTML = generateTableHTML(['Termo', 'Buscas'], rowsSemVenda);
        }
        // 8. Distribuição das Top 10 Buscas com Resultado
        const distCom = (month.top50MaisPesquisados || []).slice(0, 10);
        const sumCom = distCom.reduce((acc, i) => acc + i.buscas, 0);
        const rowsPieCom = distCom.map(i => {
          const pct = sumCom ? ((i.buscas / sumCom) * 100).toFixed(1) + '%' : '0%';
          return [i.termo, i.buscas.toLocaleString(), pct];
        });
        const tablePieCom = document.getElementById(`table-pieDistribuicaoTop10BuscasComResultado-${uniqueId}`);
        if (tablePieCom) {
          tablePieCom.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], rowsPieCom);
        }
        // 9. Distribuição das Top 10 Buscas sem Vendas
        const distSemVenda = (month.top50SemVenda || []).slice(0, 10);
        const sumSemVenda = distSemVenda.reduce((acc, i) => acc + i.buscas, 0);
        const rowsPieSemVenda = distSemVenda.map(i => {
          const pct = sumSemVenda ? ((i.buscas / sumSemVenda) * 100).toFixed(1) + '%' : '0%';
          return [i.termo, i.buscas.toLocaleString(), pct];
        });
        const tablePieSemVenda = document.getElementById(`table-pieDistribuicaoTop10BuscasSemVendas-${uniqueId}`);
        if (tablePieSemVenda) {
          tablePieSemVenda.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], rowsPieSemVenda);
        }
        // 10. Distribuição das Top 10 Buscas sem Resultado
        const distSemResultado = (month.top50SemResultado || []).slice(0, 10);
        const sumSemResultado = distSemResultado.reduce((acc, i) => acc + i.buscas, 0);
        const rowsPieSemResultado = distSemResultado.map(i => {
          const pct = sumSemResultado ? ((i.buscas / sumSemResultado) * 100).toFixed(1) + '%' : '0%';
          return [i.termo, i.buscas.toLocaleString(), pct];
        });
        const tablePieSemResultado = document.getElementById(`table-pieDistribuicaoTop10BuscasSemResultado-${uniqueId}`);
        if (tablePieSemResultado) {
          tablePieSemResultado.innerHTML = generateTableHTML(['Termo', 'Buscas', 'Proporção'], rowsPieSemResultado);
        }
        advancedChartsRendered = true;
      }
    }
  });
}

function renderMonthBlockCharts(monthKey, uniqueId) {
  const month = monthsData[monthKey];
  if (!month) return;

  const proporcaoLabels = ["Com Resultado", "Sem Resultado"];
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
