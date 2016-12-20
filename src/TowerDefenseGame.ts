import PhaserEngine from './PhaserEngine'
import TowerDefenseLevel from './TowerDefenseLevel'
import Tower from './Tower'
import TowerType from './TowerType'
import EnemyType from './EnemyType'
import Enemy from './Enemy'
import PlayerHealthGraphic from './PlayerHealthGraphic'
import PlayerGoldGraphic from './PlayerGoldGraphic'
import * as Util from './Util'
import TowerSkirtGraphic from './TowerSkirtGraphic'
import * as ObjectHash from 'object-hash'


const BULLET_POOL_SIZE = 100;
const ENV_LAYER = 'env_layer';
const GHOST_TOWER_LAYER = 'ghost_tower';
const MAP_LAYER = 'map';
const PATH_TILES: Util.ImmutableSet<number> = new Set([0, 1, 2, 3]);
const SELL_PENALTY = 0.8;
const TOWER_LAYER = 'tower';

export default class TowerDefenseGame extends PhaserEngine {
    private readonly towers = new Map<String, Tower>();
    private readonly bulletSpriteMap = new Map<Phaser.Sprite, [Tower, Enemy]>();
    private readonly enemies = new Set<Enemy>();
    private readonly bulletPools = new Map<TowerType, Phaser.Group>();

    private enemyRenderGroup: Phaser.Group;

    private path: { x: number[], y: number[] };
    private healthIndicator: PlayerHealthGraphic;
    private goldIndicator: PlayerGoldGraphic;
    private ghostTowerSkirt: TowerSkirtGraphic;
    private selectedTowerSkirt: TowerSkirtGraphic;
    private ghostTowerTileCoord: [number, number];
    private selectedTower: Tower;
    private gold: number;
    private health: number;
    private pendingEnemies: number = 0;
    private currentWave: number;
    private _paused: boolean;
    private endPointSprite: Phaser.Sprite;
    private endPointFlashTimer: Phaser.Timer;

    public levelCompleteCallback: (won: boolean) => void;
    public towerSelectCallback: (tower: Tower) => void;
    public onLoadCallback: () => void;

    public selectedTowerType: TowerType;

    private rng: Util.Rng;

    private gameTimer: Phaser.Timer;

    public constructor(
        containerId: string,
        private level: TowerDefenseLevel) {
        super(containerId);
        this.rng = Util.createRng(ObjectHash.sha1(level));
    }

