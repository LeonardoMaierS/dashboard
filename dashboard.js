let selectedMonths = [];
let tableItemLimit = 5;
let monthsBlocksRendered = [];

document.addEventListener('DOMContentLoaded', function () {
  initializeMonthSelector();
  updateDashboard();
  initializeModals();

  const limitSelect = document.getElementById('itemLimit');
  if (limitSelect) {
    limitSelect.value = tableItemLimit;
    limitSelect.addEventListener('change', function () {
      tableItemLimit = parseInt(this.value);
      updateDetailedTable();
    });
  }
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
  }
  initializeMonthSelector();
  updateDashboard();
}

function updateDashboard() {
  const chartsSection = document.getElementById('chartsSection');
  const tableSection = document.getElementById('tableSection');
  const insightsSection = document.getElementById('insightsSection');
  const monthsBlocksContainer = document.getElementById('selected-months-blocks');

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
  const grid = document.getElementById('mainChartsGrid');
  grid.innerHTML = `
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Top 10 Termos Buscados
          <span class="info-trigger" data-modal="info-top10bar">i</span>
        </div>
      </div>
      <canvas id="top10BarChart"></canvas>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Proporção Top 10 Buscas
          <span class="info-trigger" data-modal="info-top10pie">i</span>
        </div>
      </div>
      <canvas id="top10PieChart"></canvas>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Taxa de Conversão
          <span class="info-trigger" data-modal="info-conversao">i</span>
        </div>
      </div>
      <canvas id="conversionChart"></canvas>
    </div>
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">
          Evolução das Buscas
          <span class="info-trigger" data-modal="info-evolucao">i</span>
        </div>
      </div>
      <canvas id="evolutionChart"></canvas>
    </div>
  `;
  createTop10BarChart(
    getCombinedTopTerms().map(item => item.termo),
    getCombinedTopTerms().map(item => item.buscas),
  );
  createTop10PieChart(
    getCombinedTopTerms().map(item => item.termo),
    getCombinedTopTerms().map(item => item.buscas)
  );
  createConversionChart(
    selectedMonths.map(m => monthsData[m].name),
    selectedMonths.map(m => monthsData[m].conversao),
    selectedMonths.map(m => monthsData[m].color)
  );
  createEvolutionChart(
    selectedMonths.map(m => monthsData[m].name),
    selectedMonths.map(m => monthsData[m].totalBuscas),
    selectedMonths.map(m => monthsData[m].buscasComResultado)
  );
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
      rowHTML += found ? `<td>${found.vendas}</td>` : '<td>-</td>';
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
    <h3>${month.name} ${month.year}</h3>
    <button class="selected-month-toggle" aria-label="Expandir">
      <svg viewBox="0 0 20 20"><polyline points="6 8 10 12 14 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  <div class="selected-month-block-content">
    <!-- PROPORÇÃO GERAL - LINHA INTEIRA -->
    <div class="bloco-busca-proporcao proporcao-full-width">
      <div class="proporcao-header">
        <h3>
          Proporção Geral de Buscas com e sem Resultado
          <span class="info-trigger" data-modal="modal-info-proporcao-${uniqueId}">i</span>
        </h3>
        <p class="proporcao-sub">Comparativo entre buscas que retornaram produtos e buscas sem retorno.</p>
      </div>
      <div class="proporcao-content">
        <div class="proporcao-chart-container">
          <canvas id="pie-busca-proporcao-${uniqueId}"></canvas>
        </div>
        <div class="proporcao-table-container">
          <table class="proporcao-mini-table">
            <thead>
              <tr>
                <th>Resultado</th>
                <th>Volume</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="proporcao-icon sucesso"></span>Com Resultado</td>
                <td>${month.buscasComResultado.toLocaleString()}</td>
                <td>${((month.buscasComResultado / month.totalBuscas) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td><span class="proporcao-icon erro"></span>Sem Resultado</td>
                <td>${month.buscasSemResultado.toLocaleString()}</td>
                <td>${((month.buscasSemResultado / month.totalBuscas) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="info-modal" id="modal-info-proporcao-${uniqueId}" style="display:none;">
        <strong>Proporção Geral de Buscas com e sem Resultado</strong><br>
        Este gráfico mostra o total de buscas realizadas no site durante o mês, separando-as entre buscas que retornaram produtos (“Com Resultado”) e buscas sem retorno (“Sem Resultado”).<br><br>
        <b>Objetivo:</b> Avaliar a efetividade da busca interna do site.<br>
        <b>Como interpretar:</b> Uma fatia alta de buscas sem resultado pode indicar termos não indexados, problemas no cadastro de produtos ou falhas na experiência do usuário.<br>
        <b>Insight:</b> Recomenda-se investigar os termos mais frequentes sem retorno e ajustar o mix de produtos ou palavras-chave, mantendo a taxa “Sem Resultado” abaixo de 2%.
      </div>
    </div>
    <div class="month-pies-grid-3">
      <!-- TOP 10 COM RESULTADO -->
      <div class="month-pie-card">
        <h3 style="text-align: center;">Distribuição das Top 10 Buscas com Resultado</h3>
        <p style="margin-top: 10px; font-size: 14px; color: #b3c8cf; text-align: center;">
          Distribuição proporcional das 10 principais buscas com resultado.
          <span class="info-trigger" data-modal="modal-info-com-resultado-${uniqueId}">i</span>
        </p>
        <div class="info-modal" id="modal-info-com-resultado-${uniqueId}" style="display:none;">
          <strong>Distribuição das Top 10 Buscas com Resultado</strong><br>
          Exibe os 10 termos de busca mais populares que retornaram produtos no site.<br><br>
          <b>Objetivo:</b> Identificar quais produtos ou categorias têm maior interesse dos clientes.<br>
          <b>Como interpretar:</b> Termos recorrentes sugerem tendências de consumo e oportunidades de campanha.<br>
          <b>Insight:</b> Itens do topo devem ser monitorados quanto a estoque e exposição. Alterações bruscas no ranking podem indicar mudanças no comportamento do consumidor.
        </div>
        <canvas class="pie-month" id="pie-top10-com-resultado-${uniqueId}"></canvas>
        <div class="proporcao-table-container" id="table-top10-com-resultado-${uniqueId}"></div>
      </div>
      <div class="month-pie-card">
        <h3 style="text-align: center;">Distribuição das Top 10 Buscas sem Vendas</h3>
        <p style="margin-top: 10px; font-size: 14px; color: #b3c8cf; text-align: center;">
          Distribuição proporcional das buscas que não geraram vendas, apesar de exibirem produtos.
          <span class="info-trigger" data-modal="modal-info-sem-venda-${uniqueId}">i</span>
        </p>
        <div class="info-modal" id="modal-info-sem-venda-${uniqueId}" style="display:none;">
          <strong>Distribuição das Top 10 Buscas sem Vendas</strong><br>
          Mostra os principais termos buscados que retornaram produtos, mas não resultaram em vendas.<br><br>
          <b>Objetivo:</b> Identificar gargalos de conversão mesmo quando o item é encontrado.<br>
          <b>Como interpretar:</b> Pode indicar preços elevados, informações incompletas, falta de confiança ou concorrência forte.<br>
          <b>Insight:</b> Recomenda-se revisar os detalhes dos produtos, ajustar preços e aprimorar as descrições ou imagens.
        </div>
        <canvas class="pie-month" id="pie-top10-sem-venda-${uniqueId}"></canvas>
        <div class="proporcao-table-container" id="table-top10-sem-venda-${uniqueId}"></div>
      </div>
      <div class="month-pie-card">
        <h3 style="text-align: center;">Distribuição das Top 10 Buscas sem Resultado</h3>
        <p style="margin-top: 10px; font-size: 14px; color: #b3c8cf; text-align: center;">
          Distribuição proporcional das 10 principais buscas sem resultado.
          <span class="info-trigger" data-modal="modal-info-sem-resultado-${uniqueId}">i</span>
        </p>
        <div class="info-modal" id="modal-info-sem-resultado-${uniqueId}" style="display:none;">
          <strong>Distribuição das Top 10 Buscas sem Resultado</strong><br>
          Apresenta os 10 termos mais buscados que não retornaram produtos durante o mês.<br><br>
          <b>Objetivo:</b> Detectar demandas não atendidas ou falhas no cadastro/índice do site.<br>
          <b>Como interpretar:</b> Altas ocorrências sugerem oportunidades de ampliar portfólio ou corrigir sinônimos e categorias.<br>
          <b>Insight:</b> Recomenda-se avaliar individualmente os termos, contatar fornecedores ou ajustar a busca do site.
        </div>
        <canvas class="pie-month" id="pie-top10-sem-resultado-${uniqueId}"></canvas>
        <div class="proporcao-table-container" id="table-top10-sem-resultado-${uniqueId}"></div>
      </div>
    </div>
  </div>
  `;

  const toggleBtn = block.querySelector('.selected-month-toggle');
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    block.classList.toggle('expanded');
    if (block.classList.contains('expanded')) {
      renderMonthBlockCharts(monthKey, uniqueId);
    }
  });

  block.querySelector('.selected-month-block-header').addEventListener('click', (e) => {
    if (e.target !== toggleBtn) {
      block.classList.toggle('expanded');
      if (block.classList.contains('expanded')) {
        renderMonthBlockCharts(monthKey, uniqueId);
      }
    }
  });

  container.appendChild(block);
}

function renderMonthBlockCharts(monthKey, uniqueId) {
  const month = monthsData[monthKey];
  if (!month) return;

  const proporcaoLabels = ["Com Resultado", "Sem Resultado"];
  const proporcaoData = [
    month.buscasComResultado,
    month.buscasSemResultado
  ];
  new Chart(document.getElementById(`pie-busca-proporcao-${uniqueId}`), {
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
  new Chart(document.getElementById(`pie-top10-com-resultado-${uniqueId}`), {
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
  document.getElementById(`table-top10-com-resultado-${uniqueId}`).innerHTML = `
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
  new Chart(document.getElementById(`pie-top10-sem-venda-${uniqueId}`), {
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
  document.getElementById(`table-top10-sem-venda-${uniqueId}`).innerHTML = `
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
  new Chart(document.getElementById(`pie-top10-sem-resultado-${uniqueId}`), {
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
  document.getElementById(`table-top10-sem-resultado-${uniqueId}`).innerHTML = `
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
