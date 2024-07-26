require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cacheControl = require('express-cache-controller');
const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Use sessions
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using HTTPS
}));

// Use cache control
app.use(cacheControl({
    noCache: true, // Disable caching
    private: false,
    mustRevalidate: true
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const mapRoutes = require('./routes/map');
const weatherRoutes = require('./routes/weather');

// Use routes
app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api', mapRoutes);
app.use('/api', weatherRoutes);

console.log('Routes setup complete');

// Inventory data
let inventory = [];

// Inventory routes
app.get('/inventory', (req, res) => {
    res.json(inventory);
});

app.post('/inventory', (req, res) => {
    const { quantity, name } = req.body;
    if (quantity && name) {
        inventory.push({ quantity, name });
        res.status(201).json({ message: 'Item added successfully' });
    } else {
        res.status(400).json({ message: 'Invalid item data' });
    }
});

// Start the server
const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle shutdown signals
const shutdown = () => {
    server.close(() => {
        console.log('Server is shutting down...');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
