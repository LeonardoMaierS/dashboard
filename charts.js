// Paleta de cores padrão
const COLORS = {
  brand: "#284f58",
  brandDark: "#1e4149",
  surface: "#14323a",
  background: "#0a242b",
  backgroundDark: "#00151c",
  textPrimary: "#eaf7fb",
  textSecondary: "#b3c8cf",
}

// Paleta de cores base utilizada nos gráficos
const CHART_COLORS = [
  "#ecd078", "#d95b43", "#c02942", "#542437", "#53777a",
  "#966c80", "#96bda8", "#bfd4ad", "#f7d3a3", "#eca36c"
];

// Cor padrão de borda utilizada nos gráficos
const BORDER_COLOR = COLORS.textPrimary;

/**
 * Converte uma cor hexadecimal para uma string RGBA com opacidade.
 * Esta utilidade facilita a criação de cores translúcidas para backgrounds e gradientes, mantendo o padrão institucional.
 * A função remove o símbolo '#' se presente, converte o valor para números RGB e aplica a opacidade fornecida.
 */
function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ticks = {
  color: COLORS.textSecondary,
  font: { size: window.innerWidth < 600 ? 10 : 13 }
};

const scales = {
  x: {
    type: 'category',
    grid: { color: COLORS.brandDark },
    ticks
  },
  y: {
    beginAtZero: true,
    grid: { color: COLORS.brandDark },
    ticks
  }
}

let chartBarTop10TermosBuscados
let chartPieProporcaoTop10Buscas
let chartBarTaxaConversao
let chartLineEvolucaoBuscas

const monthlyChartInstances = {};

/**
 * Verifica se um canvas existe e está visível no documento.
 */
function canvasExists(id) {
  const el = document.getElementById(id);
  return el?.offsetParent !== null;
}

/**
 * Renderiza um gráfico de barras horizontal com os 10 termos mais buscados
 * considerando todos os meses selecionados. Substitui qualquer instância
 * existente utilizando o mesmo ID.
 */
function renderBarTop10TermosBuscados(labels, values) {
  const canvasId = 'chartTop10TermosBuscados';

  if (!canvasExists(canvasId)) return;
  if (chartBarTop10TermosBuscados) chartBarTop10TermosBuscados.destroy();

  const ctx = document.getElementById(canvasId).getContext('2d');

  chartBarTop10TermosBuscados = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Top 10 Termos Buscados',
        data: values,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6)),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: COLORS.surface,
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.x.toLocaleString()}`,
            labelColor: function (context) {
              const color = hexToRgba(CHART_COLORS[context.dataIndex % CHART_COLORS.length], 1)
              return {
                borderColor: color,
                backgroundColor: color
              };
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.surface },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de pizza com a proporção das buscas dos 10 termos mais populares entre os meses selecionados.
 */
function renderPieProporcaoTop10Buscas(labels, values) {
  const canvasId = 'chartProporcaoTop10Buscas';

  if (!canvasExists(canvasId)) return;
  if (chartPieProporcaoTop10Buscas) chartPieProporcaoTop10Buscas.destroy();

  const ctx = document.getElementById(canvasId).getContext('2d');

  chartPieProporcaoTop10Buscas = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Proporção Top 10 Buscas',
        data: values,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.7)),
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()} buscas`
          }
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de barras horizontal para a taxa de conversão de cada
 * mês selecionado. Os valores são esperados em porcentagem (0-100).
 */
