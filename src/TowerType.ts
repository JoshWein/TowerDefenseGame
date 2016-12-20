export default class TowerType {
    // animationFrames are the tower's bullet sprites
    private constructor(
        public readonly name: string,
        public readonly sprite: number,
        public readonly animationFrames: number[],
        public readonly damage: number,
        public readonly range: number,
        public readonly cooldown: number,
        public readonly cost: number) { }

        get redSprite() {
            return this.sprite + 4;
        }

        public static readonly TYPES = [
            new TowerType('Block Tower', 22, [150], 25, 2, 300, 50),
            new TowerType('Glider Tower', 23, [151, 152, 153, 154], 75, 3, 500, 100),
            new TowerType('Blinker Tower', 24, [155, 156], 20, 2, 100, 150),
            new TowerType('Fumarole Tower', 25, [157, 158, 159, 160, 161], 250, 5, 1000, 250)
        ];
}