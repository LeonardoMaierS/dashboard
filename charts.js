const CHART_COLORS = [
  "#ecd078", "#d95b43", "#c02942", "#542437", "#53777a",
  "#966c80", "#96bda8", "#bfd4ad", "#f7d3a3", "#eca36c"
];

const BORDER_COLOR = "#eaf7fb";

let top10BarChart, top10PieChart, conversionChart, evolutionChart;

function canvasExists(id) {
  const el = document.getElementById(id);
  return el && el.offsetParent !== null;
}

function createTop10BarChart(labels, values) {
  if (!canvasExists('top10BarChart')) return;
  if (top10BarChart) top10BarChart.destroy();
  const ctx = document.getElementById('top10BarChart').getContext('2d');
  top10BarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Buscas',
        data: values,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 13,
        barPercentage: 0.7,
        categoryPercentage: 0.58,
        borderWidth: 2,
        borderColor: BORDER_COLOR
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb",
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#14323a" },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        }
      }
    }
  });
}

function createTop10PieChart(labels, values) {
  if (!canvasExists('top10PieChart')) return;
  if (top10PieChart) top10PieChart.destroy();
  const ctx = document.getElementById('top10PieChart').getContext('2d');
  top10PieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Proporção',
        data: values,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: "#eaf7fb",
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb",
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()} buscas`
          }
        }
      }
    }
  });
}

function createConversionChart(labels, conversao) {
  if (!canvasExists('conversionChart')) return;
  if (conversionChart) conversionChart.destroy();
  const ctx = document.getElementById('conversionChart').getContext('2d');
  conversionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Taxa de Conversão (%)',
        data: conversao,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 13,
        barPercentage: 0.7,
        categoryPercentage: 0.58,
        borderWidth: 2,
        borderColor: BORDER_COLOR
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb",
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#14323a" },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        }
      }
    }
  });
}

function createEvolutionChart(labels, totalBuscas, buscasComResultado) {
  if (!canvasExists('evolutionChart')) return;
  if (evolutionChart) evolutionChart.destroy();
  const ctx = document.getElementById('evolutionChart').getContext('2d');

  const buscasSemResultado = totalBuscas.map((total, i) => total - (buscasComResultado[i] || 0));

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Buscas com Resultado',
          data: buscasComResultado,
          backgroundColor: CHART_COLORS[0] + '66',
          borderColor: CHART_COLORS[0],
          fill: { target: '+1' },
          borderWidth: 2.5,
          tension: 0.28,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointBackgroundColor: CHART_COLORS[0],
          pointBorderColor: BORDER_COLOR,
          pointBorderWidth: 2,
          order: 2,
          stack: 'buscas'
        },
        {
          label: 'Buscas sem Resultado',
          data: buscasSemResultado,
          backgroundColor: CHART_COLORS[2] + '66',
          borderColor: CHART_COLORS[2],
          fill: { target: 'origin' },
          borderWidth: 2.5,
          tension: 0.28,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointBackgroundColor: CHART_COLORS[2],
          pointBorderColor: BORDER_COLOR,
          pointBorderWidth: 2,
          order: 1,
          stack: 'buscas'
        },
        {
          label: 'Total de Buscas',
          data: totalBuscas,
          borderColor: CHART_COLORS[4],
          borderWidth: 3.3,
          tension: 0.22,
          fill: false,
          pointRadius: 8,
          pointHoverRadius: 11,
          pointBackgroundColor: CHART_COLORS[4],
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
            color: "#eaf7fb",
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: "#14323a",
          bodyColor: "#eaf7fb",
          titleColor: "#eaf7fb",
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#14323a" },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        },
        y: {
          beginAtZero: true,
          stacked: true,
          grid: { color: "#14323a" },
          ticks: { color: "#eaf7fb", font: { size: 13 } }
        }
      }
    }
  });
}