function renderBarTaxaConversao(labels, conversao) {
  const canvasId = 'chartTaxaConversao';

  if (!canvasExists(canvasId)) return;
  if (chartBarTaxaConversao) chartBarTaxaConversao.destroy();

  const ctx = document.getElementById(canvasId).getContext('2d');

  chartBarTaxaConversao = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Taxa de Conversão (%)',
        data: conversao,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6)),
        barPercentage: 0.7,
        categoryPercentage: 0.58,
        borderColor: BORDER_COLOR,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: COLORS.surface,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x.toFixed(2)}%`,
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.surface },
          ticks
        },
        y: {
          grid: { display: false },
          ticks
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de linhas com três séries: total de buscas, buscas com
 * resultado e buscas sem resultado. Mostra a evolução mensal para cada mês selecionado.
 */
function renderLineEvolucaoBuscas(labels, totalBuscas, buscasComResultado) {
  const canvasId = 'chartEvolucaoBuscas';
  if (!canvasExists(canvasId)) return;
  if (chartLineEvolucaoBuscas) chartLineEvolucaoBuscas.destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');

  // Gradientes institucionais com transição para transparência. Cada gradiente
  // inicia com uma cor sólida (65% de opacidade) e termina totalmente
  // transparente, proporcionando o efeito de "desvanecimento" solicitado.
  const gradTotal = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradTotal.addColorStop(0, hexToRgba('#a077e8', 0.65));
  gradTotal.addColorStop(1, hexToRgba('#3481be', 0.0));
  const gradCom = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradCom.addColorStop(0, hexToRgba('#46f39c', 0.65));
  gradCom.addColorStop(1, hexToRgba('#3481be', 0.0));
  const gradSem = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradSem.addColorStop(0, hexToRgba('#ffe985', 0.65));
  gradSem.addColorStop(1, hexToRgba('#ff7d78', 0.0));

  const buscasSemResultado = totalBuscas.map((total, i) => total - (buscasComResultado[i] || 0));

  chartLineEvolucaoBuscas = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Buscas com Resultado',
          data: buscasComResultado,
          borderColor: gradCom,
          backgroundColor: gradCom,
          fill: true,
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointBackgroundColor: gradCom,
          pointBorderColor: BORDER_COLOR,
          pointBorderWidth: 2,
          order: 2,
          stack: 'buscas',
        },
        {
          label: 'Buscas sem Resultado',
          data: buscasSemResultado,
          borderColor: gradSem,
          backgroundColor: gradSem,
          fill: true,
          borderWidth: 2.5,
          tension: 0.28,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointBackgroundColor: gradSem,
          pointBorderColor: BORDER_COLOR,
          pointBorderWidth: 2,
          order: 1,
          stack: 'buscas'
        },
        {
          label: 'Total de Buscas',
          data: totalBuscas,
          borderColor: gradTotal,
          backgroundColor: gradTotal,
          fill: false,
          borderWidth: 3.3,
          tension: 0.22,
          pointRadius: 8,
          pointHoverRadius: 11,
          pointBackgroundColor: gradTotal,
          pointBorderColor: BORDER_COLOR,
          pointBorderWidth: 2.5,
          order: 3,
          type: 'line',
          stack: null
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: COLORS.surface },
          ticks
        },
        y: {
          beginAtZero: true,
          stacked: true,
          grid: { color: COLORS.surface },
          ticks
        }
      }
    }
  });
}

// ============================================================================
// GRÁFICOS MENSAIS – UTILIZADOS DENTRO DE CADA BLOCO DE MÊS
// Cada função abaixo recebe o id do mês (monthId) e o objeto de dados (month)
// para renderizar um gráfico específico dentro do bloco daquele mês.
// ============================================================================

/**
 * Destrói um gráfico existente em monthlyChartInstances (se houver) antes de
 * criar um novo. Ajuda a evitar vazamentos de memória do Chart.js.
 */
function destroyMonthlyChart(chartId) {
  if (monthlyChartInstances[chartId]) {
    monthlyChartInstances[chartId].destroy();
    delete monthlyChartInstances[chartId];
  }
}

/**
 * Renderiza o gráfico de pizza com a proporção geral de buscas com e sem resultado para um mês específico.
 */
function renderPieProporcaoBuscas(monthId, month) {
  const chartId = `pieProporcaoBuscas-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const labels = ['Com Resultado', 'Sem Resultado'];
  const data = [month.buscasComResultado, month.buscasSemResultado];
  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [hexToRgba('#46f39c', 0.7), hexToRgba('#ff7d78', 0.7)],
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12,
        innerWidth
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'top',
          labels: { color: COLORS.textSecondary, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textSecondary,
          titleColor: COLORS.textSecondary
        }
      }
    }
  });
}

/**
 * Renderiza a evolução diária de buscas com resultado (gráfico de linha) para um mês.
 * @param {string} monthId
 * @param {Object} month
 */
