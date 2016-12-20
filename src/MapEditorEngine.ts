import * as Util from './Util'
import PhaserEngine from './PhaserEngine'
import * as EditorPage from './EditorPage'
import * as EasyStar from 'easystarjs'
import TowerDefenseLevel from './TowerDefenseLevel'
import TowerDefenseMap from './TowerDefenseMap'


const MAP_LAYER = 'map';
const ENV_LAYER = 'environment';
const PATH_TILES: Util.ImmutableSet<number> = new Set([0, 1, 2, 3]);
const DISTANCE_BETWEEN_POINTS = 160;

export default class MapEditorEngine extends PhaserEngine {
    private tiles: number[][];
    private envTiles: number[][];
    private pathPoints: number[][];
    private startCoords: number[] = [-1,-1];
    private endCoords: number[] = [-1,-1];
    private pathGraphics: Phaser.Graphics;
    private lastMouseCoords: number[] = [-1,-1];
    private isDown: boolean = false;
    private pathStage: number = 0;


    public constructor(containerId: string, private initialLevel?: TowerDefenseLevel) {
        super(containerId);
    }

    create() {
        this.phaser.stage.backgroundColor = "#faebd7";

        this.phaser.add.image(0, 0,
            this.phaser.create.grid(
                this.phaser.rnd.uuid().toString(),
                PhaserEngine.BASE_WIDTH_PX,
                PhaserEngine.BASE_HEIGHT_PX,
                PhaserEngine.SPRITE_SIZE_PX,
                PhaserEngine.SPRITE_SIZE_PX,
                '#81a5a5'));

        let text = this.phaser.add.text(
            PhaserEngine.BASE_WIDTH_PX/2,
            PhaserEngine.BASE_HEIGHT_PX/2,
            "Paint me!\n\nDon't forget that the sidebar retracts",
            {font: '32px "Wendy One"', align: 'center'});
        [text.anchor.x, text.anchor.y] = [0.5, 0.5];

        this.createTilemapLayer(MAP_LAYER);
        this.createTilemapLayer(ENV_LAYER);

        this.tiles = [];
        this.envTiles = [];
        for(let i = 0; i < PhaserEngine.HEIGHT_TILES; i++) {
            this.tiles[i] = [];
            this.envTiles[i] = [];
            for(let j = 0; j < PhaserEngine.WIDTH_TILES; j++){
                this.tiles[i][j] = -1;
                this.envTiles[i][j] = -1;
            }
        }

        if(this.initialLevel) {
            let initialMapData = this.initialLevel.map;
            for(let i = 0; i < PhaserEngine.HEIGHT_TILES; i++) {
                for(let j = 0; j < PhaserEngine.WIDTH_TILES; j++){
                    this.setTile(MAP_LAYER, j, i, initialMapData.data[i][j]);
                    this.tiles[i][j] = initialMapData.data[i][j];
                }
            }
            for(let [envSprite, poss] of initialMapData.environmentMap) {
                for(let pos of poss) {
                    this.setTile(ENV_LAYER, pos[0], pos[1], envSprite);
                    this.envTiles[pos[1]][pos[0]] = envSprite;
                }
            }
            this.startCoords = this.initialLevel.startCoords;
            this.endCoords = this.initialLevel.endCoords;
            this.setTile(ENV_LAYER, this.startCoords[0], this.startCoords[1], 20);
            this.setTile(ENV_LAYER, this.endCoords[0], this.endCoords[1], 21);
            this.computeEnemyPath();
        }


        this.phaser.input.onDown.add(() => this.onMouseDown());
        this.phaser.input.onUp.add(() => this.onMouseUp());

        this.pathGraphics = this.phaser.add.graphics(0, 0);
    }

