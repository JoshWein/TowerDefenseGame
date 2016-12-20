import TowerType from './TowerType'
import Enemy from './Enemy'
import * as Util from './Util'
import PhaserEngine from './PhaserEngine'

export default class Tower {
    private timeElapsedSinceLastFire: number = 0;
    private target: Enemy = null;
    private sqRangePx: number;
    private bullet: Phaser.Sprite;
    private currentUpgradeMultiplier = 1;
    public level = 0;

    constructor(phaser: Phaser.Game, public type: TowerType, public x: number, public y: number) {
        this.sqRangePx = Math.pow(this.type.range * PhaserEngine.SPRITE_SIZE_PX, 2);
        this.bullet = phaser.add.sprite(
            x,
            y,
            PhaserEngine.SPRITESHEET_KEY,
            this.type.animationFrames[0]);
        [this.bullet.anchor.x, this.bullet.anchor.y] = [0.5, 0.5];
    }

    public update(dt: number) {
        this.rotateBulletTowardsTarget();
        this.timeElapsedSinceLastFire += dt;
        if(this.timeElapsedSinceLastFire >= this.cooldown) {
            return true;
        }
        return false;
    }

    public resetCooldownTimer() {
        this.timeElapsedSinceLastFire = 0;
    }

    get damage() {
        return Math.floor(this.type.damage * this.currentUpgradeMultiplier);
    }

    get range() {
        return this.type.range + this.level;
    }

    get cooldown() {
        return Math.floor(this.type.cooldown/this.currentUpgradeMultiplier);
    }

    get value() {
        return Math.floor(this.type.cost * this.currentUpgradeMultiplier);
    }

    public upgrade() {
        this.level += 1;
        this.currentUpgradeMultiplier += .5;
        this.sqRangePx = Math.pow(this.range * PhaserEngine.SPRITE_SIZE_PX, 2);
    }

    // Get the enemy closest to finishing
    public getTarget(enemies: Iterable<Enemy>) {
        let bestTarget : Enemy = null;
        for(let enemy of enemies) {
            if(this.isInRange(enemy)) {
                if (bestTarget == null || enemy.progress > bestTarget.progress)
                    bestTarget = enemy;
            }
        }
        if (bestTarget != null) {
            this.target = bestTarget;
            return bestTarget;
        }
        return null;
    }

    private rotateBulletTowardsTarget() {
        if (this.target != null && this.isInRange(this.target))
            this.bullet.rotation = Phaser.Math.angleBetween(
                    this.bullet.x,
                    this.bullet.y,
                    this.target.position[0],
                    this.target.position[1]);
    }

    private isInRange(enemy: Enemy): boolean {
        return Util.sqDist([this.x, this.y], enemy.position) <= this.sqRangePx + 5;
    }

    public destroy() {
        this.bullet.kill();
    }

}