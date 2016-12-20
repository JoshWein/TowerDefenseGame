import * as Backend from './BackendService'
import MapEditorEngine from './MapEditorEngine'
import TowerType from './TowerType'
import EnemyType from './EnemyType'
import WaveConfiguration from './WaveConfiguration'
import TowerDefenseLevel from './TowerDefenseLevel'
import CustomLevel from './CustomLevel'
import Sidebar from './Sidebar'

export enum TileType{
    Default=0,
    Start=1,
    End=2,
    Delete=3,
    Environment=4
};

const DELETE_SPRITE = 18;
const START_SPRITE = 20;
const END_SPRITE = 21;
export const PATH_SPRITES = [0, 2, 1, 3];
const EXTRA_SPRITES = [180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, DELETE_SPRITE];
const SPRITES = [7, 6, 5, 4, 30, 60, 90, 120, 31, 61, 91, 121, 32, 62, 92, 122, 33, 63, 93, 123, 34, 64, 94, 124, 35, 65, 95, 125, 40, 70, 100, 130, 41, 71, 101, 131, 42, 72, 102, 132, 43, 73, 103, 133, 44, 74, 104, 134, 45, 75, 105, 135, 46, 76, 106, 136, 47, 77, 107, 137, 48, 78, 108, 138, 49, 79, 109, 139, 50, 80, 110, 140, 51, 81, 111, 141, 52, 82, 112, 142, 53, 83, 113, 143, 54, 84, 114, 144, 55, 85, 115, 145, 56, 86, 116, 146, 57, 87, 117, 147];
const START_SPRITES = [START_SPRITE, END_SPRITE, DELETE_SPRITE];

var selectedTileElement: HTMLElement;
var selectedSprite: number;
var isEnvironment: boolean;
var editorEngine: MapEditorEngine;
var leveluid: string = null;
var towerConfig = TowerType.TYPES.map(_ => true);

export function init() {
    if(Backend.isUserGuest()) location.href = ".";
    let resourceIdentifier = location.hash.substr(1);

    return new Promise((resolve) => {
        if(resourceIdentifier === "") {
            resolve();
        } else {
            resolve(Backend.getCustomLevel(resourceIdentifier));
        }
    }).then((level?: CustomLevel) => {
        if(level && level.authorUid !== Backend.getUserUid()) {
            location.href = "/404.html";
        }
        return level;
    }).then((initialLevel?: CustomLevel) => {
        if(initialLevel) {
            leveluid = initialLevel.uid;
            towerConfig = initialLevel.level.towerConfig;
            (<HTMLInputElement>document.getElementById("wave-editor-num-waves-value"))
                .value = initialLevel.level.waveData.length.toString();
            (<HTMLInputElement>document.getElementById('wave-editor-starting-coins-input'))
                .value = initialLevel.level.startgold.toString();
            (<HTMLInputElement>document.getElementById('wave-editor-level-name-input'))
                .value = initialLevel.name;
        }

        initMapEditor(initialLevel ? initialLevel.level : undefined);
        initWaveEditor(initialLevel ? initialLevel.level.waveData : undefined);
    });
}

// Map editor scripts
function initMapEditor(initialLevel?: TowerDefenseLevel) {
    let tileTable = <HTMLTableElement>document.getElementById('tile-chooser-table');
    let extraTileTable = <HTMLTableElement>document.getElementById('extra-tile-chooser-table');
    let pathTileTable = <HTMLTableElement>document.getElementById('path-tile-chooser-table');
    let startTileTable = <HTMLTableElement>document.getElementById('start-tile-chooser-table');
    selectedTileElement = document.getElementById('selected-tile');
    loadRow(PATH_SPRITES, pathTileTable, false);
    loadRow(START_SPRITES, startTileTable, true);
    loadRow(SPRITES, tileTable, false);
    loadRow(EXTRA_SPRITES, extraTileTable, true);
    selectSprite(PATH_SPRITES[0], false);
    let invalidInputModalElement = document.getElementById("invalid-input-modal");
    invalidInputModalElement.addEventListener('click', () => invalidInputModalElement.classList.add("hidden"));
    let successModalElement= document.getElementById("success-modal");
    successModalElement.addEventListener('click', () => successModalElement.classList.add("hidden"));
    editorEngine = new MapEditorEngine('phaser', initialLevel);
    new Sidebar();

    document.getElementById('play-now-button').addEventListener('click', () => {
        location.href = '/play.html#' + leveluid;
    });

    document.getElementById('share-link-copy-btn').addEventListener('click', (e) => {
        (<HTMLInputElement>document.getElementById('share-link')).select();
        document.execCommand('copy');
        e.stopPropagation();
    });

    let prefUpdate = document.getElementById('instr-pref-update');
    prefUpdate.addEventListener('click', () => {
        if (prefUpdate.classList.contains("show")) {
            prefUpdate.classList.remove("show");
            Backend.savePreference('showEditInstructions', false);
            prefUpdate.innerHTML = "Show at Start";
        } else {
            prefUpdate.classList.add("show");
            Backend.savePreference('showEditInstructions', true);
            prefUpdate.innerHTML = "Don't Show at Start";
        }
    });
    Backend.getPreference('showEditInstructions').then(pref => {
        if (pref != null && pref == true) {
           document.getElementById('help-modal').classList.remove('hidden');
        } else {
           prefUpdate.classList.remove("show");
           prefUpdate.innerHTML = "Show at Start";
        }
    });
}

