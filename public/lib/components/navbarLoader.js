document.addEventListener("DOMContentLoaded", async function() {
    // Fetch the navbar HTML and insert it into the navbar container
    const response = await fetch('/lib/components/navbar.html');
    if (response.ok) {
        const data = await response.text();
        document.getElementById('navbar-container').innerHTML = data;

        // Check login status and update navbar
        await checkLoginStatus();
    } else {
        console.error('Failed to load navbar.');
    }
});

async function checkLoginStatus() {
    const response = await fetch('/api/check-session');
    if (response.ok) {
        const data = await response.json();

        if (data.loggedIn) {
            document.getElementById('login-register-link').style.display = 'none';
            document.getElementById('logout-link').style.display = 'block';
        } else {
            document.getElementById('login-register-link').style.display = 'block';
            document.getElementById('logout-link').style.display = 'none';
        }

        document.getElementById('logout-link').addEventListener('click', async () => {
            const logoutResponse = await fetch('/api/logout', {
                method: 'POST'
            });
            if (logoutResponse.ok) {
                window.location.href = '/';
            } else {
                console.error('Failed to log out.');
            }
        });
    } else {
        console.error('Failed to check login status.');
    }
}
