import Tower from './Tower'

export default class Bullet extends Phaser.Sprite {
    constructor(game: Phaser.Game, x: number, y: number, public tower: Tower, spritesheet: string, spriteNum: number) {
        super(game, x, y, spritesheet, spriteNum);
        this.alive = false;
        game.physics.arcade.enable(this);
        this.body.setSize(16, 16);
        this.outOfBoundsKill = true;
        this.checkWorldBounds = true;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    }
}