function loadRow(array: number[], table: HTMLTableElement, isEnv: boolean) {
    for(let i = 0, row = <HTMLTableRowElement>undefined; i < array.length; i++) {
        if(i % 4 == 0) {
            row = table.insertRow(-1);
        }
        let elem = createElement("div", "sprite sprite-" + array[i].toString(), "");
        elem.addEventListener('click', () => {
            selectSprite(array[i], isEnv);
        });
        row.insertCell(-1).appendChild(elem);
    }
}

function selectSprite(sprite: number, isEnv: boolean) {
    if(selectedSprite != undefined) {
        selectedTileElement.classList.remove('sprite-' + selectedSprite.toString());
    }
    selectedTileElement.classList.add('sprite-' + sprite.toString());
    selectedSprite = sprite;
    isEnvironment = isEnv;
}

export function getSelectedSprite(): number {
    return selectedSprite;
}

export function getTileType(): TileType {
    if(isEnvironment){
        if(selectedSprite == START_SPRITE) return TileType.Start;
        if(selectedSprite == END_SPRITE) return TileType.End;
        if(selectedSprite == DELETE_SPRITE) return TileType.Delete;
        return TileType.Environment;
    }
    return TileType.Default;
}

// Wave editor scripts
let numWaves: number;
let numExistingConfigs: number;
function initWaveEditor(initialWaveData?: WaveConfiguration[]) {
    numWaves = parseInt((<HTMLInputElement>document.getElementById("wave-editor-num-waves-value")).value);
    (<HTMLInputElement>document.getElementById("wave-editor-num-waves-value")).addEventListener('input',waveEditorChangeWaveNumber);
    numExistingConfigs = numWaves;
    document.getElementById('wave-editor-tab').addEventListener('click', () => toggleActiveEditorTab());
    document.getElementById('map-editor-tab').addEventListener('click', () => toggleActiveEditorTab());
    document.getElementById('save-button').addEventListener('click', () => trySaveCustomLevel());
    loadTowerInfo();
    loadEnemyInfo();
    spawnWaveConfigs(initialWaveData);
}

function loadTowerInfo() {
    for(let i = 0; i < TowerType.TYPES.length; i++) {
        let type = TowerType.TYPES[i];
        let towersTable = document.getElementById("wave-editor-towers-allowed-table");
        let newTowerCard = createElement("div", "tower-card", "");
        let newTowerLabel = createElement("label", "", type.name);
        newTowerCard.appendChild(newTowerLabel);
        let newTowerInfo = createElement("div", "tower-info", "");
        newTowerInfo.appendChild(createElement("div", "sprite sprite-" + type.sprite, ""));
        let newTowerInfoTexts = createElement("div", "tower-info-labels", "");
        newTowerInfoTexts.appendChild(createElement("div", "tower-info-text", "Damage: " + type.damage));
        newTowerInfoTexts.appendChild(createElement("div", "tower-info-text", "Range: " + type.range));
        newTowerInfoTexts.appendChild(createElement("div", "tower-info-text", "Cooldown: " + type.cooldown));
        newTowerInfoTexts.appendChild(createElement("div", "tower-info-text", "Cost: " + type.cost));
        newTowerInfo.appendChild(newTowerInfoTexts);
        newTowerCard.appendChild(newTowerInfo);

        let toggleElement = document.createElement('input');
        toggleElement.type = "checkbox";
        toggleElement.checked = towerConfig[i];
        toggleElement.addEventListener(
            'change',
            () => towerConfig[i] = toggleElement.checked);

        let sliderElement = document.createElement('div');
        sliderElement.classList.add('slider', 'round');
        let labelElement = document.createElement('label');
        labelElement.classList.add('switch');

        labelElement.appendChild(toggleElement);
        labelElement.appendChild(sliderElement);
        newTowerCard.appendChild(labelElement);

        towersTable.appendChild(newTowerCard);
    }
}