    update() {
        if(this.phaser.input.x > 0 && this.phaser.input.x < PhaserEngine.BASE_WIDTH_PX && this.phaser.input.y > 0 && this.phaser.input.y < PhaserEngine.BASE_HEIGHT_PX){
            let tileCoords = this.worldToTile(this.phaser.input.x, this.phaser.input.y);
            if(this.isDown && (tileCoords[0] != this.lastMouseCoords[0] || tileCoords[1] != this.lastMouseCoords[1])){
                this.lastMouseCoords = tileCoords;
                this.updateMap(tileCoords);
            }
        } else {
            this.lastMouseCoords = [-1,-1];
        }
        if(this.pathPoints != null && this.pathPoints.length != 0){
            this.pathGraphics.clear();
            this.pathGraphics.lineStyle(0);
            this.pathGraphics.beginFill(0x0033CC, 0.5);
            for(let i=this.pathStage; i < (this.pathPoints.length-1)*PhaserEngine.SPRITE_SIZE_PX; i+=DISTANCE_BETWEEN_POINTS){
                this.pathGraphics.drawCircle(this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)][0]+(this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)+1][0]-this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)][0])*((i % PhaserEngine.SPRITE_SIZE_PX)/PhaserEngine.SPRITE_SIZE_PX),this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)][1]+(this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)+1][1]-this.pathPoints[Math.floor(i/PhaserEngine.SPRITE_SIZE_PX)][1])
                *((i % PhaserEngine.SPRITE_SIZE_PX)/PhaserEngine.SPRITE_SIZE_PX),10);
            }
            this.pathStage = (this.pathStage + 1) % DISTANCE_BETWEEN_POINTS;
        } else {
            this.pathGraphics.clear();
        }
    }

    export(): TowerDefenseLevel {
        return null;
    }

    private onMouseDown(){
        this.isDown = true;
    }

    private onMouseUp(){
        this.isDown = false;
        this.lastMouseCoords = [-1,-1];
    }

    public toMapData(): TowerDefenseMap {
        let map = new Map<number, [[number, number]]>();
        for(let i = 0; i < PhaserEngine.HEIGHT_TILES; i++) {
             for(let j = 0; j < PhaserEngine.WIDTH_TILES; j++){
                if(this.envTiles[i][j] != -1){
                    if(map.has(this.envTiles[i][j])){
                        map.get(this.envTiles[i][j]).push([j,i]);
                    } else {
                        map.set(this.envTiles[i][j], [[j,i]]);
                    }
                }
            }
        }
        return new TowerDefenseMap(this.tiles, map);
    }

    public getStartCoords(): number[]{
        return this.startCoords;
    }
    public getEndCoords(): number[]{
        return this.endCoords;
    }

    private computeEnemyPath() {
        let easystar = new EasyStar.js();
        easystar.setGrid(this.tiles);
        easystar.setAcceptableTiles([...PATH_TILES]);
        easystar.findPath(this.startCoords[0], this.startCoords[1], this.endCoords[0], this.endCoords[1], path => {
            this.pathPoints = [];
            if (path === null) {
            } else {
               for(let i = 0; i < path.length; i++){
                    this.pathPoints.push([path[i].x*PhaserEngine.SPRITE_SIZE_PX+PhaserEngine.SPRITE_SIZE_PX/2,path[i].y*PhaserEngine.SPRITE_SIZE_PX+PhaserEngine.SPRITE_SIZE_PX/2]);
                }
            }
        });
        easystar.calculate();
    }


    private updateMap(tileCoords: number[]) {
        switch(EditorPage.getTileType()){
            case EditorPage.TileType.Default:
                this.tiles[tileCoords[1]][tileCoords[0]] = EditorPage.getSelectedSprite();
                this.setTile(MAP_LAYER, tileCoords[0], tileCoords[1], EditorPage.getSelectedSprite());
                break;
            case EditorPage.TileType.Start:
                if(PATH_TILES.has(this.tiles[tileCoords[1]][tileCoords[0]]) && !(tileCoords[0] == this.endCoords[0] && tileCoords[1] == this.endCoords[1])){
                    if(this.startCoords[0] != -1){
                        this.removeTile(ENV_LAYER, this.startCoords[0], this.startCoords[1]);
                    }
                    this.envTiles[tileCoords[1]][tileCoords[0]] = -1;
                    this.startCoords = [tileCoords[0], tileCoords[1]];
                    this.setTile(ENV_LAYER, tileCoords[0], tileCoords[1], EditorPage.getSelectedSprite());
                }
                break;
            case EditorPage.TileType.End:
                if(PATH_TILES.has(this.tiles[tileCoords[1]][tileCoords[0]]) && !(tileCoords[0] == this.startCoords[0] && tileCoords[1] == this.startCoords[1])){
                    if(this.endCoords[0] != -1){
                        this.removeTile(ENV_LAYER, this.endCoords[0], this.endCoords[1]);
                    }
                    this.envTiles[tileCoords[1]][tileCoords[0]] = -1;
                    this.endCoords = [tileCoords[0], tileCoords[1]];
                    this.setTile(ENV_LAYER, tileCoords[0], tileCoords[1], EditorPage.getSelectedSprite());
                }
                break;
            case EditorPage.TileType.Delete:
                if(tileCoords[0] == this.startCoords[0] && tileCoords[1] == this.startCoords[1]){
                    this.startCoords = [-1,-1];
                    this.pathPoints = null;
                }
                if(tileCoords[0] == this.endCoords[0] && tileCoords[1] == this.endCoords[1]){
                    this.endCoords = [-1,-1];
                    this.pathPoints = null;
                }
                this.envTiles[tileCoords[1]][tileCoords[0]] = -1;
                this.removeTile(ENV_LAYER, tileCoords[0], tileCoords[1]);
                break;
            case EditorPage.TileType.Environment:
                if(!((tileCoords[0] == this.startCoords[0] && tileCoords[1] == this.startCoords[1]) ||
                        (tileCoords[0] == this.endCoords[0] && tileCoords[1] == this.endCoords[1]) ||
                        PATH_TILES.has(this.tiles[tileCoords[1]][tileCoords[0]]))){
                    this.envTiles[tileCoords[1]][tileCoords[0]] = EditorPage.getSelectedSprite();
                    this.setTile(ENV_LAYER, tileCoords[0], tileCoords[1], EditorPage.getSelectedSprite());
                }
                break;
        }
        if(this.startCoords[0] != -1 && this.endCoords[0] != -1){
            this.computeEnemyPath();
        }
    }

    public hasPath(): boolean{
        return (this.pathPoints != null) && (this.pathPoints.length > 0);
    }

    public hasEmptyTiles(): boolean {
        for(let row of this.tiles) {
            for(let tile of row) {
                if(tile === -1) {
                    return true;
                }
            }
        }
        return false;
    }

    public generateThumbnail(): string {
        let tmpCanvas = <HTMLCanvasElement>document.createElement('canvas');
        tmpCanvas.height = 150;
        tmpCanvas.width = tmpCanvas.height * (PhaserEngine.BASE_WIDTH_PX/PhaserEngine.BASE_HEIGHT_PX);
        tmpCanvas.getContext('2d').drawImage(this.phaser.canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
        return tmpCanvas.toDataURL('img/jpeg', 0.5);
    }

}