    protected create() {
        this.gold = this.level.startgold;

        // Create map layer
        this.createTilemapLayer(MAP_LAYER);
        for (let y = 0; y < this.level.map.data.length; y++) {
            for (let x = 0; x < this.level.map.data[0].length; x++) {
                this.setTile(MAP_LAYER, x, y, this.level.map.data[y][x]);
            }
        }

        // Create tower layer
        this.createTilemapLayer(TOWER_LAYER);

        // Create enemy render group.
        this.enemyRenderGroup = this.phaser.add.group();

        // Create start/end sprites
        let [startX, startY] = this.tileToWorld(
            this.level.startCoords[0],
            this.level.startCoords[1]);
        let startSprite = this.phaser.add.sprite(startX, startY, PhaserEngine.SPRITESHEET_KEY, 20);
        [startSprite.anchor.x, startSprite.anchor.y] = [0.5, 0.5];


        let [endX, endY] = this.tileToWorld(
            this.level.endCoords[0],
            this.level.endCoords[1]);
        this.endPointSprite = this.phaser.add.sprite(endX, endY, PhaserEngine.SPRITESHEET_KEY, 21);
        [this.endPointSprite.anchor.x, this.endPointSprite.anchor.y] = [0.5, 0.5];

        // Create environment layer
        this.createTilemapLayer(ENV_LAYER);
        for(let [envSprite, tileCoords] of this.level.map.environmentMap) {
            for(let coord of tileCoords) {
                this.setTile(ENV_LAYER, coord[0], coord[1], envSprite);
            }
        }

        // Create ghost tower layer
        this.createTilemapLayer(GHOST_TOWER_LAYER, 0.6);

        // Add event listeners
        this.phaser.input.onDown.add(() => this.onMouseClick());
        this.phaser.input.addMoveCallback(() => this.onMouseMove(), undefined);
        this.phaser.input.mouse.mouseOutCallback = () => this.destroyGhostTower();

        // Convert path from tile space to world space
        let combinedPath = this.level.calculatePath().map(
            tile => this.tileToWorld(tile[0], tile[1]));

        // Split path into separate x and y components.
        this.path = {
            x: combinedPath.map(tile => tile[0]),
            y: combinedPath.map(tile => tile[1])
        }

        // Create bullet pools
        TowerType.TYPES.forEach(type => this.addBulletPool(type, BULLET_POOL_SIZE));

        // Create UI elements
        this.health = this.level.startHealth == null ? 10 : this.level.startHealth;
        this.healthIndicator = new PlayerHealthGraphic(this.phaser, 10, 10, this.health);
        this.goldIndicator = new PlayerGoldGraphic(
            this.phaser,
            10,
            PhaserEngine.BASE_HEIGHT_PX - 10,
            this.gold);
        this.ghostTowerSkirt = new TowerSkirtGraphic(this.phaser, 0.1);
        this.selectedTowerSkirt = new TowerSkirtGraphic(this.phaser, 0.2);

        // Create endpoint flash timer
        this.endPointFlashTimer = this.phaser.time.create(false);
        this.endPointFlashTimer.start();

        // Create game timer
        this.gameTimer = this.phaser.time.create(false);
        this.gameTimer.start();

        // Start first wave and pause game
        this.paused = true;
        this.startWave(0);

        // Call loaded callback
        if(this.onLoadCallback) {
            this.onLoadCallback();
        }
    }

    get paused() {
        return this._paused;
    }

    set paused(paused: boolean) {
        this._paused = paused;
        this.phaser.physics.arcade.isPaused = paused;
        paused ? this.gameTimer.pause() : this.gameTimer.resume();
    }

    set muted(muted: boolean) {
        this.gameAudio.muted = muted;
    }

    get muted() {
        return this.gameAudio.muted;
    }

    protected update() {
        let elapsedMs = this.phaser.time.elapsedMS;

        if(this.paused) {
            return;
        }

        // Process enemies
        for(let enemy of this.enemies) {
            if(!enemy.update(elapsedMs)) {
                if(enemy.completedPath) {
                    this.flashEndPoint();
                    this.addHealth(-1);
                } else {
                    this.addGold(enemy.type.value);
                }
                this.destroyEnemy(enemy);
            }
        }

        // Process towers
        for(let tower of this.towers.values()) {
            if(tower.update(elapsedMs)) {
                let target = tower.getTarget(this.enemies);
                if(target) {
                    tower.resetCooldownTimer();
                    this.fireBullet(tower, target);
                }
            }
        }

        // Process bullets
        for(let [bullet, [tower, target]] of this.bulletSpriteMap) {
            if(!target.active) {
                this.destroyBullet(bullet);
                continue;
            }
            bullet.rotation = this.phaser.physics.arcade.moveToXY(bullet, target.position[0], target.position[1], 600);
            if(this.phaser.physics.arcade.overlap(bullet, target.sprite)) {
                this.destroyBullet(bullet);
                target.takeDamage(tower.damage);
            }
        }

        // Check for gameover
        if(this.health === 0) {
            this.levelComplete(false);
        } else if(this.pendingEnemies === 0 && this.enemies.size === 0) {
            if(this.currentWave === this.level.waveData.length - 1) {
                this.levelComplete(true);
            } else {
                this.startWave(this.currentWave + 1);
            }
        }
    }

