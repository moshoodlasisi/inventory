const form = document.getElementById('login-form');
const error = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value;
        const password = form.password.value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
				Authentication: 'Bearer Token'
            },
            body: JSON.stringify({
                username,
                password
            })
            })
        .then(response => response.json())
        .then(data => {
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                window.location.href = 'inventory.html';
            } else {
                error.style.display = 'block';
            }
        })
        .catch(error => console.log(error));
    });