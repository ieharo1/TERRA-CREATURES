/**
 * TerraCreatures - RPG 8-Bit Game
 * Vanilla JavaScript implementation
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
    // Nature
    grass: '#78c850',
    grassDark: '#5ea040',
    water: '#6890f0',
    waterDark: '#445e91',
    sand: '#f8d030',
    rock: '#a8a878',
    tree: '#2d4d22',
    
    // UI & General
    darkest: '#000000',
    dark: '#555555',
    light: '#aaaaaa',
    lightest: '#ffffff',
    
    // Battle specific
    hpGreen: '#78c850',
    hpYellow: '#f8d030',
    hpRed: '#f08030',
    
    // Branding
    red: '#ff0000',
    blue: '#0000ff'
};

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

const TILE_TYPES = {
    GRASS: 0,
    FLOOR: 1,
    WALL: 2,
    WATER: 3
};

const GAME_STATES = {
    EXPLORATION: 'exploration',
    BATTLE: 'battle',
    DIALOGUE: 'dialogue',
    MENU: 'menu'
};

const DIRECTIONS = {
    DOWN: 0,
    UP: 1,
    LEFT: 2,
    RIGHT: 3
};

// ═══════════════════════════════════════════════════════════════════════════
// CREATURE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const CREATURE_DATA = [
    { name: 'Flameling', type: 'fire', atk: 12, hp: 35, color: '#ff6b35' },
    { name: 'Aquapup', type: 'water', atk: 10, hp: 40, color: '#4ecdc4' },
    { name: 'Leafling', type: 'grass', atk: 9, hp: 45, color: '#95d13c' },
    { name: 'Rockling', type: 'rock', atk: 14, hp: 30, color: '#8b7355' },
    { name: 'Sparkit', type: 'electric', atk: 11, hp: 38, color: '#ffd93d' },
    { name: 'Shadewisp', type: 'ghost', atk: 13, hp: 32, color: '#6c5ce7' }
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAP CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.encounterZones = [];
        this.generateMap();
    }

    generateMap() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.tiles[y][x] = TILE_TYPES.WALL;
                } else {
                    this.tiles[y][x] = TILE_TYPES.GRASS;
                }
            }
        }

        for (let i = 0; i < 15; i++) {
            const cx = random(3, this.width - 4);
            const cy = random(3, this.height - 4);
            const radius = random(1, 2);
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    if (tx > 2 && tx < this.width - 3 && ty > 2 && ty < this.height - 3) {
                        this.tiles[ty][tx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        for (let i = 0; i < 3; i++) {
            const cx = random(4, this.width - 5);
            const cy = random(4, this.height - 5);
            
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    if (tx > 2 && tx < this.width - 4 && ty > 2 && ty < this.height - 4) {
                        this.tiles[ty][tx] = TILE_TYPES.WATER;
                    }
                }
            }
        }

        this.updateEncounterZones();
    }

    updateEncounterZones() {
        this.encounterZones = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === TILE_TYPES.GRASS) {
                    this.encounterZones.push({ x, y });
                }
            }
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const tile = this.tiles[y][x];
        return tile === TILE_TYPES.GRASS || tile === TILE_TYPES.FLOOR;
    }

    isGrass(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.tiles[y][x] === TILE_TYPES.GRASS;
    }

    getTileColor(tileType) {
        switch (tileType) {
            case TILE_TYPES.GRASS: return COLORS.grass;
            case TILE_TYPES.FLOOR: return COLORS.sand;
            case TILE_TYPES.WALL: return COLORS.tree;
            case TILE_TYPES.WATER: return COLORS.water;
            default: return COLORS.light;
        }
    }

    render(ctx, cameraX, cameraY) {
        const startX = Math.floor(cameraX / TILE_SIZE);
        const startY = Math.floor(cameraY / TILE_SIZE);
        const endX = Math.min(startX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1, this.width);
        const endY = Math.min(startY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1, this.height);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                const screenX = x * TILE_SIZE - cameraX;
                const screenY = y * TILE_SIZE - cameraY;

                ctx.fillStyle = this.getTileColor(tile);
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                if (tile === TILE_TYPES.GRASS) {
                    this.renderGrassDetail(ctx, screenX, screenY);
                } else if (tile === TILE_TYPES.WATER) {
                    this.renderWaterDetail(ctx, screenX, screenY);
                } else if (tile === TILE_TYPES.FLOOR) {
                    this.renderFloorDetail(ctx, screenX, screenY);
                }
            }
        }
    }

    renderGrassDetail(ctx, x, y) {
        ctx.fillStyle = COLORS.grassDark;
        const seed = (x * 7 + y * 13) % 10;
        // Draw small grass tufts
        ctx.fillRect(x + 8, y + 10, 2, 6);
        ctx.fillRect(x + 6, y + 12, 2, 4);
        ctx.fillRect(x + 22, y + 18, 2, 6);
        ctx.fillRect(x + 20, y + 20, 2, 4);
    }

    renderWaterDetail(ctx, x, y) {
        ctx.fillStyle = COLORS.lightest;
        ctx.globalAlpha = 0.4;
        const waveOffset = (Date.now() / 600 + x + y) % 12;
        ctx.fillRect(x + waveOffset, y + 10, 10, 2);
        ctx.fillRect(x + 16 - waveOffset, y + 22, 10, 2);
        ctx.globalAlpha = 1.0;
    }

    renderFloorDetail(ctx, x, y) {
        ctx.fillStyle = COLORS.grass;
        // Small pebbles or dirt spots
        ctx.fillRect(x + 4, y + 6, 2, 2);
        ctx.fillRect(x + 24, y + 14, 2, 2);
        ctx.fillRect(x + 12, y + 26, 2, 2);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATURE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Creature {
    constructor(data) {
        this.name = data.name;
        this.type = data.type;
        this.baseAtk = data.atk;
        this.maxHp = data.hp;
        this.currentHp = data.hp;
        this.color = data.color;
        this.level = 1;
    }

    get atk() {
        return this.baseAtk + Math.floor(this.level * 0.5);
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        return this.currentHp;
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }

    isAlive() {
        return this.currentHp > 0;
    }

    getHpPercent() {
        return this.currentHp / this.maxHp;
    }

    clone() {
        const c = new Creature({
            name: this.name,
            type: this.type,
            atk: this.baseAtk,
            hp: this.maxHp
        });
        c.currentHp = this.currentHp;
        c.level = this.level;
        return c;
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            baseAtk: this.baseAtk,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            color: this.color,
            level: this.level
        };
    }

    static fromJSON(data) {
        const c = new Creature({
            name: data.name,
            type: data.type,
            atk: data.baseAtk,
            hp: data.maxHp
        });
        c.currentHp = data.currentHp;
        c.level = data.level;
        return c;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = DIRECTIONS.DOWN;
        this.isMoving = false;
        this.moveProgress = 0;
        this.targetX = x;
        this.targetY = y;
        this.maxHp = 100;
        this.currentHp = 100;
        this.level = 1;
        this.exp = 0;
        this.walkFrame = 0;
        this.lastWalkTime = 0;
    }

    get renderX() {
        if (this.isMoving) {
            return lerp(this.x * TILE_SIZE, this.targetX * TILE_SIZE, this.moveProgress);
        }
        return this.x * TILE_SIZE;
    }

    get renderY() {
        if (this.isMoving) {
            return lerp(this.y * TILE_SIZE, this.targetY * TILE_SIZE, this.moveProgress);
        }
        return this.y * TILE_SIZE;
    }

    move(dx, dy, map) {
        if (this.isMoving) return false;

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (!map.isWalkable(newX, newY)) return false;

        if (dy < 0) this.direction = DIRECTIONS.UP;
        else if (dy > 0) this.direction = DIRECTIONS.DOWN;
        else if (dx < 0) this.direction = DIRECTIONS.LEFT;
        else if (dx > 0) this.direction = DIRECTIONS.RIGHT;

        this.targetX = newX;
        this.targetY = newY;
        this.isMoving = true;
        this.moveProgress = 0;

        return true;
    }

    update(deltaTime) {
        if (this.isMoving) {
            this.moveProgress += deltaTime * 8;
            
            if (this.moveProgress >= 1) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.moveProgress = 0;
                return true;
            }
        }

        const now = Date.now();
        if (now - this.lastWalkTime > 150) {
            this.walkFrame = (this.walkFrame + 1) % 2;
            this.lastWalkTime = now;
        }

        return false;
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    }

    getHpPercent() {
        return this.currentHp / this.maxHp;
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.level * 50) {
            this.level++;
            this.exp = 0;
            this.maxHp += 10;
            this.currentHp = this.maxHp;
            return true;
        }
        return false;
    }

    render(ctx, cameraX, cameraY) {
        const x = this.renderX - cameraX;
        const y = this.renderY - cameraY;
        const skin = '#ffdbac';
        const shirt = '#3d7dca';
        const pants = '#333333';
        const shoes = '#552200';
        const outline = '#000000';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 28, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const bounce = this.isMoving ? Math.abs(Math.sin(this.moveProgress * Math.PI)) * 2 : 0;
        const renderY = y - bounce;

        // Draw character with outline
        ctx.fillStyle = outline;
        // Head outline
        ctx.fillRect(x + 9, renderY + 3, 14, 12);
        // Body outline
        ctx.fillRect(x + 7, renderY + 13, 18, 12);
        // Arms outline
        if (this.isMoving) {
            const armSwing = Math.sin(this.moveProgress * Math.PI) * 4;
            ctx.fillRect(x + 3, renderY + 13 + armSwing, 6, 8);
            ctx.fillRect(x + 23, renderY + 13 - armSwing, 6, 8);
        } else {
            ctx.fillRect(x + 3, renderY + 13, 6, 10);
            ctx.fillRect(x + 23, renderY + 13, 6, 10);
        }
        // Legs outline
        ctx.fillRect(x + 7, renderY + 23, 18, 10);

        // Head (Bald)
        ctx.fillStyle = skin;
        ctx.fillRect(x + 10, renderY + 4, 12, 10); // Face/Head
        
        // Eyes
        ctx.fillStyle = COLORS.darkest;
        if (this.direction === DIRECTIONS.DOWN) {
            ctx.fillRect(x + 12, renderY + 9, 2, 2);
            ctx.fillRect(x + 18, renderY + 9, 2, 2);
        } else if (this.direction === DIRECTIONS.UP) {
            // No eyes visible from back
        } else if (this.direction === DIRECTIONS.LEFT) {
            ctx.fillRect(x + 10, renderY + 9, 2, 2);
        } else if (this.direction === DIRECTIONS.RIGHT) {
            ctx.fillRect(x + 20, renderY + 9, 2, 2);
        }

        // Body/Shirt
        ctx.fillStyle = shirt;
        ctx.fillRect(x + 8, renderY + 14, 16, 10);
        
        // Arms
        ctx.fillStyle = skin;
        if (this.isMoving) {
            const armSwing = Math.sin(this.moveProgress * Math.PI) * 4;
            ctx.fillRect(x + 4, renderY + 14 + armSwing, 4, 6);
            ctx.fillRect(x + 24, renderY + 14 - armSwing, 4, 6);
        } else {
            ctx.fillRect(x + 4, renderY + 14, 4, 8);
            ctx.fillRect(x + 24, renderY + 14, 4, 8);
        }

        // Pants
        ctx.fillStyle = pants;
        ctx.fillRect(x + 8, renderY + 24, 7, 6);
        ctx.fillRect(x + 17, renderY + 24, 7, 6);

        // Shoes
        ctx.fillStyle = shoes;
        const legOffset = this.isMoving ? (this.walkFrame === 0 ? 3 : -3) : 0;
        ctx.fillRect(x + 8, renderY + 29 + (this.isMoving ? legOffset : 0), 7, 3);
        ctx.fillRect(x + 17, renderY + 29 + (this.isMoving ? -legOffset : 0), 7, 3);
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            level: this.level,
            exp: this.exp,
            direction: this.direction
        };
    }

    static fromJSON(data) {
        const p = new Player(data.x, data.y);
        p.maxHp = data.maxHp;
        p.currentHp = data.currentHp;
        p.level = data.level;
        p.exp = data.exp;
        p.direction = data.direction;
        return p;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Inventory {
    constructor() {
        this.creatures = [];
        this.maxSlots = 6;
    }

    addCreature(creature) {
        if (this.creatures.length >= this.maxSlots) {
            return false;
        }
        this.creatures.push(creature);
        return true;
    }

    removeCreature(index) {
        if (index >= 0 && index < this.creatures.length) {
            return this.creatures.splice(index, 1)[0];
        }
        return null;
    }

    getCreature(index) {
        return this.creatures[index] || null;
    }

    hasCreatures() {
        return this.creatures.length > 0;
    }

    get firstCreature() {
        return this.creatures[0];
    }

    toJSON() {
        return {
            creatures: this.creatures.map(c => c.toJSON())
        };
    }

    static fromJSON(data) {
        const inv = new Inventory();
        if (data && data.creatures) {
            inv.creatures = data.creatures.map(c => Creature.fromJSON(c));
        }
        return inv;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENCOUNTER SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EncounterSystem {
    constructor(map) {
        this.map = map;
        this.encounterChance = 0.15;
    }

    checkEncounter(player) {
        if (!this.map.isGrass(player.x, player.y)) return null;
        
        if (Math.random() < this.encounterChance) {
            return this.generateWildCreature();
        }
        return null;
    }

    generateWildCreature() {
        const data = CREATURE_DATA[random(0, CREATURE_DATA.length - 1)];
        const creature = new Creature(data);
        creature.level = random(1, 3);
        creature.currentHp = creature.maxHp;
        return creature;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BATTLE SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BattleSystem {
    constructor() {
        this.player = null;
        this.enemy = null;
        this.playerCreature = null;
        this.turn = 'player';
        this.battleLog = [];
        this.state = 'select';
        this.animationProgress = 0;
        this.damageFlash = 0;
    }

    startBattle(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        this.playerCreature = player.inventory.firstCreature || null;
        this.turn = 'player';
        this.battleLog = [];
        this.state = 'select';
        this.addLog(`¡Un ${enemy.name} salvaje apareció!`);
    }

    addLog(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 4) {
            this.battleLog.shift();
        }
    }

    playerAttack() {
        if (this.state !== 'select' || this.turn !== 'player') return;
        
        const damage = this.calculateDamage(this.player, this.enemy);
        this.enemy.takeDamage(damage);
        
        this.addLog(`¡Atacas! Daño: ${damage}`);
        this.damageFlash = 1;

        if (!this.enemy.isAlive()) {
            this.endBattle('win');
        } else {
            this.turn = 'enemy';
            this.scheduleEnemyTurn();
        }
    }

    scheduleEnemyTurn() {
        this.state = 'animating';
        setTimeout(() => {
            this.enemyAttack();
        }, 1000);
    }

    enemyAttack() {
        const damage = this.calculateDamage(this.enemy, this.player);
        this.player.takeDamage(damage);
        
        this.addLog(`¡${this.enemy.name} ataca! Daño: ${damage}`);
        this.damageFlash = 1;

        if (this.player.currentHp <= 0) {
            this.endBattle('lose');
        } else {
            this.turn = 'player';
            this.state = 'select';
        }
    }

    calculateDamage(attacker, defender) {
        const base = attacker.atk || attacker.baseAtk;
        return Math.max(1, base + random(-2, 4));
    }

    capture() {
        if (this.state !== 'select' || this.turn !== 'player') return;

        const maxHp = this.enemy.maxHp;
        const currentHp = this.enemy.currentHp;
        const hpPercent = currentHp / maxHp;
        
        const chance = (1 - hpPercent) * 0.7 + 0.1;

        if (Math.random() < chance) {
            const captured = this.enemy.clone();
            if (this.player.inventory.addCreature(captured)) {
                this.addLog(`¡Capturaste a ${captured.name}!`);
                this.endBattle('captured');
            } else {
                this.addLog('¡Inventario lleno!');
                this.enemyAttack();
            }
        } else {
            this.addLog('¡Falló la captura!');
            this.turn = 'enemy';
            this.scheduleEnemyTurn();
        }
    }

    run() {
        if (this.state !== 'select' || this.turn !== 'player') return;

        if (Math.random() < 0.7) {
            this.addLog('¡Escapaste!');
            this.endBattle('run');
        } else {
            this.addLog('¡No puedes escapar!');
            this.turn = 'enemy';
            this.scheduleEnemyTurn();
        }
    }

    endBattle(result) {
        this.state = 'end';
        
        if (result === 'win') {
            const exp = this.enemy.level * 20;
            this.addLog(`¡Ganaste! +${exp} EXP`);
            if (this.player.gainExp(exp)) {
                this.addLog('¡Subiste de nivel!');
            }
        } else if (result === 'lose') {
            this.addLog('¡Perdiste! HP restaurado...');
            this.player.heal(this.player.maxHp);
        }

        setTimeout(() => {
            this.onBattleEnd(result);
        }, 1500);
    }

    onBattleEnd = null;

    render(ctx) {
        // Battle Background
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Clouds/Scenery
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(100, 40, 150, 40);
        ctx.fillRect(400, 80, 120, 30);
        
        // Ground circles
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath();
        ctx.ellipse(150, 240, 100, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(480, 140, 100, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        this.renderCreature(ctx, this.enemy, 440, 60, 1.8, this.damageFlash > 0);

        if (this.playerCreature) {
            this.renderCreature(ctx, this.playerCreature, 100, 160, 2.0, false);
        } else {
            // If no creature, render the bald protagonist from back
            this.renderPlayerBack(ctx, 100, 160);
        }

        this.renderHpBar(ctx, this.player, 50, 30, 'JUGADOR');
        this.renderHpBar(ctx, this.enemy, 380, 210, this.enemy.name);

        this.renderBattleLog(ctx);
        this.renderActionMenu(ctx);

        if (this.damageFlash > 0) {
            this.damageFlash -= 0.1;
        }
    }

    renderPlayerBack(ctx, x, y) {
        const skin = '#ffdbac';
        const shirt = '#3d7dca';
        const shirtDark = '#2a558e';
        const backpack = '#8b4513';
        
        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x + 32, y + 80, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 18, y - 2, 28, 28); // Head outline
        ctx.fillRect(x - 2, y + 22, 68, 44); // Body outline

        // Head (Bald)
        ctx.fillStyle = skin;
        ctx.fillRect(x + 20, y, 24, 24);
        
        // Shirt (Back)
        ctx.fillStyle = shirt;
        ctx.fillRect(x, y + 24, 64, 40);
        
        // Shading on shirt
        ctx.fillStyle = shirtDark;
        ctx.fillRect(x, y + 54, 64, 10);
        
        // Backpack
        ctx.fillStyle = backpack;
        ctx.fillRect(x + 12, y + 30, 40, 25);
        ctx.fillStyle = '#5d2e0d';
        ctx.fillRect(x + 15, y + 45, 34, 5);
    }

    renderCreature(ctx, creature, x, y, scale, flash) {
        const size = 32 * scale;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(size/2, size + 10, size/2, size/6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (flash) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -2, size + 4, size + 4);
            ctx.restore();
            return;
        }

        // Outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(-2, size * 0.18, size + 4, size * 0.74);
        ctx.fillRect(size * 0.08, -2, size * 0.84, size * 0.44);

        // Body
        ctx.fillStyle = creature.color;
        ctx.fillRect(0, size * 0.2, size, size * 0.7);
        // Head
        ctx.fillRect(size * 0.1, 0, size * 0.8, size * 0.4);
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(size * 0.2, size * 0.1, size * 0.2, size * 0.15);
        ctx.fillRect(size * 0.6, size * 0.1, size * 0.2, size * 0.15);
        ctx.fillStyle = '#000000';
        ctx.fillRect(size * 0.25, size * 0.12, size * 0.1, size * 0.1);
        ctx.fillRect(size * 0.65, size * 0.12, size * 0.1, size * 0.1);

        // Belly/Detail
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(size * 0.2, size * 0.4, size * 0.6, size * 0.4);

        ctx.restore();
    }

    renderHpBar(ctx, entity, x, y, label) {
        const barWidth = 180;
        const barHeight = 12;

        // Box
        ctx.fillStyle = COLORS.lightest;
        ctx.fillRect(x - 5, y - 5, barWidth + 20, 45);
        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 5, y - 5, barWidth + 20, 45);

        // Label & Level
        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 16px "Courier New"';
        ctx.fillText(label.toUpperCase(), x, y + 12);
        
        ctx.font = '12px "Courier New"';
        const hpText = `${Math.ceil(entity.currentHp)}/${entity.maxHp}`;
        ctx.fillText(hpText, x + barWidth - 30, y + 36);

        // HP Background
        ctx.fillStyle = COLORS.dark;
        ctx.fillRect(x, y + 18, barWidth, barHeight);

        const hpPercent = entity.getHpPercent();
        const fillWidth = (barWidth - 4) * hpPercent;
        
        // HP Color
        if (hpPercent > 0.5) ctx.fillStyle = COLORS.hpGreen;
        else if (hpPercent > 0.2) ctx.fillStyle = COLORS.hpYellow;
        else ctx.fillStyle = COLORS.hpRed;
        
        ctx.fillRect(x + 2, y + 20, fillWidth, barHeight - 4);

        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y + 18, barWidth, barHeight);
    }

    renderBattleLog(ctx) {
        const boxY = CANVAS_HEIGHT - 100;
        
        ctx.fillStyle = COLORS.lightest;
        ctx.fillRect(5, boxY, CANVAS_WIDTH - 10, 95);
        
        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 4;
        ctx.strokeRect(5, boxY, CANVAS_WIDTH - 10, 95);

        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 18px "Courier New"';
        
        this.battleLog.slice(-3).forEach((log, i) => {
            ctx.fillText(log, 25, boxY + 30 + i * 25);
        });
    }

    renderActionMenu(ctx) {
        if (this.turn !== 'player' || this.state !== 'select') return;

        const menuX = CANVAS_WIDTH - 180;
        const menuY = CANVAS_HEIGHT - 210;

        ctx.fillStyle = COLORS.lightest;
        ctx.fillRect(menuX, menuY, 175, 105);
        
        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 4;
        ctx.strokeRect(menuX, menuY, 175, 105);

        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 18px "Courier New"';
        
        const actions = ['ATACAR', 'CAPTURAR', 'HUIR'];
        actions.forEach((action, i) => {
            const tx = menuX + 35;
            const ty = menuY + 30 + i * 30;
            ctx.fillText(action, tx, ty);
            
            if (i === this.selectedAction) {
                ctx.fillText('▶', tx - 20, ty);
            }
        });
    }

    selectedAction = 0;
    selectNext() {
        this.selectedAction = (this.selectedAction + 1) % 3;
    }
    selectPrev() {
        this.selectedAction = (this.selectedAction + 2) % 3;
    }
    confirmAction() {
        switch (this.selectedAction) {
            case 0: this.playerAttack(); break;
            case 1: this.capture(); break;
            case 2: this.run(); break;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UI MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class UIManager {
    constructor() {
        this.dialogueText = '';
        this.dialogueQueue = [];
        this.showDialogue = false;
        this.textProgress = 0;
        this.inventorySelected = 0;
        this.showInventory = false;
    }

    showMessage(text, callback) {
        this.dialogueQueue.push({ text, callback });
        if (!this.showDialogue) {
            this.nextDialogue();
        }
    }

    nextDialogue() {
        if (this.dialogueQueue.length > 0) {
            const item = this.dialogueQueue.shift();
            this.dialogueText = '';
            this.dialogueQueue.push(item);
            this.showDialogue = true;
            this.textProgress = 0;
            
            this.currentCallback = item.callback;
        } else {
            this.showDialogue = false;
            if (this.currentCallback) {
                this.currentCallback();
                this.currentCallback = null;
            }
        }
    }

    update(deltaTime) {
        if (this.showDialogue && this.textProgress < this.dialogueQueue[0]?.text.length) {
            this.textProgress += deltaTime * 30;
        }
    }

    render(ctx) {
        if (this.showDialogue) {
            this.renderDialogue(ctx);
        }
        
        if (this.showInventory) {
            this.renderInventory(ctx);
        }

        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 12px Courier New';
        ctx.fillText('WASD: Mover | I: Inventario', 10, CANVAS_HEIGHT - 5);
    }

    renderDialogue(ctx) {
        const boxY = CANVAS_HEIGHT - 100;
        
        ctx.fillStyle = COLORS.lightest;
        ctx.fillRect(20, boxY, CANVAS_WIDTH - 40, 80);
        
        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 4;
        ctx.strokeRect(20, boxY, CANVAS_WIDTH - 40, 80);

        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 16px Courier New';
        
        const text = this.dialogueQueue[0]?.text || '';
        const displayText = text.substring(0, Math.floor(this.textProgress));
        
        const words = displayText.split(' ');
        let line = '';
        let y = boxY + 25;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > CANVAS_WIDTH - 80) {
                ctx.fillText(line, 35, y);
                line = word + ' ';
                y += 22;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, 35, y);

        if (this.textProgress >= text.length) {
            ctx.fillText('▼ ENTER', CANVAS_WIDTH - 120, boxY + 65);
        }
    }

    renderInventory(ctx) {
        ctx.fillStyle = 'rgba(15, 56, 15, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const boxW = 400;
        const boxH = 350;
        const boxX = (CANVAS_WIDTH - boxW) / 2;
        const boxY = (CANVAS_HEIGHT - boxH) / 2;

        ctx.fillStyle = COLORS.lightest;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        
        ctx.strokeStyle = COLORS.darkest;
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 20px Courier New';
        ctx.fillText('INVENTARIO', boxX + 20, boxY + 30);

        const player = game?.player;
        if (player) {
            ctx.font = 'bold 14px Courier New';
            ctx.fillText(`JUGADOR - NV: ${player.level}  HP: ${player.currentHp}/${player.maxHp}`, boxX + 20, boxY + 60);

            ctx.fillStyle = COLORS.dark;
            ctx.fillRect(boxX + 20, boxY + 70, boxW - 40, 2);

            const creatures = player.inventory.creatures;
            if (creatures.length === 0) {
                ctx.fillText('¡No tienes criaturas!', boxX + 20, boxY + 100);
                ctx.fillText('Explora la hierba para encontrar una.', boxX + 20, boxY + 125);
            } else {
                creatures.forEach((c, i) => {
                    const cy = boxY + 95 + i * 35;
                    const isSelected = i === this.inventorySelected;
                    
                    if (isSelected) {
                        ctx.fillStyle = COLORS.dark;
                        ctx.fillRect(boxX + 15, cy - 18, boxW - 30, 30);
                    }

                    ctx.fillStyle = isSelected ? COLORS.lightest : COLORS.darkest;
                    ctx.fillText(`${c.name} NV${c.level} HP:${c.currentHp}/${c.maxHp}`, boxX + 25, cy);
                });
            }
        }

        ctx.fillStyle = COLORS.darkest;
        ctx.font = 'bold 12px Courier New';
        ctx.fillText('I/CAP: Cerrar | ↑↓: Seleccionar', boxX + 20, boxY + boxH - 20);
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
        if (this.showInventory) {
            this.inventorySelected = 0;
        }
    }

    selectNext() {
        const max = game?.player?.inventory?.creatures?.length - 1 || 0;
        this.inventorySelected = Math.min(this.inventorySelected + 1, max);
    }

    selectPrev() {
        this.inventorySelected = Math.max(this.inventorySelected - 1, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME CLASS (MAIN CONTROLLER)
// ═══════════════════════════════════════════════════════════════════════════

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.state = GAME_STATES.EXPLORATION;
        
        this.map = new Map(MAP_WIDTH, MAP_HEIGHT);
        this.player = new Player(10, 7);
        this.inventory = new Inventory();
        this.encounterSystem = new EncounterSystem(this.map);
        this.battleSystem = new BattleSystem();
        this.uiManager = new UIManager();

        this.camera = { x: 0, y: 0 };
        
        this.keys = {};
        
        this.setupInput();
        this.loadGame();
        this.setupBattleCallbacks();

        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();

        if (this.state === GAME_STATES.EXPLORATION) {
            if (key === 'i') {
                this.uiManager.toggleInventory();
            } else if (this.uiManager.showInventory) {
                if (key === 'arrowup' || key === 'w') {
                    this.uiManager.selectPrev();
                } else if (key === 'arrowdown' || key === 's') {
                    this.uiManager.selectNext();
                } else if (key === 'i' || key === 'escape' || key === 'backspace') {
                    this.uiManager.toggleInventory();
                }
            }
        } else if (this.state === GAME_STATES.BATTLE) {
            if (this.battleSystem.state === 'select') {
                if (key === 'arrowup' || key === 'w') {
                    this.battleSystem.selectPrev();
                } else if (key === 'arrowdown' || key === 's') {
                    this.battleSystem.selectNext();
                } else if (key === 'enter' || key === ' ') {
                    this.battleSystem.confirmAction();
                }
            }
        } else if (this.state === GAME_STATES.DIALOGUE) {
            if (key === 'enter' || key === ' ') {
                this.uiManager.nextDialogue();
            }
        }
    }

    setupBattleCallbacks() {
        this.battleSystem.onBattleEnd = (result) => {
            this.state = GAME_STATES.EXPLORATION;
            this.saveGame();
        };
    }

    update(deltaTime) {
        if (this.state === GAME_STATES.EXPLORATION && !this.uiManager.showInventory) {
            this.updateExploration(deltaTime);
        }
        
        this.uiManager.update(deltaTime);
    }

    updateExploration(deltaTime) {
        let dx = 0, dy = 0;
        
        if (this.keys['arrowleft'] || this.keys['a']) dx = -1;
        else if (this.keys['arrowright'] || this.keys['d']) dx = 1;
        else if (this.keys['arrowup'] || this.keys['w']) dy = -1;
        else if (this.keys['arrowdown'] || this.keys['s']) dy = 1;

        if (dx !== 0 || dy !== 0) {
            const moved = this.player.move(dx, dy, this.map);
            
            if (moved) {
                this.keys['arrowleft'] = false;
                this.keys['arrowright'] = false;
                this.keys['arrowup'] = false;
                this.keys['arrowdown'] = false;
                this.keys['a'] = false;
                this.keys['d'] = false;
                this.keys['w'] = false;
                this.keys['s'] = false;
            }
        }

        const moved = this.player.update(deltaTime);

        if (moved) {
            const creature = this.encounterSystem.checkEncounter(this.player);
            if (creature) {
                this.startBattle(creature);
            }
            this.saveGame();
        }

        this.updateCamera();
    }

    updateCamera() {
        const targetX = this.player.renderX - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
        const targetY = this.player.renderY - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;

        this.camera.x = Math.max(0, Math.min(targetX, this.map.width * TILE_SIZE - CANVAS_WIDTH));
        this.camera.y = Math.max(0, Math.min(targetY, this.map.height * TILE_SIZE - CANVAS_HEIGHT));
    }

    startBattle(enemy) {
        this.state = GAME_STATES.BATTLE;
        this.battleSystem.startBattle(this.player, enemy);
    }

    render() {
        this.ctx.fillStyle = COLORS.lightest;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (this.state === GAME_STATES.EXPLORATION) {
            this.renderExploration();
        } else if (this.state === GAME_STATES.BATTLE) {
            this.battleSystem.render(this.ctx);
        }

        this.uiManager.render(this.ctx);
    }

    renderExploration() {
        this.map.render(this.ctx, this.camera.x, this.camera.y);
        this.player.render(this.ctx, this.camera.x, this.camera.y);
    }

    saveGame() {
        const data = {
            player: this.player.toJSON(),
            inventory: this.inventory.toJSON(),
            timestamp: Date.now()
        };
        localStorage.setItem('terracreatures_save', JSON.stringify(data));
    }

    loadGame() {
        try {
            const saved = localStorage.getItem('terracreatures_save');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.player = Player.fromJSON(data.player);
                this.inventory = Inventory.fromJSON(data.inventory);
                this.player.inventory = this.inventory;
                
                console.log('Partida cargada');
            }
        } catch (e) {
            console.error('Error al cargar partida:', e);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// START GAME
// ═══════════════════════════════════════════════════════════════════════════

let game;

window.addEventListener('load', () => {
    game = new Game();
});
