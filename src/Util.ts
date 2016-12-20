import * as RandomSeed from 'random-seed'

export interface Rng {
    random: () => number;
}

export function createRng(seed: string): Rng {
    return RandomSeed.create(seed);
}

export function getImagePath(imageName: string): string {
    return '/img/' + imageName;
}

export function getFontPath(imageName: string): string {
    return '/fonts/' + imageName;
}

export function spriteIndexToClass(idx: number): string {
    return 'sprite-' + idx.toString();
}

// Shuffles array
export function shuffle(a: Array<any>, rng: Rng) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(rng.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

// Returns a new HTMLElement created with the given information
export function createElement(type: string, className: string, text: string) : HTMLElement {
    let newElement = document.createElement(type);
    newElement.className = className;
    newElement.innerHTML = text;
    return newElement;
}

export function sqDist(p1: [number, number], p2: [number, number]) {
    return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
}

export interface ImmutableSet<T> {
    has(value: T): boolean;
    [Symbol.iterator]() : Iterator<T>;
}

export function getAd() {
    let adLinks = [
        'http://wisteria-life.appspot.com/',
        'http://the-scarlet-life.appspot.com',
        'http://firebrick-life.appspot.com',
        'http://canary-life.firebaseapp.com',
        'http://awesome-life-game.appspot.com',
        'http://purplelifegame.firebaseapp.com',
        'http://salmon-life.firebaseapp.com'
    ]
    let adBaseUrl = 'img/ads/'
    let defaultFileType = '.png';
    let adIndex = Math.floor(Math.random() * adLinks.length);
    let adElement = createElement('img', 'ad', '');
    adElement.setAttribute('src', adBaseUrl + adIndex + defaultFileType);
    adElement.setAttribute('alt', adLinks[adIndex]);
    let adLinkElement = createElement('a', 'ad-link', '');
    adLinkElement.setAttribute('href', adLinks[adIndex]);
    adLinkElement.setAttribute('target', '_blank');
    adLinkElement.appendChild(adElement);
    return adLinkElement;
}