function loadEnemyInfo() {
    for(let i = 0; i < EnemyType.TYPES.length; i++) {
        let type = EnemyType.TYPES[i];
        let enemyInfoList = document.getElementById("enemy-info-list");
        let newEnemyInfo = createElement("div", "enemy-info", "");
        newEnemyInfo.appendChild(createElement("div", "sprite sprite-" + type.sprite, ""));
        let newEnemyInfoContainer = createElement("div", "enemy-info-text-container", "");
        newEnemyInfoContainer.appendChild(createElement("div", "enemy-info-text", type.name));
        newEnemyInfoContainer.appendChild(createElement("div", "enemy-info-text", "Health: " + type.health));
        newEnemyInfoContainer.appendChild(createElement("div", "enemy-info-text", "Speed: " + type.speed));
        newEnemyInfoContainer.appendChild(createElement("div", "enemy-info-text", "Value: " + type.value));
        newEnemyInfo.appendChild(newEnemyInfoContainer);
        enemyInfoList.appendChild(newEnemyInfo);
    }
}

// Returns a new HTMLElement created with the given information
function createElement(type: string, className: string, text: string) : HTMLElement {
    let newElement = document.createElement(type);
    newElement.className = className;
    newElement.innerHTML = text;
    return newElement;
}

export function spawnWaveConfigs(initialData?: WaveConfiguration[]){
    for(let i = 1; i <= numWaves; i++){
        if(document.getElementById("wave-editor-wave-" + i) !== null){
            document.getElementById("wave-editor-wave-" + i).style.display = "inline-block";
        } else{
            let wavesContainer = document.getElementById("wave-editor-waves-container");
            let newWaveInner = '<label class="wave-editor-wave-label">Wave ' + i + '</label>';
            newWaveInner += '<table class="wave-editor-wave-table">';
            for(let type = 0; type < EnemyType.TYPES.length; type++) {
                newWaveInner = addNewEnemyRow(newWaveInner, type, i, initialData ? initialData[i-1].enemyInfo.get(type) : undefined);
            }
            newWaveInner += '</table></div>';
            let newWave = createElement("div", "wave-editor-wave-container", newWaveInner);
            newWave.id = "wave-editor-wave-" + i;
            wavesContainer.appendChild(newWave);
        }
    }
}

function addNewEnemyRow(htmlString: string, enemyType: number, index: number, val?: number) {
    if(!val) {
        val = 0;
    }
    let type = EnemyType.TYPES[enemyType];
    htmlString += '<tr><td class="wave-editor-enemy-label">'+type.name+'</td>';
    htmlString += '<td class="wave-editor-enemy-cell"><input id="wave-editor-wave-'+index+'-'+type.sprite+'" class="wave-editor-enemy-input" type="number" onkeydown="return false" min=0 max=40 value=' + val.toString() + '></td></tr>';
    return htmlString;
}

export function clearUnusedWaves(){
    for(let i = numWaves + 1; i <= numExistingConfigs; i++){
        document.getElementById("wave-editor-wave-" + i).style.display = "none";
    }
}

export function waveEditorChangeWaveNumber(){
    numWaves = parseInt((<HTMLInputElement>document.getElementById("wave-editor-num-waves-value")).value);
    numExistingConfigs = Math.max(numExistingConfigs,numWaves);
    clearUnusedWaves();
    spawnWaveConfigs();
}

// Toggles the visibility of the map editor and wave editor
function toggleActiveEditorTab() {
    document.getElementById('map-editor-tab').classList.toggle('active');
    document.getElementById('wave-editor-tab').classList.toggle('active');
    document.getElementById('map-editor-content').classList.toggle('hidden');
    document.getElementById('wave-editor-content').classList.toggle('hidden');
    document.getElementById('map-editor-sidebar').classList.toggle('hidden');
    document.getElementById('wave-editor-sidebar').classList.toggle('hidden');
}

