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

const CONTENT_FILE = './data/content.json';

// Initialize content file
async function initializeContentFile() {
    try {
        await fs.mkdir('./data', { recursive: true });
        try {
            await fs.access(CONTENT_FILE);
        } catch {
            const initialContent = {
                en: {
                    navBrand: "Passerelles",
                    navHome: "Home",
                    navPillars: "Pillars",
                    navContact: "Contact",
                    navCTA: "Let's Talk Possibilities",
                    langToggle: "FR",
                    heroSlogan: "Where Creativity Meets Competition.",
                    heroSubtext: "Unleashing the full potential of Art and Sport.",
                    visionTitle: "Why We Exist",
                    visionBody: "We're here to spark **unforgettable collaboration**. We unlock fresh audience engagement, build powerful new revenue streams, and cultivate sustainable careers by bringing the deliberate beauty of Art and the raw energy of Sport together.",
                    convictTitle1: "Challenge the External Frame",
                    convict1: "We demand a change in how society views both the athlete and the artist. Our goal is to unify the perception of both as masters of form, rhythm, and profound intellectual discipline.",
                    convictTitle2: "Break the Internal Limit",
                    convict2: "We empower athletes to redefine their own identity. By highlighting their transferable skills, we shatter the self-imposed limits that restrict their scope of opportunities during and after their primary career.",
                    convictTitle3: "Complete the Room",
                    convict3: "We are strategic network builders, actively identifying and integrating key players—institutions, disciplines, and funding models—that are not currently in the room but are essential for sustainable, large-scale synergy.",
                    pillarTitle: "Our Pillars of Synergy",
                    pillardesc: "We guide our partners and community through a focused, three-step journey to unlock mutual growth and sustainable institutional connections.",
                    p1Title: "The Nexus Lab",
                    p1Desc: "The Nexus Lab is our thought leadership division, dedicated to researching and defining the powerful synergies between artistic mastery and athletic performance.",
                    p2Title: "Transformative Programs",
                    p2Desc: "Transformative Programs delivers our core, scalable services, including specialized workshops and curricula designed to translate conceptual synergy into measurable, durable results.",
                    p3Title: "Strategic Alliances",
                    p3Desc: "The Strategic Alliances pillar is our high-value consulting service, acting as a trusted broker to match major Arts and Sports institutions for impactful, co-branded initiatives.",
                    contactPrompt: "Ready to change the game?",
                    contactCTA: "Let's Talk Possibilities",
                    footerLegal: "© 2024 Passerelles. All Rights Reserved. Bridge the gap. Create the value."
                },
                fr: {
                    navBrand: "Passerelles",
                    navHome: "Accueil",
                    navPillars: "Piliers",
                    navContact: "Contact",
                    navCTA: "Parlons Possibilités",
                    langToggle: "EN",
                    heroSlogan: "Là où la Créativité rencontre la Compétition.",
                    heroSubtext: "Libérez le potentiel illimité de l'Art et du Sport.",
                    visionTitle: "Pourquoi Nous Existons",
                    visionBody: "Notre but est de déclencher des **collaborations inoubliables**. Nous générons un engagement renouvelé du public, créons de puissantes sources de revenus et favorisons le développement de carrières durables en unissant la beauté délibérée de l'Art et l'énergie brute du Sport.",
                    convictTitle1: "Défier le Cadre Externe",
                    convict1: "Nous exigeons un changement dans la façon dont la société perçoit à la fois l'athlète et l'artiste.",
                    convictTitle2: "Briser la Limite Interne",
                    convict2: "Nous donnons aux athlètes les moyens de redéfinir leur propre identité.",
                    convictTitle3: "Compléter la Salle",
                    convict3: "Nous sommes des bâtisseurs de réseaux stratégiques.",
                    pillarTitle: "Nos Piliers de Synergie",
                    pillardesc: "Nous guidons nos partenaires et notre communauté à travers un parcours focalisé en trois étapes.",
                    p1Title: "Le Nexus Lab",
                    p1Desc: "Le Nexus Lab est notre division de leadership éclairé.",
                    p2Title: "Programmes Transformateurs",
                    p2Desc: "Les Programmes Transformateurs offrent nos services de base évolutifs.",
                    p3Title: "Alliances Stratégiques",
                    p3Desc: "Le pilier Alliances Stratégiques est notre service de conseil à haute valeur ajoutée.",
                    contactPrompt: "Prêt à changer la donne ?",
                    contactCTA: "Parlons Possibilités",
                    footerLegal: "© 2024 Passerelles. Tous droits réservés."
                }
            };
            await fs.writeFile(CONTENT_FILE, JSON.stringify(initialContent, null, 2));
        }
    } catch (err) {
        console.error('Error initializing content file:', err);
    }
}

// Read content
async function readContent() {
    try {
        const data = await fs.readFile(CONTENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading content:', err);
        return null;
    }
}

// Write content
async function writeContent(content) {
    try {
        await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing content:', err);
        return false;
    }
}

// Content API Routes

// Get all content
app.get('/api/content', async (req, res) => {
    const content = await readContent();
    if (content) {
        res.json(content);
    } else {
        res.status(500).json({ error: 'Failed to read content' });
    }
});

// Update content
app.put('/api/content', async (req, res) => {
    const success = await writeContent(req.body);
    if (success) {
        res.json({ message: 'Content updated successfully', content: req.body });
    } else {
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// Initialize and start server
Promise.all([initializeDataFile(), initializeContentFile()]).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin`);
        console.log(`Public site: http://localhost:${PORT}`);
    });
});;