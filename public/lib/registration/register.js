document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting in the traditional manner
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Send login request to server
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
        console.log('User logged in:', data.user);
        // Redirect the user or update UI as needed
        window.location.href = './../../index.html'; // Adjust as necessary
    } else {
        console.error('Login error:', data.error);
        // Handle error (e.g., display a message to the user)
    }
});

document.getElementById('registration-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting in the traditional manner
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // Send registration request to server
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
        console.log('User registered:', data.user);
        // Change the Register button to "Done" and to a different color, clear all fields
        const registerButton = document.querySelector('#registration-form button[type="submit"]');
        registerButton.textContent = 'Done';
        registerButton.style.backgroundColor = '#28a745'; // A success color, for example, green
        // Clear input fields
        document.getElementById('registration-form').reset();
        // Optionally, disable the button to prevent repeated submissions
        registerButton.disabled = true;
    } else {
        console.error('Registration error:', data.error);
        // Handle registration error (e.g., display a message to the user)
    }
});
