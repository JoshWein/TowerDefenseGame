import EnemyType from './EnemyType'
import PhaserEngine from './PhaserEngine'

export default class Enemy {
    public readonly sprite: Phaser.Sprite;
    private readonly healthBarBitmap: Phaser.BitmapData;
    private readonly healthBarSprite: Phaser.Sprite;

    public progress: number = 0;
    private health: number;

    private flashTimer: Phaser.Timer;

    constructor(
        phaser: Phaser.Game,
        public type: EnemyType,
        private path: { x: number[], y: number[] },
        renderGroup: Phaser.Group) {
            this.health = type.health;

            let pos = this.calculatePosition(this.progress);
            this.sprite = phaser.add.sprite(
                pos[0],
                pos[1],
                PhaserEngine.SPRITESHEET_KEY,
                type.sprite,
                renderGroup);
            this.sprite.anchor.x = this.sprite.anchor.y = 0.5;
            phaser.physics.arcade.enable(this.sprite);

            this.sprite.body.setSize(
                this.sprite.width/4, this.sprite.height/4,
                3*this.sprite.width/8, 3*this.sprite.height/8);

            this.healthBarBitmap = new Phaser.BitmapData(
                phaser,
                phaser.rnd.uuid().toString(),
                50,
                5);
            this.healthBarSprite = phaser.add.sprite(
                pos[0] - 25,
                pos[1] - 25,
                this.healthBarBitmap,
                renderGroup);

            this.flashTimer = phaser.time.create(false);
            this.flashTimer.start();
        }

    public update(dt: number) {
        if(this.health === 0) {
            return false;
        }

        // Update progress
        this.progress += this.type.speed * (dt / 1000.0) / this.path.x.length;

        // Kill if end of path reached
        if(this.progress >= 1) {
            return false;
        }

        // Update position and angle
        let pos = this.calculatePosition(this.progress);
        this.sprite.angle = this.calculateAngle(this.sprite.x, this.sprite.y, pos[0], pos[1]);
        [this.sprite.x, this.sprite.y] = pos;

        // Update health bar
        this.healthBarBitmap.clear();
        if(this.health < this.type.health) {
            this.healthBarBitmap.rect(
                0,
                0,
                this.healthBarBitmap.width * this.health / this.type.health,
                this.healthBarBitmap.height,
                this.getHealthbarColor());
            [this.healthBarSprite.x, this.healthBarSprite.y] = pos.map(coord => coord - 25);
        }
        return true;
    }


    private calculatePosition(progress: number) {
        let x = Phaser.Math.linearInterpolation(this.path.x, progress);
        let y = Phaser.Math.linearInterpolation(this.path.y, progress);
        return [x, y];
    }

    private calculateAngle(prevX: number, prevY: number, nextX: number, nextY: number): number {
        if (nextY < prevY) {
            return 270;
        } else if (nextY > prevY) {
            return 90;
        } else if (nextX < prevX) {
            return 180;
        }
        return 0;
    }

    get position(): [number, number] {
        return [this.sprite.x, this.sprite.y];
    }

    private getHealthbarColor() {
        let percentHealth = 100 * this.health / this.type.health;
        if (percentHealth < 32) {
            return '#f00';
        } else if (percentHealth < 64) {
            return '#ff0';
        }
        return '#0f0';
    }

    public takeDamage(dmg: number) {
        this.health -= dmg;
        if(this.health < 0) {
            this.health = 0;
        }
        this.flash();
    }

    private flash() {
        this.flashTimer.removeAll();
        this.sprite.tint = 0.7 * 0xFFFFFF;
        this.flashTimer.add(50, () => this.sprite.tint = 0xFFFFFF);
    }

    public destroy() {
        this.sprite.kill();
        this.healthBarSprite.kill();
    }

    get completedPath() {
        return this.health !== 0;
    }

    get active() {
        return this.progress < 1 && this.health > 0;
    }
}