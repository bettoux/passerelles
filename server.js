// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

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
    limits: { fileSize: 5 * 1024 * 1024 },
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
const CONTENT_FILE = './data/content.json';

// Initialize speakers data file
async function initializeDataFile() {
    try {
        await fs.mkdir('./data', { recursive: true });
        console.log('✅ Data directory created/verified');
        
        try {
            await fs.access(DATA_FILE);
            console.log('✅ Speakers file exists');
        } catch {
            console.log('📝 Creating initial speakers file...');
            const initialData = [
                {
                    id: 1,
                    name: "Sarah Johnson",
                    title: "CEO & Innovation Strategist",
                    topics: ["Innovation", "Leadership", "Technology"],
                    bio: "Sarah Johnson is a renowned innovation strategist with over 20 years of experience.",
                    keyTopics: [
                        "Leading Through Digital Transformation",
                        "Building Innovation Cultures"
                    ],
                    image: "👤"
                }
            ];
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
            console.log('✅ Initial speakers file created');
        }
    } catch (err) {
        console.error('❌ Error initializing speakers file:', err);
    }
}

// Initialize content file
async function initializeContentFile() {
    try {
        await fs.mkdir('./data', { recursive: true });
        console.log('✅ Data directory created/verified');
        
        try {
            await fs.access(CONTENT_FILE);
            console.log('✅ Content file exists');
        } catch {
            console.log('📝 Creating initial content file...');
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
                    visionBody: "We're here to spark **unforgettable collaboration**.",
                    convictTitle1: "Challenge the External Frame",
                    convict1: "We demand a change in how society views both the athlete and the artist.",
                    convictTitle2: "Break the Internal Limit",
                    convict2: "We empower athletes to redefine their own identity.",
                    convictTitle3: "Complete the Room",
                    convict3: "We are strategic network builders.",
                    pillarTitle: "Our Pillars of Synergy",
                    pillardesc: "We guide our partners and community through a focused, three-step journey.",
                    p1Title: "The Nexus Lab",
                    p1Desc: "The Nexus Lab is our thought leadership division.",
                    p2Title: "Transformative Programs",
                    p2Desc: "Transformative Programs delivers our core, scalable services.",
                    p3Title: "Strategic Alliances",
                    p3Desc: "The Strategic Alliances pillar is our high-value consulting service.",
                    contactPrompt: "Ready to change the game?",
                    contactCTA: "Let's Talk Possibilities",
                    footerLegal: "© 2024 Passerelles. All Rights Reserved."
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
                    visionBody: "Notre but est de déclencher des **collaborations inoubliables**.",
                    convictTitle1: "Défier le Cadre Externe",
                    convict1: "Nous exigeons un changement.",
                    convictTitle2: "Briser la Limite Interne",
                    convict2: "Nous donnons aux athlètes les moyens de redéfinir leur propre identité.",
                    convictTitle3: "Compléter la Salle",
                    convict3: "Nous sommes des bâtisseurs de réseaux stratégiques.",
                    pillarTitle: "Nos Piliers de Synergie",
                    pillardesc: "Nous guidons nos partenaires.",
                    p1Title: "Le Nexus Lab",
                    p1Desc: "Le Nexus Lab est notre division de leadership éclairé.",
                    p2Title: "Programmes Transformateurs",
                    p2Desc: "Les Programmes Transformateurs offrent nos services.",
                    p3Title: "Alliances Stratégiques",
                    p3Desc: "Le pilier Alliances Stratégiques est notre service de conseil.",
                    contactPrompt: "Prêt à changer la donne ?",
                    contactCTA: "Parlons Possibilités",
                    footerLegal: "© 2024 Passerelles. Tous droits réservés."
                }
            };
            await fs.writeFile(CONTENT_FILE, JSON.stringify(initialContent, null, 2));
            console.log('✅ Initial content file created at:', CONTENT_FILE);
        }
    } catch (err) {
        console.error('❌ Error initializing content file:', err);
    }
}

// Read speakers
/*async function readSpeakers() {
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
}*/

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
        console.log('✅ Content written to file successfully');
        return true;
    } catch (err) {
        console.error('❌ Error writing content:', err);
        return false;
    }
}

// SPEAKERS API ROUTES
/*app.get('/api/speakers', async (req, res) => {
    const speakers = await readSpeakers();
    res.json(speakers);
});

app.get('/api/speakers/:id', async (req, res) => {
    const speakers = await readSpeakers();
    const speaker = speakers.find(s => s.id === parseInt(req.params.id));
    if (speaker) {
        res.json(speaker);
    } else {
        res.status(404).json({ error: 'Speaker not found' });
    }
});

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
});*/

// CONTENT API ROUTES
app.get('/api/content', async (req, res) => {
    console.log('📡 GET /api/content request received');
    const content = await readContent();
    if (content) {
        console.log('✅ Sending content to client');
        res.json(content);
    } else {
        console.error('❌ Failed to read content');
        res.status(500).json({ error: 'Failed to read content' });
    }
});

// Update content
app.post('/api/save-content', (req, res) => {
    const newContent = req.body;
    fs.writeFile('./data/content.json', JSON.stringify(newContent, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ message: 'Failed to save content' });
        }
        res.json({ message: 'Content saved successfully' });
    });
});

/*app.put('/api/content', async (req, res) => {
    console.log('📡 PUT /api/content request received');
    console.log('📦 Request body keys:', Object.keys(req.body));
    
    const success = await writeContent(req.body);
    if (success) {
        console.log('✅ Content update successful');
        res.json({ message: 'Content updated successfully', content: req.body });
    } else {
        console.error('❌ Content update failed');
        res.status(500).json({ error: 'Failed to update content' });
    }
});*/

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

// Initialize and start server
Promise.all([initializeDataFile(), initializeContentFile()]).then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📋 Admin panel: http://localhost:${PORT}/admin.html`);
        console.log(`🌐 Public site: http://localhost:${PORT}/index.html`);
        console.log(`📁 Content file: ${path.resolve(CONTENT_FILE)}`);
        console.log(`📁 Speakers file: ${path.resolve(DATA_FILE)}\n`);
    });
});

