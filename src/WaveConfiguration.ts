export default class WaveConfiguration {
    constructor(
        public readonly enemyInfo : Map<number, number>) {}

    public serialize() {
        return {
            enemyInfo: [...this.enemyInfo]
        }
    }

    public static deserialize(obj: any) {
        return new WaveConfiguration(new Map<number, number>(obj.enemyInfo));
    }
}