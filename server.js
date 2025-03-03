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
  const basePrompt = `${biome}-dwelling mythical beast`;
  const isShiny = Math.random() < 0.01;
  const beast = {
    name: `Beast_${Math.random().toString(36).slice(2, 7)}`,
    visual: isShiny ? `shiny-${biome}-beast.png` : `${biome}-beast.png`,
    personality: ['Loyal', 'Mischievous', 'Stoic', 'Cunning'][Math.floor(Math.random() * 4)],
    biome,
    rarity: isShiny ? 'shiny' : (Math.random() < 0.1 ? 'rare' : 'common')
  };
  return beast;
}

app.get('/generate-beast', async (req, res) => {
  const beast = await generateBeast(req.query.biome);
  res.json(beast);
});

app.post('/save-roster', (req, res) => {
  const { playerId, beast } = req.body;
  db.run('INSERT INTO roster (id, beast) VALUES (?, ?)', [playerId, JSON.stringify(beast)]);
  res.sendStatus(200);
});

// Use Heroku's port or 3000 locally
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));