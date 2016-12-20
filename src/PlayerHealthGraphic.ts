export default class PlayerHealthGraphic {
    private graphic: Phaser.Graphics;

    constructor(phaser: Phaser.Game, x: number, y: number, initialHealth: number) {
        this.graphic = phaser.add.graphics(x, y);
        this.render(initialHealth);
    }

    public render(health: number) {
        this.graphic.clear();
        // Space between hearts multiplier
        let mult = 26;
        // How many hearts per row
        let row = 5;
        let curRow = 0;
        let columnIndex = 0;
        let startX = 12;
        let startY = 17;
        for (let i = 0; i < health; i++) {
            curRow = Math.floor(i / row) * mult;
            columnIndex = i % row * mult;
            this.graphic.lineStyle(2, 0xffffff);
            this.graphic.beginFill(0xff0000);
            this.graphic.moveTo(startX + columnIndex, startY + curRow);
            this.graphic.quadraticCurveTo(
                startX - 11 + columnIndex,
                startY - 5 + curRow,
                startX - 11 + columnIndex,
                startY - 13 + curRow);
            this.graphic.quadraticCurveTo(
                startX - 5 + columnIndex,
                startY - 18 + curRow,
                startX + columnIndex,
                startY - 13 + curRow);
            this.graphic.quadraticCurveTo(
                startX + 5 + columnIndex,
                startY - 18 + curRow,
                startX + 11 + columnIndex,
                startY - 13 + curRow);
            this.graphic.quadraticCurveTo(
                startX + 11 + columnIndex,
                startY - 5 + curRow,
                startX + columnIndex,
                startY + curRow);
            this.graphic.endFill();
        }
    }
}