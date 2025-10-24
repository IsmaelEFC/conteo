const API_URL = 'https://script.google.com/macros/s/AKfycbxgQzAXOHVBYxBbCjZn7YBnO9FmVDMFtwIlcp2P6GIEtSeQPuKW7B7ntMhftVVNM3E/exec'; // ← REEMPLAZA

let doughnutChart, barChart;
let registros = [];

// Cargar datos
async function actualizarDatos() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    registros = data.registros || []; // Asegúrate de que tu API devuelva "registros" como array

    // Procesar datos
    const confirmados = registros.length;
    const totalInvitados = registros.reduce((sum, r) => sum + (parseInt(r[3]) || 0), 0);

    document.getElementById('confirmados').textContent = confirmados;
    document.getElementById('invitados').textContent = totalInvitados;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('es-ES');

    renderTabla();
    actualizarGraficos(confirmados, totalInvitados);

  } catch (error) {
    console.error('Error:', error);
    alert('Error al conectar con Google Sheets.');
  }
}

// Renderizar tabla
function renderTabla() {
  const tbody = document.getElementById('tablaBody');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const dateFilter = document.getElementById('dateFilter').value;

  let filtered = registros;

  // Filtro por búsqueda
  if (search) {
    filtered = filtered.filter(r =>
      r[1].toLowerCase().includes(search) || r[2].includes(search)
    );
  }

  // Filtro por fecha
  if (dateFilter) {
    filtered = filtered.filter(r => {
      const fecha = r[0].split(' ')[0]; // Extrae fecha de "DD/MM/AAAA HH:MM"
      return fecha === dateFilter;
    });
  }

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${row[0]}</td>
      <td><strong>${row[1]}</strong></td>
      <td>${row[2]}</td>
      <td><span class="invitados-badge">${row[3]}</span></td>
      <td class="mensaje" title="${row[4]}">${row[4]}</td>
    </tr>
  `).join('');
}

// Ordenar tabla
function sortTable(col) {
  const tbody = document.getElementById('tablaBody');
  const rows = Array.from(tbody.rows);

  const isDate = col === 0;
  const isNumber = col === 3;

  rows.sort((a, b) => {
    let A = a.cells[col].textContent;
    let B = b.cells[col].textContent;

    if (isDate) {
      A = new Date(A.split('/').reverse().join('-') + ' ' + A.split(' ')[1]);
      B = new Date(B.split('/').reverse().join('-') + ' ' + B.split(' ')[1]);
    } else if (isNumber) {
      A = parseInt(A) || 0;
      B = parseInt(B) || 0;
    }

    return A > B ? 1 : -1;
  });

  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));
}

// Gráficos
function actualizarGraficos(confirmados, invitados) {
  // Doughnut
  const ctx1 = document.getElementById('doughnutChart').getContext('2d');
  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Confirmados', 'Invitados Extra'],
      datasets: [{
        data: [confirmados, invitados - confirmados],
        backgroundColor: ['#1a56db', '#10b981'],
        borderWidth: 0
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Bar
  const ctx2 = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Confirmados', 'Total Invitados'],
      datasets: [{
        data: [confirmados, invitados],
        backgroundColor: ['#1a56db', '#10b981'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Eventos en vivo
document.getElementById('searchInput').addEventListener('input', renderTabla);
document.getElementById('dateFilter').addEventListener('change', renderTabla);

// Auto-refresh cada 3 minutos
setInterval(actualizarDatos, 3 * 60 * 1000);

// Cargar al inicio
window.onload = () => {
  actualizarDatos();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
};