function renderLineEvolucaoBuscasComResultado(monthId, month) {
  const chartId = `lineEvolucaoBuscasComResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const daily = month.resumoDiario || [];
  const labels = daily.map(d => {
    const [year, month, day] = d.data.split("-");
    return `${day}/${month}/${year}`;
  });
  const values = daily.map(d => d.buscasComResultado);

  labels.reverse();
  values.reverse();

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

  grad.addColorStop(0, hexToRgba('#46f39c', 0.75));
  grad.addColorStop(1, hexToRgba('#3481be', 0.0));

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Buscas com Resultado',
        data: values,
        borderColor: '#46f39c',
        backgroundColor: grad,
        fill: true,
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 9,
        pointBackgroundColor: COLORS.textPrimary,
        pointBorderColor: grad,
        pointBorderWidth: 5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.y}`
          }
        }
      },
      scales
    }
  });
}

/**
 * Renderiza a evolução diária de buscas sem resultado (gráfico de linha) para um mês.
 */
function renderLineEvolucaoBuscasSemResultado(monthId, month) {
  const chartId = `lineEvolucaoBuscasSemResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const daily = month.resumoDiario || [];
  const labels = daily.map(d => {
    const [year, month, day] = d.data.split("-");
    return `${day}/${month}/${year}`;
  });
  const values = daily.map(d => d.buscasSemResultado);

  labels.reverse();
  values.reverse();

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

  grad.addColorStop(0, hexToRgba('#ffe985', 0.75));
  grad.addColorStop(1, hexToRgba('#ff7d78', 0.0));

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Buscas sem Resultado',
        data: values,
        borderColor: '#ffe985',
        backgroundColor: grad,
        fill: true,
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 9,
        pointBackgroundColor: COLORS.textPrimary,
        pointBorderColor: grad,
        pointBorderWidth: 5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.y}`
          }
        }
      },
      scales
    }
  });
}

/**
 * Renderiza a evolução diária do CTR (%) em um mês específico (gráfico de linha).
 */
function renderLineEvolucaoCTR(monthId, month) {
  const chartId = `lineEvolucaoCTR-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const daily = month.resumoDiario || [];
  const labels = daily.map(d => {
    const [year, month, day] = d.data.split("-");
    return `${day}/${month}/${year}`;
  });
  const values = daily.map(d => d.ctr);

  labels.reverse();
  values.reverse();

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

  grad.addColorStop(0, hexToRgba('#a077e8', 0.75));
  grad.addColorStop(1, hexToRgba('#3481be', 0.0));

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'CTR (%)',
        data: values,
        borderColor: '#a077e8',
        backgroundColor: grad,
        fill: true,
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 9,
        pointBackgroundColor: COLORS.textPrimary,
        pointBorderColor: grad,
        pointBorderWidth: 5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `CTR: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales
    }
  });
}

/**
 * Renderiza um gráfico de barras horizontal com os 10 termos com resultado mais buscados em um mês.
 */
