import TowerDefenseLevel from './TowerDefenseLevel'

export default class CustomLevel {
    constructor(
        public readonly uid: string,
        public readonly level: TowerDefenseLevel,
        public readonly name: string,
        public readonly authorName: string,
        public readonly thumbnail: string,
        public readonly authorUid: string) { }

    public serialize() {
        return {
            uid: this.uid,
            level: this.level.serialize(),
            name: this.name,
            authorName: this.authorName,
            thumbnail: this.thumbnail,
            authorUid: this.authorUid
        }
    }

    public static deserialize(obj: any) {
        return new CustomLevel(
            obj.uid,
            TowerDefenseLevel.deserialize(obj.level),
            obj.name,
            obj.authorName,
            obj.thumbnail,
            obj.authorUid);
    }
}