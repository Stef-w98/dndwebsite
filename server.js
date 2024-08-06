require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cacheControl = require('express-cache-controller');
const multer = require('multer');

const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Fetch all map data
app.get('/api/map-data', async (req, res) => {
    res.set('Cache-Control', 'no-store'); // Disable caching for this endpoint
    try {
        const { data: cities, error: citiesError } = await supabase.from('cities').select('*, images');
        if (citiesError) throw citiesError;

        const { data: regions, error: regionsError } = await supabase.from('regions').select('*');
        if (regionsError) throw regionsError;

        const { data: coordinates, error: coordinatesError } = await supabase.from('coordinates').select('*');
        if (coordinatesError) throw coordinatesError;

        const { data: weatherMarkers, error: weatherMarkersError } = await supabase.from('weathermarkers').select('*');
        if (weatherMarkersError) throw weatherMarkersError;

        const { data: weatherConditions, error: weatherConditionsError } = await supabase.from('weatherconditions').select('*');
        if (weatherConditionsError) throw weatherConditionsError;

        res.json({ cities, regions, coordinates, weatherMarkers, weatherConditions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Multer configuration for file uploads
const uploadFolder = path.join(__dirname, 'public', 'cityImages');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const cityName = req.body.name;
        const cityFolder = path.join(uploadFolder, cityName);
        if (!fs.existsSync(cityFolder)) {
            fs.mkdirSync(cityFolder, { recursive: true });
        }
        cb(null, cityFolder);
    },
    filename: function (req, file, cb) {
        const cityName = req.body.name;
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

const upload = multer({ storage: storage });

// Handle file uploads
app.post('/upload', upload.array('files'), (req, res) => {
    const cityName = req.body.name;
    const files = req.files;
    const paths = files.map(file => `/cityImages/${cityName}/${file.filename}`);
    res.json({ paths: paths });
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