function trySaveCustomLevel() {
    let invalidStrings : string[] = [];
    let isValid = checkMapEditorState(invalidStrings);
    let levelName = (<HTMLInputElement>document.getElementById('wave-editor-level-name-input')).value;
    isValid = checkWaveEditorState(invalidStrings, isValid, levelName);
    let waveData : WaveConfiguration[] = [];
    for(let waveIndex = 1; waveIndex <= numWaves; waveIndex++){
        let waveMap = new Map<number,number>();
        for(let enemyTypeNum = 0; enemyTypeNum < EnemyType.TYPES.length; enemyTypeNum++){
            let enemySprite = EnemyType.TYPES[enemyTypeNum].sprite;
            let enemyAmount = parseInt((<HTMLInputElement>document.getElementById('wave-editor-wave-' + waveIndex + '-' + enemySprite)).value);
            if(enemyAmount > 0){
                waveMap.set(enemyTypeNum, enemyAmount);
            }
        }
        if(waveMap.size == 0){
            isValid = false;
            invalidStrings.push("<li>Please make sure each wave on the wave-editor has at least 1 enemy</li>");
            break;
        }
        waveData.push(new WaveConfiguration(waveMap));
    }

    if(!isValid){
        document.getElementById("invalid-input-modal-list").innerHTML = invalidStrings.join("");
        document.getElementById("invalid-input-modal").classList.remove("hidden");
        return;
    }
    let map = editorEngine.toMapData();
    let startCoords = editorEngine.getStartCoords();
    let endCoords = editorEngine.getEndCoords();
    let startGold = parseInt((<HTMLInputElement>document.getElementById('wave-editor-starting-coins-input')).value);
    // Create customlevel and save
    let towerDefenseLevel = new TowerDefenseLevel(
        map,
        startGold,
        waveData,
        startCoords,
        endCoords,
        levelName,
        towerConfig);
    if(leveluid == null){
        leveluid = Backend.generateCustomLevelUid();
    }
    let customLevel = new CustomLevel(
        leveluid,
        towerDefenseLevel,
        levelName,
        Backend.getDisplayName(),
        editorEngine.generateThumbnail(),
        Backend.getUserUid());
    Backend.saveCustomLevel(customLevel).then(() =>{
        document.getElementById("success-modal").classList.remove("hidden");
        loadShareWidgets(leveluid);
    });
}

function checkMapEditorState(invalidStrings : string[]) {
    let isValid = true;
    if(!editorEngine.hasPath()){
        isValid = false;
        invalidStrings.push("<li>Please create a valid path (using path tiles) from start (spaceship) to finish (castle)</li>");
    }
    if(editorEngine.hasEmptyTiles()) {
        isValid = false;
        invalidStrings.push("<li>Please ensure that every tile on the map is filled</li>");
    }
    return isValid;
}

function checkWaveEditorState(invalidStrings : string[], isValid : boolean, levelName : string) {
    // From Wave Editor
    if(levelName == ""){
        isValid = false;
        invalidStrings.push("<li>Please give your level a name on the wave-editor page (use the sidebar)</li>");
    }

    if(towerConfig.filter(allowed => allowed).length === 0) {
        isValid = false;
        invalidStrings.push("<li>At least one tower type must be enabled</li>");
    }
    return isValid;
}

function loadShareWidgets(url : string) {console.log(window.location.href.split("/"));
    let urlStart =   "http://" + window.location.href.split("/")[2] + "/play.html";
    // One version for sharing
    let encodedUrl = urlStart + "%23" + url;
    // One version for copying
    let fullUrl = urlStart + "#" + url;
    document.getElementById("share-link").setAttribute("value", fullUrl);
    // Twitter button
    document.getElementById("twitter-share-button").setAttribute("href", "http://twitter.com/share?url=" + encodedUrl + "&text=" + encodeURI("I just created a level in IKB Life! Check it out: "));
    // Facebook button
    document.getElementById("facebook-share-button").setAttribute("href", "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl);
    console.log(document.getElementById("twitter-share-button"));
    document.getElementById("twitter-share-button").addEventListener('click', (e) => {
        e.stopPropagation();
    });
    document.getElementById("facebook-share-button").addEventListener('click', (e) => {
        e.stopPropagation();
    });
}