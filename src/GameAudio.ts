const DEFAULT_AUDIO_LEVEL = 0.3;
// Name of all sounds for Phaser to reference
const defaultSound = 'default';
const defeatSound = 'defeat';
const healthLossSound = 'healthLoss';
const placeTowerSound = 'placeTower'
const selectSound = 'select';
const sellSound = 'sell'
const upgradeSound = 'upgrade';
const victorySound = 'victory';
const baseSoundUrl = 'sounds/';
const fileType = '.ogg';
const soundArray = [defaultSound, defeatSound, healthLossSound, placeTowerSound, selectSound, sellSound, upgradeSound, victorySound];
// Handles loading and setting up of all in game sounds.
export default class GameAudio {
    public defeatSound: Phaser.Sound;
    public enemyDeathSound: Phaser.Sound;
    public healthLossSound: Phaser.Sound;
    public placeTowerSound: Phaser.Sound;
    public selectTowerSound: Phaser.Sound;
    public sellTowerSound: Phaser.Sound;
    public upgradeTowerSound: Phaser.Sound;
    public victorySound: Phaser.Sound;

    constructor(private phaser: Phaser.Game) {
    }

    public preload() {
        soundArray.forEach(sound => this.phaser.load.audio(sound, baseSoundUrl + sound + fileType));
    }

    public create() {
        this.phaser.sound.volume = DEFAULT_AUDIO_LEVEL;
        this.defeatSound = this.phaser.add.audio(defeatSound);
        this.enemyDeathSound = this.phaser.add.audio(defaultSound);
        this.enemyDeathSound.allowMultiple = true;
        this.healthLossSound = this.phaser.add.audio(healthLossSound);
        this.placeTowerSound = this.phaser.add.audio(placeTowerSound);
        this.placeTowerSound.allowMultiple = true;
        this.selectTowerSound = this.phaser.add.audio(selectSound);
        this.sellTowerSound = this.phaser.add.audio(sellSound);
        this.upgradeTowerSound = this.phaser.add.audio(upgradeSound);
        this.upgradeTowerSound.allowMultiple = true;
        this.victorySound = this.phaser.add.audio(victorySound);
    }

    public playSelectTowerSound() {
        if (!this.placeTowerSound.isPlaying && !this.upgradeTowerSound.isPlaying) {
            this.selectTowerSound.play();
        }
    }

    public playEnemyDeathSound() {
        if (!this.healthLossSound.isPlaying) {
            this.enemyDeathSound.play();
        }
    }

    set muted(muted: boolean) {
        this.phaser.sound.mute = muted;
        if(!muted) {
            this.phaser.sound.volume = DEFAULT_AUDIO_LEVEL;
        }
    }

    get muted() {
        return this.phaser.sound.mute;
    }
}
