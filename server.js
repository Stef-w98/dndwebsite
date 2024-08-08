require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cacheControl = require('express-cache-controller');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to parse JSON requests with larger limits
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use sessions
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true if using HTTPS
}));

// Use cache control
app.use(cacheControl({
    noCache: true,
    private: false,
    mustRevalidate: true
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
    origin: 'https://www.dungeonsandmuffins.be', // Allow only this origin
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
}));

// Multer configuration for file uploads
const uploadFolder = path.join(__dirname, 'public', 'cityImages');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const cityName = req.body.name.replace(/ /g, '_'); // Replace spaces with underscores
        if (!cityName) {
            return cb(new Error("City name is required"));
        }
        const cityFolder = path.join(uploadFolder, cityName);
        if (!fs.existsSync(cityFolder)) {
            fs.mkdirSync(cityFolder, { recursive: true });
        }
        cb(null, cityFolder);
    },
    filename: function (req, file, cb) {
        const cityName = req.body.name.replace(/ /g, '_'); // Replace spaces with underscores
        const extension = path.extname(file.originalname);
        let baseFilename = cityName;
        let counter = 1;
        let newFilename = baseFilename + extension;
        const cityFolder = path.join(uploadFolder, cityName);
        while (fs.existsSync(path.join(cityFolder, newFilename))) {
            newFilename = `${baseFilename}${counter}${extension}`;
            counter++;
        }
        cb(null, newFilename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Limit file size to 50MB
});

// Handle file uploads
app.post('/upload', upload.array('files'), (req, res) => {
    try {
        const cityName = req.body.name.replace(/ /g, '_'); // Replace spaces with underscores
        const isCapital = req.body.capital === 'true'; // Note: req.body.capital will be a string
        if (!cityName) {
            throw new Error("City name is required");
        }
        const files = req.files;
        if (!files) {
            throw new Error('No files uploaded');
        }
        const paths = files.map(file => `/cityImages/${cityName}/${file.filename}`);
        res.json({ paths: paths, capital: isCapital });
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// Import routes
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const mapRoutes = require('./routes/map');
const weatherRoutes = require('./routes/weather');

app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api', mapRoutes);
app.use('/api', weatherRoutes);

console.log('Routes setup complete');

// Start the server
const PORT = process.env.PORT || 3000;
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
