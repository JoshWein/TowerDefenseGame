import * as Backend from './BackendService'
import CustomLevel from './CustomLevel'
import * as Util from './Util'

let currentPage: number;
const LEVELS_PER_PAGE = 10;
let prev: HTMLElement;
let next: HTMLElement;
let levelIndex: Backend.CustomLevelIndexObject[];

export function init(): Promise<void> {
    currentPage = 0;
    prev = document.getElementById('prev-button');
    prev.addEventListener('click', () => {
        document.getElementById('loader').classList.remove('hidden');
        loadPage(--currentPage).then(() => document.getElementById('loader').classList.add('hidden'));
    });
    next = document.getElementById('next-button');
    next.addEventListener('click', () => {
        document.getElementById('loader').classList.remove('hidden');
        loadPage(++currentPage).then(() => document.getElementById('loader').classList.add('hidden'));
    });

    document.getElementById('my-levels-sort').addEventListener('click', () => {
        location.hash = 'me';
    });
    document.getElementById('by-author-sort').addEventListener('click', () => {
        location.hash = 'author';
    });
    document.getElementById('most-recent-sort').addEventListener('click', () => {
        location.hash = 'recent';
    });
    document.getElementById('by-name-sort').addEventListener('click', () => {
        location.hash = 'name';
    });


    let sortStr = location.hash.substr(1).toLowerCase();
    let promise: Promise<void>;
    if(sortStr === 'me') {
        // Show own levels, sort by recent
        document.getElementById('my-levels-sort').classList.add('sort-opt-active');
        promise = Backend.getCustomLevelIndex('authorUid').then((index) => {
            levelIndex = index.filter((obj) => obj.authorUid === Backend.getUserUid());
        });
    } else if(sortStr === 'author') {
        // Sort by author
        document.getElementById('by-author-sort').classList.add('sort-opt-active');
        promise = Backend.getCustomLevelIndex('authorUid').then((index) => {
            levelIndex = index;
        });
    } else if(sortStr === 'name') {
        // Sort by level name
        document.getElementById('by-name-sort').classList.add('sort-opt-active');
        promise = Backend.getCustomLevelIndex('name').then((index) => {
            levelIndex = index;
        });
    } else {
        // Sort by recent
        document.getElementById('most-recent-sort').classList.add('sort-opt-active');
        promise = Backend.getCustomLevelIndex('uid').then((index) => {
            levelIndex = index.reverse();
        });
    }

    return promise.then(() => loadPage(currentPage));
}

function loadPage(page: number) {
    let first = page * LEVELS_PER_PAGE;
    let last = first + LEVELS_PER_PAGE - 1;
    if(last >= levelIndex.length) {
        last = levelIndex.length - 1;
    }

    if(first === 0) {
        prev.classList.add('disabled');
    } else {
        prev.classList.remove('disabled');
    }

    if(last === levelIndex.length - 1) {
        next.classList.add('disabled');
    } else {
        next.classList.remove('disabled');
    }

    let promises = [];
    for(let i = first; i <= last; i++) {
        promises.push(Backend.getCustomLevel(levelIndex[i].uid));
    }

    return Promise.all(promises).then((levels) => {
        displayLevels(levels, Math.min(LEVELS_PER_PAGE, levels.length));
    });
}

function displayLevels(levelData: CustomLevel[], length: number) {
    document.getElementById('levels-row').innerHTML = '';
    for(let i = 0; i < length; i++){
        let levelLink = Util.createElement('a', 'level-link', '');
        levelLink.setAttribute('href','play.html#' + levelData[i].uid);
        // Create image
        let levelImage = Util.createElement('img', 'image-thumbnail', levelData[i].name);
        levelImage.setAttribute('alt',levelData[i].name);
        levelImage.setAttribute('src',levelData[i].thumbnail);
        // Create all level metadata
        levelLink.appendChild(levelImage);
        levelLink.appendChild(createMetadata(levelData[i]));
        let custLevel = Util.createElement('div', 'custom-level', '');
        custLevel.appendChild(levelLink);
        document.getElementById('levels-row').appendChild(custLevel);
    }
}

function createMetadata(levelInfo: CustomLevel) {
    let levelMetadata = Util.createElement('div', 'level-metadata', '');
    let levelName = Util.createElement('div', 'level-info', levelInfo.name);
    let authorName = Util.createElement('div', 'level-info', 'By: ' + levelInfo.authorName);
    let waves = Util.createElement('div', 'level-info', 'Waves: ' + levelInfo.level.waveData.length);
    levelMetadata.appendChild(levelName);
    levelMetadata.appendChild(authorName);
    levelMetadata.appendChild(waves);
    return levelMetadata;
}
