const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const uploadFolder = path.join(__dirname, '../public/cityImages');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const cityName = req.body.name.replace(/ /g, '_'); // Replace spaces with underscores
        console.log("Received cityName:", cityName); // Debugging line
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

router.post('/upload', upload.array('files'), (req, res) => {
    try {
        const cityName = req.body.name.replace(/ /g, '_'); // Replace spaces with underscores
        const isCapital = req.body.capital === 'true'; // Note: req.body.capital will be a string
        console.log(`Received cityName: ${cityName}, isCapital: ${isCapital}`); // Log the city name and capital status
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

module.exports = router;
