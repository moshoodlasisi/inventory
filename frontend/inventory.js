/**
 * 
 * TODO:
 * 1. Set the welcome message
 * 2. Load all the inventories for the logged in user
 * 
 */

const getLoginData = () => {
  const loginDataString = localStorage.getItem('loginData');
  return JSON.parse(loginDataString)
}

const setWelcomeText = () => {
  const parentNode = document.getElementById('welcome-text');
  const loginData = getLoginData();
  parentNode.innerHTML = `<b>Welcome ${loginData.username}</b>`
}

const populateInventoriesTable = (inventories) => {
  const tableBody = document.getElementById('inventory-table');
  tableBody.innerHTML = ''; // clear existing table rows
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

const getUserInventories = async () => {
  try{

    const loginData = getLoginData()
    
    const promiseResponse = await fetch('http://localhost:8000/inventory', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      },
    });

    const inventories = await promiseResponse.json();

    populateInventoriesTable(inventories)

  }catch(error){
    alert('Error: ' + error.message)
    console.log('Failed to fetch inventories', error.message)
  }
}

const clearTableData = () => {
  const tableBody = document.getElementById('inventory-table');
  tableBody.innerHTML = '';
}

const clearLocalStorageData = () => {
  localStorage.clear();
}



function main() {
  setWelcomeText()
  getUserInventories()

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', () => {
    clearTableData();
    clearLocalStorageData();
  });
}

// Run script
main()