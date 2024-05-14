import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
let supabase;

supabase = createClient('https://nhgspooltizwismypzan.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3Nwb29sdGl6d2lzbXlwemFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA2MTI2MDQsImV4cCI6MjAyNjE4ODYwNH0.7uPvzyXlBh6EUShss-I2KkuAAPdyeMauKXdKwGl6YnA');


document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting in the traditional manner
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Use Supabase client directly to handle login
    const { user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Login error:', error.message);
        // Handle error (e.g., display a message to the user)
    } else {
        let usr = await supabase.auth.getUser()
        console.log('User logged in:', user, usr);
        // Redirect the user or update UI as needed
        window.location.href = './../../index.html'; // Adjust as necessary
    }
});

document.getElementById('registration-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from submitting in the traditional manner
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // Use Supabase client to handle user registration
    const { user, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Registration error:', error.message);
        // Handle registration error (e.g., display a message to the user)
    } else {
        console.log('User registered:', user);
        // Change the Register button to "Done" and to a different color, clear all fields
        const registerButton = document.querySelector('#registration-form button[type="submit"]');
        registerButton.textContent = 'Done';
        registerButton.style.backgroundColor = '#28a745'; // A success color, for example, green
        // Clear input fields
        document.getElementById('registration-form').reset();
        // Optionally, disable the button to prevent repeated submissions
        registerButton.disabled = true;
        // You can add more code here to handle post-registration actions, like redirecting the user
    }
});


