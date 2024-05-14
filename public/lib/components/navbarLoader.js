import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// Initialize Supabase client
let supabase = createClient('https://nhgspooltizwismypzan.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3Nwb29sdGl6d2lzbXlwemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA2MTI2MDQsImV4cCI6MjAyNjE4ODYwNH0.7uPvzyXlBh6EUShss-I2KkuAAPdyeMauKXdKwGl6YnA');

document.addEventListener('DOMContentLoaded', function () {
    const navbarCSSKey = 'navbarCSS';
    let navbarCSS = localStorage.getItem(navbarCSSKey);

    if (!navbarCSS) {
        fetch('../components/navbarStyle.css')
            .then(response => response.text())
            .then(css => {
                localStorage.setItem(navbarCSSKey, css);
                applyCSS(css);
            });
    } else {
        applyCSS(navbarCSS);
    }

    function applyCSS(css) {
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    adjustAuthLinks(); // Adjust authentication-related links on load
    setupLogoutListener(); // Setup listener for logout action
});


async function adjustAuthLinks() {
    // Check the current authentication session
    const { data, error } = await supabase.auth.getSession();

    // Show or hide authentication links based on session status
    if (data?.session) {
        document.getElementById('login-register-link').style.display = 'none';
        document.getElementById('logout-link').style.display = 'block';
    } else {
        document.getElementById('login-register-link').style.display = 'block';
        document.getElementById('logout-link').style.display = 'none';
    }
}

function setupLogoutListener() {
    // Listener for logout clicks
    document.addEventListener('click', async (e) => {
        if (e.target.id === 'logout-link' || e.target.closest('#logout-link')) {
            e.preventDefault(); // Prevent default action
            console.log("Logout clicked");

            // Attempt to log out
            const { error } = await supabase.auth.signOut();

            if (!error) {
                console.log("Logout successful");
                adjustAuthLinks(); // Update the UI based on auth state
            } else {
                console.error('Logout error:', error);
            }
        }
    });
}