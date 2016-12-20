import TowerDefenseMap from './TowerDefenseMap'
import WaveConfiguration from './WaveConfiguration'
import * as EasyStar from 'easystarjs'
import * as Util from './Util'

const PATH_TILES: Util.ImmutableSet<number> = new Set([0, 1, 2, 3]);

export default class TowerDefenseLevel {
    constructor(public readonly map: TowerDefenseMap,
                public readonly startgold: number,
                public readonly waveData: WaveConfiguration[],
                public readonly startCoords: number[],
                public readonly endCoords: number[],
                public readonly levelInfo: string,
                public readonly towerConfig: boolean[],
                public readonly startHealth ?: number) { }

     public calculatePath(): [number, number][] {
        let pathTiles: [number, number][] = []
        let easystar = new EasyStar.js();
        easystar.setGrid(this.map.data);
        easystar.setAcceptableTiles([...PATH_TILES]);
        easystar.enableSync();
        easystar.findPath(
            this.startCoords[0],
            this.startCoords[1],
            this.endCoords[0],
            this.endCoords[1],
            path => {
                pathTiles = path.map(tile => <[number, number]>[tile.x, tile.y]);
            });
        easystar.calculate();
        return pathTiles;
    }

    public serialize() {
        return {
            map: this.map.serialize(),
            startgold: this.startgold,
            waveData: this.waveData.map(data => data.serialize()),
            startCoords: this.startCoords,
            endCoords: this.endCoords,
            levelInfo: this.levelInfo,
            towerConfig: this.towerConfig
        }
    }

    public static deserialize(obj: any) {
        return new TowerDefenseLevel(
            TowerDefenseMap.deserialize(obj.map),
            obj.startgold,
            obj.waveData.map((data: any) => WaveConfiguration.deserialize(data)),
            obj.startCoords,
            obj.endCoords,
            obj.levelInfo,
            obj.towerConfig,
            obj.startHealth
        );
    }
}