function renderBarTop10BuscasComResultado(monthId, month) {
  const chartId = `barTop10BuscasComResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;

  destroyMonthlyChart(chartId);

  const termos = (month.top50MaisPesquisados || []).slice(0, 10);
  const labels = termos.map(t => t.termo);
  const values = termos.map(t => t.buscas);

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Buscas',
        data: values,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6)),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: COLORS.surface,
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.x.toLocaleString()}`,
            labelColor: function (context) {
              const color = hexToRgba(CHART_COLORS[context.dataIndex % CHART_COLORS.length], 1)
              return {
                borderColor: color,
                backgroundColor: color
              };
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.surface },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de barras horizontal com os 10 termos sem resultado mais buscados em um mês.
 */
function renderBarTop10BuscasSemResultado(monthId, month) {
  const chartId = `barTop10BuscasSemResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;

  destroyMonthlyChart(chartId);

  const termos = (month.top50SemResultado || []).slice(0, 10);
  const labels = termos.map(t => t.termo);
  const values = termos.map(t => t.buscas);

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Buscas',
        data: values,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6)),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: COLORS.surface,
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.x.toLocaleString()}`,
            labelColor: function (context) {
              const color = hexToRgba(CHART_COLORS[context.dataIndex % CHART_COLORS.length], 1)
              return {
                borderColor: color,
                backgroundColor: color
              };
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.surface },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de barras horizontal com termos que tiveram resultado mas não geraram vendas.
 */
function renderBarBuscasComResultadoSemVendas(monthId, month) {
  const chartId = `barBuscasComResultadoSemVendas-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;

  destroyMonthlyChart(chartId);

  const termos = (month.top50SemVenda || []).slice(0, 10);
  const labels = termos.map(t => t.termo);
  const values = termos.map(t => t.buscas);

  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Buscas',
        data: values,
        backgroundColor: labels.map((_, i) => hexToRgba(CHART_COLORS[i % CHART_COLORS.length], 0.6)),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: COLORS.surface,
          callbacks: {
            label: ctx => `Buscas: ${ctx.parsed.x.toLocaleString()}`,
            labelColor: function (context) {
              const color = hexToRgba(CHART_COLORS[context.dataIndex % CHART_COLORS.length], 1)
              return {
                borderColor: color,
                backgroundColor: color
              };
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLORS.surface },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: COLORS.textPrimary,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de pizza com a distribuição das 10 principais buscas com resultado.
 */
function renderPieDistribuicaoTop10BuscasComResultado(monthId, month) {
  const chartId = `pieDistribuicaoTop10BuscasComResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const termos = (month.top50MaisPesquisados || []).slice(0, 10);
  const labels = termos.map(i => i.termo);
  const values = termos.map(i => i.buscas);
  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        // Aplica transparência às cores e deslocamento em hover
        backgroundColor: CHART_COLORS.map(c => hexToRgba(c, 0.7)),
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: COLORS.textPrimary, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de pizza com a distribuição das 10 principais buscas sem vendas.
 */
function renderPieDistribuicaoTop10BuscasSemVendas(monthId, month) {
  const chartId = `pieDistribuicaoTop10BuscasSemVendas-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const termos = (month.top50SemVenda || []).slice(0, 10);
  const labels = termos.map(i => i.termo);
  const values = termos.map(i => i.buscas);
  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,

        backgroundColor: CHART_COLORS.map(c => hexToRgba(c, 0.7)),
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: COLORS.textPrimary, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary
        }
      }
    }
  });
}

/**
 * Renderiza um gráfico de pizza com a distribuição das 10 principais buscas sem resultado.
 */
function renderPieDistribuicaoTop10BuscasSemResultado(monthId, month) {
  const chartId = `pieDistribuicaoTop10BuscasSemResultado-${monthId}`;
  const canvas = document.getElementById(chartId);
  if (!canvas) return;
  destroyMonthlyChart(chartId);
  const termos = (month.top50SemResultado || []).slice(0, 10);
  const labels = termos.map(i => i.termo.length > 18 ? i.termo.slice(0, 16) + '...' : i.termo);

  const values = termos.map(i => i.buscas);
  monthlyChartInstances[chartId] = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.map(c => hexToRgba(c, 0.7)),
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: COLORS.textPrimary, font: { size: 13 },
          },
        },
        tooltip: {
          backgroundColor: COLORS.surface,
          bodyColor: COLORS.textPrimary,
          titleColor: COLORS.textPrimary
        }
      }
    }
  });
}

window.renderBarTop10TermosBuscados = renderBarTop10TermosBuscados;
window.renderPieProporcaoTop10Buscas = renderPieProporcaoTop10Buscas;
window.renderBarTaxaConversao = renderBarTaxaConversao;
window.renderLineEvolucaoBuscas = renderLineEvolucaoBuscas;
window.renderPieProporcaoBuscas = renderPieProporcaoBuscas;
window.renderLineEvolucaoBuscasComResultado = renderLineEvolucaoBuscasComResultado;
window.renderLineEvolucaoBuscasSemResultado = renderLineEvolucaoBuscasSemResultado;
window.renderLineEvolucaoCTR = renderLineEvolucaoCTR;
window.renderBarTop10BuscasComResultado = renderBarTop10BuscasComResultado;
window.renderBarTop10BuscasSemResultado = renderBarTop10BuscasSemResultado;
window.renderBarBuscasComResultadoSemVendas = renderBarBuscasComResultadoSemVendas;
window.renderPieDistribuicaoTop10BuscasComResultado = renderPieDistribuicaoTop10BuscasComResultado;
window.renderPieDistribuicaoTop10BuscasSemVendas = renderPieDistribuicaoTop10BuscasSemVendas;
window.renderPieDistribuicaoTop10BuscasSemResultado = renderPieDistribuicaoTop10BuscasSemResultado;
