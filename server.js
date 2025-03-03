const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

// Allow CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

const db = new sqlite3.Database(':memory:');
db.run('CREATE TABLE roster (id TEXT, beast TEXT)');

async function generateBeast(biome) {
    const adjectives = ['Fierce', 'Mystic', 'Shadow', 'Glimmer', 'Ancient'];
    const nouns = ['Wyrm', 'Griffin', 'Serpent', 'Stag', 'Raven'];
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    const isShiny = Math.random() < 0.01;
    const visuals = {
      forest: 'https://opengameart.org/sites/default/files/monster_forest.png',
      mountain: 'https://opengameart.org/sites/default/files/monster_mountain.png',
      swamp: 'https://opengameart.org/sites/default/files/monster_swamp.png',
      'shiny-forest': 'https://opengameart.org/sites/default/files/monster_forest_shiny.png',
      'shiny-mountain': 'https://opengameart.org/sites/default/files/monster_mountain_shiny.png',
      'shiny-swamp': 'https://opengameart.org/sites/default/files/monster_swamp_shiny.png'
    };
    const beast = {
      name: `${name}_${Math.random().toString(36).slice(2, 7)}`, // Unique suffix
      visual: visuals[isShiny ? `shiny-${biome}` : biome] || visuals[biome],
      personality: ['Loyal', 'Mischievous', 'Stoic', 'Cunning'][Math.floor(Math.random() * 4)],
      biome,
      rarity: isShiny ? 'shiny' : (Math.random() < 0.1 ? 'rare' : 'common'),
      traits: {
        color: ['Red', 'Blue', 'Green', 'Black'][Math.floor(Math.random() * 4)],
        size: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)]
      }
    };
    return beast;
  }

app.post('/save-roster', (req, res) => {
  const { playerId, beast } = req.body;
  db.run('INSERT INTO roster (id, beast) VALUES (?, ?)', [playerId, JSON.stringify(beast)]);
  res.sendStatus(200);
});

// Use Heroku's port or 3000 locally
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));