import PhaserEngine from './PhaserEngine'

export default class PlayerGoldGraphic {
    private text: Phaser.BitmapText;

    constructor(phaser: Phaser.Game, x: number, y: number, initialGold: number) {
        let group = phaser.add.group();
        phaser.add.sprite(0, 0, PhaserEngine.SPRITESHEET_KEY, 19, group);
        this.text = phaser.add.bitmapText(
            PhaserEngine.SPRITE_SIZE_PX * 0.5,
            PhaserEngine.SPRITE_SIZE_PX * -0.5,
            PhaserEngine.GOLD_FONT_KEY,
            initialGold.toString(),
            64,
            group);
        [group.scale.x, group.scale.y] = [0.5, 0.5];
        [group.x, group.y] = [x, y - group.height];
    }

    public setGoldAmount(gold: number) {
        this.text.text = gold.toString();
    }
}