export default class EnemyType {
    constructor(
        readonly name: string,
        readonly spritesheet: string,
        readonly sprite: number,
        readonly health: number,
        readonly speed: number,
        readonly value: number) { }

    // List of enemy types, rearranging these will change the enemies used in all levels.
    public static readonly TYPES = [
        new EnemyType('Green Soldier', "spritesheet",    8,  50,    4, 5),
        new EnemyType('Red Soldier', "spritesheet",      9,  75,    5, 10),
        new EnemyType('Brown Soldier', "spritesheet",    10, 50,    7, 10),
        new EnemyType('Alien Soldier', "spritesheet",    11, 800,   2, 40),
        new EnemyType('Alien Commander', "spritesheet",  13, 10000, 1, 300),
        new EnemyType('Blue Soldier', "spritesheet",     12, 250,   3, 30)
    ];
}