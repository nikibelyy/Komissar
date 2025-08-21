const form = document.getElementById('clientForm');
const clientsTable = document.querySelector('#clientsTable tbody');

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

    let salary = 0;
    if(dealType === 'Цессия'){
        salary = total * 0.15;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${name}</td>
        <td>${carNumber}</td>
        <td>${carBrand}</td>
        <td>${dealType}</td>
        <td>${total.toFixed(2)}</td>
        <td>${salary.toFixed(2)}</td>
    `;
    clientsTable.appendChild(row);

    form.reset();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker зарегистрирован'))
    .catch(err => console.log('Ошибка Service Worker:', err));
}
