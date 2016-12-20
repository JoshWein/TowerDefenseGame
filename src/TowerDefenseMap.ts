export default class TowerDefenseMap {
    constructor(readonly data: number[][], public readonly environmentMap: Map<number, [number, number][]>) {
    }

    public serialize() {
        return {
            data: this.data,
            environmentMap: [...this.environmentMap]
        }
    }

    public static deserialize(obj: any) {
        return new TowerDefenseMap(
            obj.data,
            new Map<number, [number, number][]>(obj.environmentMap));
    }
}