    private onMouseClick() {
        let [tileX, tileY] = this.worldToTile(this.phaser.input.x, this.phaser.input.y);
        let tower = this.getTowerAt(tileX, tileY);
        if(tower !== undefined && tower !== this.selectedTower) {
            this.selectTower(tower);
        } else if(this.canPlaceTower(this.selectedTowerType, tileX, tileY)) {
            this.addGold(-this.selectedTowerType.cost);
            this.selectTower(this.placeTower(this.selectedTowerType, tileX, tileY));
        }
    }

    private onMouseMove() {
        if(!this.phaser.device.desktop) {
            return;
        }
        let [tileX, tileY] = this.worldToTile(this.phaser.input.x, this.phaser.input.y);
        if(this.getTowerAt(tileX, tileY) === undefined) {
            this.showGhostTower(this.selectedTowerType, tileX, tileY);
        }
    }

    private showGhostTower(type: TowerType, tileX: number, tileY: number) {
        if(this.ghostTowerTileCoord !== undefined) {
            this.removeTile(
                GHOST_TOWER_LAYER,
                this.ghostTowerTileCoord[0],
                this.ghostTowerTileCoord[1]);
        }

        this.ghostTowerTileCoord = [tileX, tileY];
        let worldPos = this.tileToWorld(tileX, tileY);

        if(this.canPlaceTower(type, tileX, tileY)) {
            this.setTile(GHOST_TOWER_LAYER, tileX, tileY, type.sprite);
            this.ghostTowerSkirt.show(worldPos[0], worldPos[1], type.range);
        } else {
            this.setTile(GHOST_TOWER_LAYER, tileX, tileY, type.redSprite);
            this.ghostTowerSkirt.hide();
        }
    }

    private destroyGhostTower() {
        if(this.ghostTowerTileCoord !== undefined) {
            this.removeTile(
                GHOST_TOWER_LAYER,
                this.ghostTowerTileCoord[0],
                this.ghostTowerTileCoord[1]);
            this.ghostTowerTileCoord = undefined;
        }
        this.ghostTowerSkirt.hide();
    }

    public sellSelectedTower() {
        this.addGold(this.selectedTower.value * SELL_PENALTY);
        this.removeTower(this.selectedTower);
        this.deselectTower();
        this.gameAudio.sellTowerSound.play();
    }

    public upgradeSelectedTower() {
        if(this.selectedTower.level < 3 && this.gold >= this.selectedTower.value) {
            this.addGold(-this.selectedTower.value);
            this.selectedTower.upgrade();
            this.selectTower(this.selectedTower);
            this.gameAudio.upgradeTowerSound.play();
        }
    }

    private selectTower(tower: Tower) {
        this.selectedTower = tower;
        this.selectedTowerSkirt.show(tower.x, tower.y, tower.range);
        if(this.towerSelectCallback !== undefined) {
            this.towerSelectCallback(tower);
        }
        this.gameAudio.playSelectTowerSound();
    }

    private deselectTower() {
        this.selectedTower = undefined;
        this.selectedTowerSkirt.hide();
        if(this.towerSelectCallback !== undefined) {
            this.towerSelectCallback(undefined);
        }
    }

    private levelComplete(won: boolean) {
        this.paused = true;
        if(this.levelCompleteCallback !== undefined) {
            if (won) {
                this.gameAudio.victorySound.play();
            } else {
                this.gameAudio.defeatSound.play();
            }
            this.levelCompleteCallback(won);
        }
    }

    private fireBullet(tower: Tower, target: Enemy): void {
        let bullet = this.bulletPools.get(tower.type).getFirstDead();
        bullet.reset(tower.x, tower.y);
        this.bulletSpriteMap.set(bullet, [tower, target]);
        bullet.animations.play('fire');
    }

    private destroyBullet(bullet: Phaser.Sprite): void {
        bullet.kill();
        this.bulletSpriteMap.delete(bullet);
    }

