import PhaserEngine from './PhaserEngine'

export default class TowerSkirtGraphic {
    private graphic: Phaser.Graphics;

    constructor(phaser: Phaser.Game, private alpha: number) {
        this.graphic = phaser.add.graphics(0, 0);
    }

    public show(x: number, y: number, range: number) {
        this.graphic.clear();
        this.graphic.beginFill(0x0000DD, this.alpha);
        this.graphic.drawCircle(0, 0, range * PhaserEngine.SPRITE_SIZE_PX * 2);
        [this.graphic.x, this.graphic.y] = [x, y];
    }

    public hide() {
        this.graphic.clear();
    }
}