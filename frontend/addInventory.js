const form = document.querySelector('form');

const getLoginData = () => {
  const loginDataString = localStorage.getItem('loginData');
  return JSON.parse(loginDataString)
}

const populateInventoriesTable = (inventories) => {
  const tableBody = document.getElementById('inventory-table');
  inventories.forEach((inventory) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${inventory.id}</td>
      <td>${inventory.name}</td>
      <td>${inventory.quantity}</td>
    `;

    tableBody.appendChild(row);
  });
}

const addInventory = async (name, quantity) => {
  try {
    const loginData = getLoginData();
    const promiseResponse = await fetch('http://localhost:8000/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      },
      body: JSON.stringify({
        name,
        quantity
      })
    });

    const response = await promiseResponse.json();

    if (response) {
      const promiseResponse = await fetch('http://localhost:8000/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.accessToken}`
        },
      });

      const inventories = await promiseResponse.json();
      populateInventoriesTable(inventories);
      
    }
  } catch (error) {
    console.error(error);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.name.value;
  const quantity = form.quantity.value;
  addInventory(name, quantity);
  window.location.href = 'inventory.html';
});
