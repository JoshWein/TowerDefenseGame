import * as Util from './Util'
import GameAudio from './GameAudio'

abstract class PhaserEngine {
    public static readonly SPRITE_SIZE_PX: number = 64;
    public static readonly SPRITESHEET_KEY: string = "spritesheet";
    public static readonly GOLD_FONT_KEY: string = "gold_font";
    public static readonly HEIGHT_TILES = 10;
    public static readonly WIDTH_TILES = 17;
    public static readonly BASE_HEIGHT_PX = PhaserEngine.HEIGHT_TILES * PhaserEngine.SPRITE_SIZE_PX;
    public static readonly BASE_WIDTH_PX = PhaserEngine.WIDTH_TILES * PhaserEngine.SPRITE_SIZE_PX;

    private static readonly SPRITESHEET_IMAGE_NAME = 'spritesheet.png';
    private static readonly SPRITESHEET_WIDTH_TILES = 23;
    private static readonly SPRITESHEET_HEIGHT_TILES = 13;
    private static readonly SPRITESHEET_MARGIN_PX = 0;
    private static readonly SPRITESHEET_SPACING_PX = 2;
    private static readonly ASPECT_RATIO = PhaserEngine.BASE_WIDTH_PX / PhaserEngine.BASE_HEIGHT_PX;

    protected readonly phaser: Phaser.Game;

    private tilemap: Phaser.Tilemap;
    private tilemapInitialized: boolean = false;

    protected gameAudio: GameAudio;

    public constructor(containerClass: string) {
        this.phaser = new Phaser.Game(
            PhaserEngine.BASE_WIDTH_PX,
            PhaserEngine.BASE_HEIGHT_PX,
            Phaser.CANVAS,
            containerClass,
            {
                preload: () => this.preloadInternal(),
                create: () => this.createInternal(),
                update: () => this.updateInternal()
            });
        this.gameAudio = new GameAudio(this.phaser);
    }

    protected abstract create(): void;
    protected abstract update(): void;

    private preloadInternal() {
        // Handle scaling properly.
        this.phaser.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load spritesheet
        this.phaser.load.spritesheet(
            PhaserEngine.SPRITESHEET_KEY,
            Util.getImagePath(PhaserEngine.SPRITESHEET_IMAGE_NAME),
            PhaserEngine.SPRITE_SIZE_PX,
            PhaserEngine.SPRITE_SIZE_PX,
            PhaserEngine.SPRITESHEET_WIDTH_TILES * PhaserEngine.SPRITESHEET_HEIGHT_TILES,
            PhaserEngine.SPRITESHEET_MARGIN_PX,
            PhaserEngine.SPRITESHEET_SPACING_PX);

        // Load gold font
        this.phaser.load.bitmapFont(
            PhaserEngine.GOLD_FONT_KEY,
            Util.getFontPath(PhaserEngine.GOLD_FONT_KEY+'.png'),
            Util.getFontPath(PhaserEngine.GOLD_FONT_KEY+'.xml'));

        // Preload audio
        this.gameAudio.preload();
    }

    private createInternal() {
        // Initialize tilemap
        this.tilemap = this.phaser.add.tilemap();
        this.tilemap.addTilesetImage(
            null,
            PhaserEngine.SPRITESHEET_KEY,
            PhaserEngine.SPRITE_SIZE_PX,
            PhaserEngine.SPRITE_SIZE_PX,
            PhaserEngine.SPRITESHEET_MARGIN_PX,
            PhaserEngine.SPRITESHEET_SPACING_PX);

        // Initialize audio
        this.gameAudio.create();

        this.create();
    }

    private updateInternal() {
        this.update();
    }

    private resize() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        if (width / height > PhaserEngine.ASPECT_RATIO) {
            this.phaser.scale.setUserScale(
                    height / PhaserEngine.BASE_HEIGHT_PX,
                    height / PhaserEngine.BASE_HEIGHT_PX);
        } else {
            this.phaser.scale.setUserScale(
                width / PhaserEngine.BASE_WIDTH_PX,
                width / PhaserEngine.BASE_WIDTH_PX);
        }
    }

    protected createTilemapLayer(name: string, alpha = 1.0): void {
        let createLayerFn = this.tilemap.createBlankLayer;
        if(!this.tilemapInitialized) {
            createLayerFn = this.tilemap.create;
            this.tilemapInitialized = true;
        }
        createLayerFn.call(
            this.tilemap,
            name,
            PhaserEngine.WIDTH_TILES,
            PhaserEngine.HEIGHT_TILES,
            PhaserEngine.SPRITE_SIZE_PX,
            PhaserEngine.SPRITE_SIZE_PX).alpha = alpha;
    }

    protected setTile(layer: string, x: number, y: number, sprite: number): void {
        this.tilemap.putTile(sprite, x, y, layer);
    }

    protected getTile(layer: string, x: number, y: number): number {
        return this.tilemap.getTile(x, y, layer, true).index;
    }

    protected hasTile(layer: string, x: number, y: number): boolean {
        return this.tilemap.hasTile(x, y, layer);
    }

    protected removeTile(layer: string, x: number, y: number): void {
        this.tilemap.removeTile(x, y, layer);
    }

    protected tileToWorld(tileX: number, tileY: number): [number, number] {
        let tile = this.tilemap.getTile(tileX, tileY, undefined, true);
        return [
            tile.worldX + PhaserEngine.SPRITE_SIZE_PX / 2,
            tile.worldY + PhaserEngine.SPRITE_SIZE_PX / 2];
    }

    protected worldToTile(worldX: number, worldY: number): [number, number] {
        let tile = this.tilemap.getTileWorldXY(
            worldX,
            worldY,
            undefined,
            undefined,
            undefined,
            true);
        return [tile.x, tile.y];
    }
}

export default PhaserEngine;