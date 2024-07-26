document.addEventListener("DOMContentLoaded", function() {
    const registrationForm = document.getElementById("registration-form");

    registrationForm.addEventListener("submit", async function(event) {
        event.preventDefault(); // Prevent the form from submitting in the traditional manner

        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("register-password-check").value;
        const warningMessage = document.getElementById("warning-message");

        if (password !== confirmPassword) {
            warningMessage.textContent = "Passwords do not match. Please try again.";
            warningMessage.style.display = "block";
            return;
        }

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
            warningMessage.style.display = "none";
        } else {
            console.error('Registration error:', data.error);
            warningMessage.textContent = data.error;
            warningMessage.style.display = "block";
        }
    });

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

    document.getElementById('show-register').addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('login-form-box').style.display = 'none';
        document.getElementById('register-form-box').style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('register-form-box').style.display = 'none';
        document.getElementById('login-form-box').style.display = 'block';
    });
});
