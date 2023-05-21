const form = document.getElementById('login-form');
const error = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = form.username.value;
    const password = form.password.value;

    console.log(':::::: FORM DATA ::::::::', {username, password});

    try{
        const promiseResponse = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
    
            body: JSON.stringify({
                username,
                password
            })
        });
    
        const data = await promiseResponse.json();
    
        if (data.accessToken) {
            localStorage.setItem('loginData',  JSON.stringify({username, accessToken: data.accessToken}));
            window.location.href = 'inventory.html';
        } else {
            alert('Error: No token returned')
            error.style.display = 'block';
        }
        
    }catch(error){
        console.log('::: ERROR OCCURED', error)
    }
});