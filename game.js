const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: { preload, create, update }
  };
  
  const game = new Phaser.Game(config);
  let player, mapTiles, currentBeastSprite, worldMap = {}, encounterCooldown = 0;
  
  function preload() {
    this.load.image('forest', 'https://opengameart.org/sites/default/files/forest.png');
    this.load.image('mountain', 'https://opengameart.org/sites/default/files/mountain.png');
    this.load.image('swamp', 'https://opengameart.org/sites/default/files/swamp.png');
    this.load.image('monster_forest', 'https://opengameart.org/sites/default/files/monster_forest.png');
    this.load.image('monster_mountain', 'https://opengameart.org/sites/default/files/monster_mountain.png');
    this.load.image('monster_swamp', 'https://opengameart.org/sites/default/files/monster_swamp.png');
    this.load.image('monster_forest_shiny', 'https://opengameart.org/sites/default/files/monster_forest_shiny.png');
    this.load.image('monster_mountain_shiny', 'https://opengameart.org/sites/default/files/monster_mountain_shiny.png');
    this.load.image('monster_swamp_shiny', 'https://opengameart.org/sites/default/files/monster_swamp_shiny.png');
    this.load.image('hat', 'https://opengameart.org/sites/default/files/hat.png');
    this.load.image('vest', 'https://opengameart.org/sites/default/files/vest.png');
  }
  
  function create() {
    mapTiles = this.add.group();
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        let tileType = ['forest', 'mountain', 'swamp'][Math.floor(Math.random() * 3)];
        worldMap[`${x},${y}`] = tileType;
        let tile = this.add.sprite(x * 64, y * 64, tileType);
        mapTiles.add(tile);
      }
    }
  
    player = { x: 5, y: 5, strength: 10, charm: 10, roster: [], fame: localStorage.getItem('fame') || 0, cosmetic: localStorage.getItem('cosmetic') || '' };
    this.playerSprite = this.add.sprite(player.x * 64, player.y * 64, player.cosmetic || 'hat').setScale(0.5);
    this.playerSprite.depth = 1;
  
    document.getElementById('fame-value').innerText = player.fame;
    fetch('https://beastbinders-7555f963f9c1.herokuapp.com/get-roster?playerId=player123')
      .then(res => res.json())
      .then(data => {
        player.roster = data;
        updateRosterUI();
      });
  
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
  }
  
  function update() {
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      movePlayer(player.x - 1, player.y);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      movePlayer(player.x + 1, player.y);
    } else if (this.cursors.up.isDown || this.keys.W.isDown) {
      movePlayer(player.x, player.y - 1);
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      movePlayer(player.x, player.y + 1);
    }
  
    if (encounterCooldown <= 0 && Math.random() < 0.05) {
      resolveEncounter('prompt');
      encounterCooldown = 60;
    } else if (encounterCooldown > 0) {
      encounterCooldown--;
    }
  }
  
  function movePlayer(x, y) {
    expandMap(x, y);
    player.x = x;
    player.y = y;
    this.playerSprite.setPosition(x * 64, y * 64);
  }
  
  function expandMap(x, y) {
    if (!worldMap[`${x},${y}`]) {
      const newBiome = ['forest', 'mountain', 'swamp'][Math.floor(Math.random() * 3)];
      worldMap[`${x},${y}`] = newBiome;
      const tile = this.add.sprite(x * 64, y * 64, newBiome);
      mapTiles.add(tile);
    }
  }
  
  async function resolveEncounter(action) {
    const tileBiome = worldMap[`${player.x},${player.y}`] || 'forest'; // Fallback
    const response = await fetch(`https://beastbinders-7555f963f9c1.herokuapp.com/generate-beast?biome=${tileBiome}`);
    const beast = await response.json();
  
    if (currentBeastSprite) currentBeastSprite.destroy();
    currentBeastSprite = game.scene.scenes[0].add.sprite(400, 300, `monster_${beast.visual.split('/').pop().split('.')[0]}`).setScale(2);
  
    if (action === 'prompt') {
      const choice = prompt(`A wild ${beast.name} (${beast.traits.color}, ${beast.traits.size}) appears! Fight or Tame? (f/t)`);
      if (choice.toLowerCase() === 'f') action = 'fight';
      else if (choice.toLowerCase() === 't') action = 'tame';
      else {
        currentBeastSprite.destroy();
        return;
      }
    }
  
    if (action === 'fight') {
      if (player.strength > Math.random() * 20) {
        alert(`Defeated ${beast.name}!`);
        player.strength += 1;
        currentBeastSprite.destroy();
      } else {
        alert(`${beast.name} escaped!`);
        currentBeastSprite.destroy();
      }
    } else if (action === 'tame') {
      if (player.charm > Math.random() * 20) {
        player.roster.push(beast);
        alert(`Tamed ${beast.name} (${beast.personality})${beast.rarity === 'shiny' ? ' - Shiny!' : ''}!`);
        player.charm += 1;
        generateBondSeal(beast);
        saveRoster(beast);
        updateRosterUI();
        currentBeastSprite.destroy();
      } else {
        alert(`${beast.name} slipped away!`);
        currentBeastSprite.destroy();
      }
    }
  }
  
  function generateBondSeal(beast) {
    const fameBoost = beast.rarity === 'shiny' ? 20 : (beast.rarity === 'rare' ? 10 : 2);
    player.fame = parseInt(player.fame) + fameBoost;
    localStorage.setItem('fame', player.fame);
    document.getElementById('fame-value').innerText = player.fame;
    const tweet = `Tamed ${beast.name} (${beast.personality})${beast.rarity === 'shiny' ? ' - Shiny!' : ''} in Beast Binders! #BeastBinders`;
    alert(`Copy to X: ${tweet}`);
  }
  
  function saveRoster(beast) {
    fetch('https://beastbinders-7555f963f9c1.herokuapp.com/save-roster', {
      method: 'POST',
      body: JSON.stringify({ playerId: 'player123', beast }),
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  function updateRosterUI() {
    document.getElementById('roster-list').innerHTML = player.roster.map(b => 
      `<li class="${b.rarity === 'shiny' ? 'shiny' : ''}">${b.name} (${b.personality})${b.rarity === 'shiny' ? ' - Shiny' : ''}</li>`
    ).join('');
  }
  
  function claimCosmetic(item) {
    if (player.fame >= 50) {
      player.fame -= 50;
      localStorage.setItem('fame', player.fame);
      document.getElementById('fame-value').innerText = player.fame;
      player.cosmetic = item.toLowerCase().includes('hat') ? 'hat' : 'vest';
      localStorage.setItem('cosmetic', player.cosmetic);
      game.scene.scenes[0].playerSprite.setTexture(player.cosmetic);
      alert(`Equipped ${item}!`);
    } else {
      alert('Need more Fame!');
    }
  }