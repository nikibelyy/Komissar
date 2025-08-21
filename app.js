const form = document.getElementById('clientForm');
const clientsContainer = document.getElementById('clientsContainer');

let clients = JSON.parse(localStorage.getItem('clients')) || [];

function renderClients() {
    clientsContainer.innerHTML = '';
    clients.forEach((client, index) => {
        const salary = client.dealType === 'Цессия' ? (client.total * 0.15).toFixed(2) : '0.00';
        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
            <h3>${client.name}</h3>
            <p>Номер: ${client.carNumber}</p>
            <p>Марка: ${client.carBrand}</p>
            <p>Сделка: ${client.dealType}</p>
            <p>Сумма: ${client.total.toFixed(2)}</p>
            <p class="salary">Зарплата: ${salary}</p>
            <button onclick="deleteClient(${index})">Удалить</button>
        `;
        clientsContainer.appendChild(card);
    });
}

function deleteClient(index) {
    clients.splice(index, 1);
    localStorage.setItem('clients', JSON.stringify(clients));
    renderClients();
}

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const carNumber = document.getElementById('carNumber').value;
    const carBrand = document.getElementById('carBrand').value;
    const dealType = document.getElementById('dealType').value;
    const total = parseFloat(document.getElementById('total').value);

    if(!name || !carNumber || !carBrand || !dealType || isNaN(total)){
        alert('Заполните все поля правильно');
        return;
    }

    clients.push({ name, carNumber, carBrand, dealType, total });
    localStorage.setItem('clients', JSON.stringify(clients));

    form.reset();
    renderClients();
});

renderClients();

// Service Worker для PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker зарегистрирован'))
    .catch(err => console.log('Ошибка Service Worker:', err));
}
