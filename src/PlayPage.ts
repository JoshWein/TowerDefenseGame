import * as Backend from './BackendService'
import TowerDefenseGame from './TowerDefenseGame'
import Tower from './Tower'
import TowerType from './TowerType'
import * as Util from './Util';
import Sidebar from './Sidebar';

let currentLevel: number;
let userLevel: number;
let userMute: boolean;

let sidebar: Sidebar;
let gameControlButtonElement: HTMLElement;

let towersElement: HTMLElement;
let nameElement: HTMLElement;
let damageElement: HTMLElement;
let rangeElement: HTMLElement;
let cooldownElement: HTMLElement;
let costElement: HTMLElement;

let selectedTowerInfoElement: HTMLElement;
let selectedTowerSpriteElement: HTMLElement;
let selectedTowerTypeElement: HTMLElement;
let selectedTowerDamageElement: HTMLElement;
let selectedTowerRangeElement: HTMLElement;
let selectedTowerCooldownElement: HTMLElement;
let selectedTowerValueElement: HTMLElement;

let upgradeElement: HTMLElement;
let sellElement: HTMLElement;

let nextLevelButton: HTMLElement;
let tryAgainButton: HTMLElement;

let winOverlayElement: HTMLElement;
let loseOverlayElement: HTMLElement;
let infoOverlayElement: HTMLElement;
let levelInfoElement: HTMLElement;
let helpInfoElement: HTMLElement;

let editLevelNavLinkElement: HTMLAnchorElement;

let muteElement: HTMLElement;

let selectedTower: Tower;

let game: TowerDefenseGame;

let isCustom = false;

export function init(): Promise<void> {
    initHTMLElements();
    initEventHandlers();

    return Promise.all([Backend.getUserLevel(), Backend.getPreference('muteSound')])
        .then(([lvl, mute]) => {
            if(mute === undefined) {
                mute = false;
            }

            userLevel = lvl;
            userMute = mute;
            if(userMute) {
                toggleMuteElement();
            }
        }).then(() => {
            let resourceIdentifier = location.hash.substr(1);
            if(/^\d+$/.test(resourceIdentifier) || resourceIdentifier === "") {
                // Story level
                currentLevel = parseInt(location.hash.substr(1), 10);
                if(isNaN(currentLevel) || currentLevel > userLevel) {
                    currentLevel = userLevel;
                    location.hash = currentLevel.toString();
                }
                return Backend.getStoryLevel(currentLevel);
            } else {
                // Custom level
                isCustom = true;
                return Backend.getCustomLevel(resourceIdentifier)
                    .then(customLevel => {
                        if(customLevel.authorUid === Backend.getUserUid()) {
                            editLevelNavLinkElement.href = "/editor.html#" + customLevel.uid;
                            editLevelNavLinkElement.classList.remove('hidden');
                        }
                        return customLevel.level;
                    });
            }
        }).then(level => {
            game = new TowerDefenseGame('phaser', level);
            game.onLoadCallback = () => {
                game.muted = userMute;
            }
            game.levelCompleteCallback = won => onLevelComplete(won);
            game.towerSelectCallback = tower => onSelectTower(tower);
            for (let i = 0; i < TowerType.TYPES.length; i++) {
                if(level.towerConfig[i]) {
                    addTowerType(TowerType.TYPES[i]);
                }
            }
            sidebar = new Sidebar(game);
            sidebar.sidebarElement.classList.add('active');
            levelInfoElement.innerText = level.levelInfo;
            helpInfoElement.innerText = level.levelInfo;
            infoOverlayElement.classList.remove('hidden');
        }).catch(() => {
            location.href = "/404.html";
        });
}

function initHTMLElements() {
    gameControlButtonElement = document.getElementById('play-wave-control-button');
    towersElement = document.getElementById('sidebar-towers');
    nameElement = document.getElementById('tower-name');
    damageElement = document.getElementById('tower-damage');
    rangeElement = document.getElementById('tower-range');
    cooldownElement = document.getElementById('tower-cooldown');
    costElement = document.getElementById('tower-cost');
    selectedTowerInfoElement = document.getElementById('selected-tower-info');
    selectedTowerSpriteElement = document.getElementById('selected-tower-sprite');
    selectedTowerTypeElement = document.getElementById('selected-tower-type');
    selectedTowerDamageElement = document.getElementById('selected-tower-damage');
    selectedTowerRangeElement = document.getElementById('selected-tower-range');
    selectedTowerCooldownElement = document.getElementById('selected-tower-cooldown');
    selectedTowerValueElement = document.getElementById('selected-tower-value');
    upgradeElement = document.getElementById('upgrade-selected');
    sellElement = document.getElementById('sell-selected');
    nextLevelButton = document.getElementById('next-level-button');
    tryAgainButton = document.getElementById('try-again-button');
    winOverlayElement = document.getElementById('win-overlay');
    loseOverlayElement = document.getElementById('lose-overlay');
    infoOverlayElement = document.getElementById('info-overlay');
    levelInfoElement = document.getElementById('level-info');
    helpInfoElement = document.getElementById('help-level-info');
    editLevelNavLinkElement = <HTMLAnchorElement>document.getElementById('edit-level-nav-link');
    muteElement = document.getElementById('sound-control');
}