    private canPlaceTower(type: TowerType, tileX: number, tileY: number) {
        return this.getTowerAt(tileX, tileY) === undefined
            && !PATH_TILES.has(this.getTile(MAP_LAYER, tileX, tileY))
            && !this.hasTile(ENV_LAYER, tileX, tileY)
            && this.gold >= type.cost;
    }

    private placeTower(type: TowerType, tileX: number, tileY: number) {
        let [x, y] = this.tileToWorld(tileX, tileY);
        let tower = new Tower(this.phaser, type, x, y);
        this.towers.set([tileX, tileY].toString(), tower);
        this.setTile(TOWER_LAYER, tileX, tileY, type.sprite);
        this.gameAudio.placeTowerSound.play();
        return tower;
    }

    private removeTower(tower: Tower) {
        let [tileX, tileY] = this.worldToTile(tower.x, tower.y);
        this.removeTile(TOWER_LAYER, tileX, tileY);
        this.getTowerAt(tileX, tileY).destroy();
        this.towers.delete([tileX, tileY].toString());
    }

    private getTowerAt(tileX: number, tileY: number) {
        return this.towers.get([tileX, tileY].toString());
    }

    private startWave(wave: number) {
        let enemiesToSpawn: Array<number> = []
        for(let [enemyType, count] of this.level.waveData[wave].enemyInfo) {
            for(let i = 0; i < count; i++) {
                enemiesToSpawn.push(enemyType);
            }
        }
        Util.shuffle(enemiesToSpawn, this.rng);
        this.pendingEnemies = 0;
        for(let enemyType of enemiesToSpawn) {
            this.gameTimer.add((250 * this.pendingEnemies) + (this.rng.random() * 200), () => {
                this.spawnEnemy(EnemyType.TYPES[enemyType]);
                this.pendingEnemies--;
            });
            this.pendingEnemies++;
        }
        this.currentWave = wave;
    }

    private spawnEnemy(type: EnemyType) {
        let enemy = new Enemy(this.phaser, type, this.path, this.enemyRenderGroup);
        this.enemies.add(enemy);
    }

    private destroyEnemy(enemy: Enemy) {
        enemy.destroy();
        this.enemies.delete(enemy);
        this.gameAudio.playEnemyDeathSound();
    }

    private addHealth(amt: number) {
        this.health += amt;
        if(this.health > 10) {
            this.health = 10;
        } else if(this.health < 0) {
            this.health = 0;
        }
        this.healthIndicator.render(this.health);
    }

    private addGold(amt: number) {
        this.gold += amt;
        if(this.gold < 0) {
            this.gold = 0;
        }
        this.goldIndicator.setGoldAmount(this.gold);
    }

    private addBulletPool(towerType: TowerType, count: number) {
        let pool = this.phaser.add.group();
        pool.enableBody = true;
        pool.physicsBodyType = Phaser.Physics.ARCADE;
        pool.createMultiple(count, PhaserEngine.SPRITESHEET_KEY, towerType.animationFrames[0]);
        pool.forEach((bullet: Phaser.Sprite) => {
            bullet.anchor.x = bullet.anchor.y = 0.5;
            bullet.outOfBoundsKill = true;
            bullet.body.setSize(
                PhaserEngine.SPRITE_SIZE_PX/8,
                PhaserEngine.SPRITE_SIZE_PX/8,
                7*PhaserEngine.SPRITE_SIZE_PX/16,
                7*PhaserEngine.SPRITE_SIZE_PX/16);
            bullet.animations.add('fire', towerType.animationFrames, 10, true);
        }, undefined);
        this.bulletPools.set(towerType, pool);
    }

    private flashEndPoint() {
        this.endPointFlashTimer.removeAll();
        this.endPointSprite.tint = 0.7 * 0xFFFFFF;
        this.endPointFlashTimer.add(50, () => this.endPointSprite.tint = 0xFFFFFF);
        this.gameAudio.healthLossSound.play();
    }
}