class FactoryMonitor {
    constructor() {
        this.lineChart = null;
        this.pieChart = null;
        this.dataHistory = [];
        this.initCharts();
        this.connectWebSocket();
    }

    initCharts() {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

        const ctxLine = document.getElementById('loadProfileChart').getContext('2d');
        this.lineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Загальне споживання (МВт)',
                    data: [],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: { 
                responsive: true, 
                scales: { 
                    y: { beginAtZero: true, suggestedMin: 15, suggestedMax: 35 } 
                },
                animation: { duration: 0 }
            }
        });

        const ctxPie = document.getElementById('workshopsPieChart').getContext('2d');
        this.pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Ливарний', 'Механоскладальний', 'Фарбувальний'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#f43f5e', '#38bdf8', '#fbbf24'],
                    borderColor: 'rgba(30, 41, 59, 1)',
                    borderWidth: 2
                }]
            },
            options: { 
                responsive: true,
                animation: { duration: 0 }
            }
        });
    }

    connectWebSocket() {
        this.socket = new WebSocket('ws://localhost:8000');

        this.socket.onopen = () => {
            const statusEl = document.getElementById('status');
            statusEl.textContent = 'Онлайн';
            statusEl.className = 'status-online';
        }

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateUI(data);
        }

        this.socket.onerror = (error) => {
            console.error('Помилка WebSocket:', error);
        };

        this.socket.onclose = () => {
            const statusEl = document.getElementById('status');
            statusEl.textContent = 'Офлайн';
            statusEl.className = 'status-offline';
            setTimeout(() => this.connectWebSocket(), 6000);
        };
    }

    updateUI(data) {
        document.getElementById('totalPower').textContent = `${data.totalPower.toFixed(2)} МВт`;
        document.getElementById('peakLoad').textContent = `${data.peakLoad.toFixed(2)} МВт`;
        document.getElementById('demandCoeff').textContent = data.demandCoefficient.toFixed(2);
        document.getElementById('costForecast').textContent = `${Math.round(data.DailyCost).toLocaleString('uk-UA')} грн`;

        const time = new Date(data.timestamp).toLocaleString();
        this.lineChart.data.labels.push(time);
        this.lineChart.data.datasets[0].data.push(data.totalPower);

        if(this.lineChart.data.labels.length > 20){
            this.lineChart.data.labels.shift();
            this.lineChart.data.datasets[0].data.shift();
        }

        this.lineChart.update();

        this.pieChart.data.datasets[0].data = [
            data.workshops['Ливарний'],
            data.workshops['Механоскладальний'],
            data.workshops['Фарбувальний']
        ];
        this.pieChart.update();

        this.dataHistory.unshift(data);
        if (this.dataHistory.length > 10) {
            this.dataHistory.pop();
        }
        this.updateTable();
    }

    updateTable() {
        const tableDiv = document.getElementById('dataTable');
        let html = `
            <table class="table table-sm table-hover align-middle text-center">
                <thead class="table-light">
                    <tr>
                        <th>Час</th>
                        <th>Загальне (МВт)</th>
                        <th>Ливарний (МВт)</th>
                        <th>Механоскладальний (МВт)</th>
                        <th>Фарбувальний (МВт)</th>
                        <th>Поточна вартість (грн/год)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.dataHistory.forEach(item => {
            html += `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td><span class="badge bg-primary rounded-pill px-3 py-2">${item.totalPower.toFixed(2)}</span></td>
                    <td>${item.workshops['Ливарний'].toFixed(2)}</td>
                    <td>${item.workshops['Механоскладальний'].toFixed(2)}</td>
                    <td>${item.workshops['Фарбувальний'].toFixed(2)}</td>
                    <td>${Math.round(item.currentCost).toLocaleString('uk-UA')}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        tableDiv.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FactoryMonitor();
});