function initEventHandlers() {
    nextLevelButton.addEventListener('click', () => onClickNextLevel());
    tryAgainButton.addEventListener('click', () => location.reload());
    gameControlButtonElement.addEventListener('click', () => onClickGameControl());
    infoOverlayElement.addEventListener('click', () => infoOverlayElement.classList.add('hidden'));
    upgradeElement.addEventListener('click', () => game.upgradeSelectedTower());
    sellElement.addEventListener('click', () => game.sellSelectedTower());
    muteElement.addEventListener('click', () => {
        toggleMuteElement();
        game.muted = !game.muted;
        Backend.savePreference('muteSound', game.muted);
    });
}

function toggleMuteElement() {
    muteElement.classList.toggle('fa-volume-up');
    muteElement.classList.toggle('fa-volume-off');
}

function onClickGameControl() {
    if(gameControlButtonElement.innerText === "Pause") {
        gameControlButtonElement.innerText = "Resume";
    } else {
        gameControlButtonElement.innerText = "Pause";
    }
    game.paused = !game.paused;
}

function onLevelComplete(won: boolean) {
    if(won && currentLevel === userLevel && currentLevel < 40) {
        Backend.setUserLevel(userLevel + 1).then(() => showLevelCompleteOverlay(won));
    } else {
        showLevelCompleteOverlay(won);
    }
}

function showLevelCompleteOverlay(won: boolean) {
    if(isCustom) {
        if (won) {
            document.getElementById('main-menu-btn-win').classList.add("hidden");
            document.getElementById('custom-levels-btn-win').classList.remove("hidden");
        } else {
            document.getElementById('main-menu-btn-lose').classList.add("hidden");
            document.getElementById('custom-levels-btn-lose').classList.remove("hidden");
        }
        nextLevelButton.classList.add('hidden');
    }
    if (won && currentLevel == 40) {
        showGameCompleteOverlay();
    } else {
        won ? showOverlay(winOverlayElement, 'win-ad-space')
            : showOverlay(loseOverlayElement, 'lose-ad-space');
    }
}

function showOverlay(elem: HTMLElement, adElement: string) {
    elem.classList.remove('hidden');
    document.getElementById(adElement).appendChild(Util.getAd());
}

function showGameCompleteOverlay() {
    document.getElementById('game-complete-overlay').classList.remove('hidden');
}

function onSelectTower(tower: Tower) {
    if(tower === undefined) {
        selectedTower = undefined;
        selectedTowerInfoElement.classList.add('hidden');
        return;
    }

    if(selectedTower === undefined) {
        selectedTowerInfoElement.classList.remove('hidden');
    } else {
        selectedTowerSpriteElement.classList
            .remove(Util.spriteIndexToClass(selectedTower.type.sprite));
    }

    selectedTower = tower;
    selectedTowerSpriteElement.classList
        .add(Util.spriteIndexToClass(selectedTower.type.sprite));
    selectedTowerTypeElement.innerText = tower.type.name;
    selectedTowerDamageElement.innerText = "" + tower.damage;
    selectedTowerRangeElement.innerText = "" + tower.range;
    selectedTowerCooldownElement.innerText = "" + tower.cooldown;
    selectedTowerValueElement.innerText = "" + tower.value;
}

function onClickNextLevel() {
    location.hash = '#' + (currentLevel + 1).toString();
    location.reload();
}

function addTowerType(type: TowerType): void {
    let typeElement = createHTMLElementForTowerType(type);
    typeElement.addEventListener('click', () => {
        onClickTowerTypeElement(typeElement, type);
    });
    towersElement.appendChild(typeElement);
    if(game.selectedTowerType === undefined) {
        onClickTowerTypeElement(typeElement, type);
    }
}

function onClickTowerTypeElement(typeElement: HTMLElement, type: TowerType): void {
    setAllTowerTypesInactive();
    typeElement.classList.add('active');
    nameElement.innerText = type.name;
    damageElement.innerText = type.damage.toString();
    rangeElement.innerText = type.range.toString();
    cooldownElement.innerText = type.cooldown.toString();
    costElement.innerText = type.cost.toString();
    game.selectedTowerType = type;
}

function createHTMLElementForTowerType(type: TowerType): HTMLElement {
    let typeElement = document.createElement('td');
    let spriteElement = document.createElement('div');
    spriteElement.classList.add('tower');
    spriteElement.classList.add(Util.spriteIndexToClass(type.sprite));
    typeElement.appendChild(spriteElement);
    return typeElement;
}

function setAllTowerTypesInactive(): void {
    Array.from(towersElement.children).forEach((child) => {
        child.classList.remove('active');
    });
}