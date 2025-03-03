const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: { preload, create, update }
  };
  
  const game = new Phaser.Game(config);
  let player, mapTiles, beasts = [], ui;
  
  function preload() {
    this.load.image('forest', 'https://opengameart.org/sites/default/files/forest.png');
    this.load.image('mountain', 'https://opengameart.org/sites/default/files/mountain.png');
    this.load.image('swamp', 'https://opengameart.org/sites/default/files/swamp.png');
  }
  
  function create() {
    mapTiles = this.add.group();
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        let tileType = ['forest', 'mountain', 'swamp'][Math.floor(Math.random() * 3)];
        let tile = this.add.sprite(x * 64, y * 64, tileType).setInteractive();
        tile.on('pointerdown', () => movePlayer(x, y));
        mapTiles.add(tile);
      }
    }
  
    player = { x: 5, y: 5, strength: 10, charm: 10, roster: [], fame: localStorage.getItem('fame') || 0 };
    this.add.rectangle(player.x * 64, player.y * 64, 32, 32, 0x00ff00);
  
    ui = {
      fightBtn: this.add.text(650, 500, 'Fight', { color: '#fff' }).setInteractive(),
      tameBtn: this.add.text(700, 500, 'Tame', { color: '#fff' }).setInteractive()
    };
    ui.fightBtn.on('pointerdown', () => resolveEncounter('fight'));
    ui.tameBtn.on('pointerdown', () => resolveEncounter('tame'));
  }
  
  function update() {
    if (player.x > 9 || player.y > 9) expandMap();
  }
  
  function movePlayer(x, y) {
    player.x = x;
    player.y = y;
    game.scene.scenes[0].children.list.find(c => c.type === 'Rectangle').setPosition(x * 64, y * 64);
  }
  
  async function resolveEncounter(action) {
    const tileBiome = mapTiles.getChildren()[player.y * 10 + player.x].texture.key;
    const response = await fetch(`https://beastbinders-7555f963f9c1.herokuapp.com/generate-beast?biome=${tileBiome}`);
    const beast = await response.json();
  
    if (action === 'fight') {
      if (player.strength > Math.random() * 20) {
        alert(`Defeated ${beast.name}!`);
        player.strength += 1;
      } else {
        alert(`${beast.name} escaped!`);
      }
    } else if (action === 'tame') {
      if (player.charm > Math.random() * 20) {
        player.roster.push(beast);
        alert(`Tamed ${beast.name} (${beast.personality})${beast.rarity === 'shiny' ? ' - Shiny!' : ''}!`);
        player.charm += 1;
        generateBondSeal(beast);
        saveRoster(beast);
      } else {
        alert(`${beast.name} slipped away!`);
      }
    }
  }
  
  function generateBondSeal(beast) {
    const fameBoost = beast.rarity === 'shiny' ? 20 : (beast.rarity === 'rare' ? 10 : 2);
    player.fame = parseInt(player.fame) + fameBoost;
    localStorage.setItem('fame', player.fame);
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
  
  function expandMap() {
    const newBiome = ['forest', 'mountain', 'swamp'][Math.floor(Math.random() * 3)];
    const tile = game.scene.scenes[0].add.sprite((player.x + 1) * 64, player.y * 64, newBiome).setInteractive();
    tile.on('pointerdown', () => movePlayer(player.x + 1, player.y));
    mapTiles.add(tile);
  }
  
  function claimCosmetic(item) {
    if (player.fame >= 50) {
      player.fame -= 50;
      localStorage.setItem('fame', player.fame);
      localStorage.setItem('cosmetic', item);
      alert(`Claimed ${item}!`);
    } else {
      alert('Need more Fame!');
    }
  }