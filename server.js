// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
//app.use(express.static('public'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = './uploads';
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            console.error('Error creating uploads directory:', err);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

const DATA_FILE = './data/speakers.json';

// Initialize data file
async function initializeDataFile() {
    try {
        await fs.mkdir('./data', { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            const initialData = [
                {
                    id: 1,
                    name: "Sarah Johnson",
                    title: "CEO & Innovation Strategist",
                    topics: ["Innovation", "Leadership", "Technology"],
                    bio: "Sarah Johnson is a renowned innovation strategist with over 20 years of experience transforming organizations through creative thinking and strategic leadership.",
                    keyTopics: [
                        "Leading Through Digital Transformation",
                        "Building Innovation Cultures",
                        "The Future of Work",
                        "Strategic Leadership in Uncertain Times"
                    ],
                    image: "👤"
                }
            ];
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        }
    } catch (err) {
        console.error('Error initializing data file:', err);
    }
}

// Read speakers
async function readSpeakers() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading speakers:', err);
        return [];
    }
}

// Write speakers
async function writeSpeakers(speakers) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(speakers, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing speakers:', err);
        return false;
    }
}

// API Routes

// Get all speakers
app.get('/api/speakers', async (req, res) => {
    const speakers = await readSpeakers();
    res.json(speakers);
});

// Get single speaker
app.get('/api/speakers/:id', async (req, res) => {
    const speakers = await readSpeakers();
    const speaker = speakers.find(s => s.id === parseInt(req.params.id));
    if (speaker) {
        res.json(speaker);
    } else {
        res.status(404).json({ error: 'Speaker not found' });
    }
});

// Create speaker
app.post('/api/speakers', async (req, res) => {
    const speakers = await readSpeakers();
    const newSpeaker = {
        id: speakers.length > 0 ? Math.max(...speakers.map(s => s.id)) + 1 : 1,
        ...req.body,
        topics: Array.isArray(req.body.topics) ? req.body.topics : [],
        keyTopics: Array.isArray(req.body.keyTopics) ? req.body.keyTopics : []
    };
    speakers.push(newSpeaker);
    const success = await writeSpeakers(speakers);
    if (success) {
        res.status(201).json(newSpeaker);
    } else {
        res.status(500).json({ error: 'Failed to create speaker' });
    }
});

// Update speaker
app.put('/api/speakers/:id', async (req, res) => {
    const speakers = await readSpeakers();
    const index = speakers.findIndex(s => s.id === parseInt(req.params.id));
    if (index !== -1) {
        speakers[index] = {
            ...speakers[index],
            ...req.body,
            id: speakers[index].id,
            topics: Array.isArray(req.body.topics) ? req.body.topics : speakers[index].topics,
            keyTopics: Array.isArray(req.body.keyTopics) ? req.body.keyTopics : speakers[index].keyTopics
        };
        const success = await writeSpeakers(speakers);
        if (success) {
            res.json(speakers[index]);
        } else {
            res.status(500).json({ error: 'Failed to update speaker' });
        }
    } else {
        res.status(404).json({ error: 'Speaker not found' });
    }
});

// Delete speaker
app.delete('/api/speakers/:id', async (req, res) => {
    const speakers = await readSpeakers();
    const filteredSpeakers = speakers.filter(s => s.id !== parseInt(req.params.id));
    if (speakers.length !== filteredSpeakers.length) {
        const success = await writeSpeakers(filteredSpeakers);
        if (success) {
            res.json({ message: 'Speaker deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete speaker' });
        }
    } else {
        res.status(404).json({ error: 'Speaker not found' });
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ 
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename
        });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Initialize and start server
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
        console.log(`Public site: http://localhost:${PORT}`);
    });
});