import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/database'
import TowerDefenseLevel from './TowerDefenseLevel'
import CustomLevel from './CustomLevel'

let AUTH_PROVIDER: firebase.auth.GoogleAuthProvider;

export interface CustomLevelIndexObject {
    uid: string,
    authorUid: string,
    name: string
}

function waitFor(promise: Promise<any>): Promise<any> {
    document.getElementById('loader').classList.remove('hidden');
    return promise.then(() => document.getElementById('loader').classList.add('hidden'));
}

// Firebase Hosting serves the project's web config at this reserved URL,
// so no config needs to live in the repo. For local dev, `firebase serve`
// (or `firebase emulators:start --only hosting`) serves it too.
const FIREBASE_INIT_URL = '/__/firebase/init.json';

export async function init(): Promise<void> {
    const response = await fetch(FIREBASE_INIT_URL);
    if (!response.ok) {
        throw new Error(`Could not load Firebase config from ${FIREBASE_INIT_URL} (${response.status})`);
    }
    firebase.initializeApp(await response.json());
    AUTH_PROVIDER = new firebase.auth.GoogleAuthProvider();
    return new Promise<void>(resolve => {
        let usub = firebase.auth().onAuthStateChanged((user: firebase.User) => {
            if(!user) firebase.auth().signInAnonymously();
            else {
                usub();
                resolve();
            }
        });
    });
}

export function logInOrOut(): void {
    if(firebase.auth().currentUser.isAnonymous) {
        firebase.auth().signInWithRedirect(AUTH_PROVIDER);
    }
    else {
        firebase.auth().signOut();
        location.reload();
    }
}

export function isUserGuest(): boolean {
    return firebase.auth().currentUser.isAnonymous;
}

export function getUserLevel(): Promise<number> {
    return <Promise<number>>firebase.database().ref()
            .child('users')
            .child(firebase.auth().currentUser.uid)
            .child('level')
            .once('value').then(value => {
                if(value.val() == null) return 1;
                return value.val();
            });
}

export function setUserLevel(level: number): Promise<void> {
    return <Promise<void>>waitFor(
        firebase.database().ref()
            .child('users')
            .child(firebase.auth().currentUser.uid)
            .child('level')
            .set(level));
}

export function getStoryLevel(levelNumber: number) {
        return <Promise<TowerDefenseLevel>>firebase.database().ref()
        .child('story-levels')
        .child(levelNumber.toString())
        .once('value').then(value => {
            if(value.val() == null) return 1;
            return TowerDefenseLevel.deserialize(value.val());
        });
}

export function getCustomLevel(uid: string) {
    return <Promise<CustomLevel>>firebase.database().ref()
        .child('custom-levels')
        .child(uid)
        .once('value').then(value => {
            return CustomLevel.deserialize(value.val());
        });
}

export function generateCustomLevelUid() {
    return firebase.database().ref().child('custom-levels').push().key;
}

export function saveCustomLevel(level: CustomLevel) {
    let serialized = level.serialize();
    let updates = {
        ['/custom-levels/' + level.uid]: serialized,
        ['/custom-levels-idx/' + level.uid]: {
            ['uid']: serialized.uid,
            ['authorUid']: serialized.authorUid,
            ['name']: serialized.name
        }
    };
    return <Promise<void>>waitFor(firebase.database().ref().update(updates));
}

export function getCustomLevelIndex(sortBy: string) {
    return <Promise<CustomLevelIndexObject[]>>firebase.database()
        .ref('custom-levels-idx')
        .orderByChild(sortBy)
        .once('value')
        .then((snapshot: firebase.database.DataSnapshot) => {
            let result: CustomLevelIndexObject[] = [];
            snapshot.forEach((childSnapshot) =>{
                result.push(childSnapshot.val());
                return false;
            });
            return result;
        });
}

export function getUserUid() {
    return firebase.auth().currentUser.uid;
}

export function getDisplayName() {
    return firebase.auth().currentUser.displayName;
}

// Gets
export function getPreference(preference: string) {
    return firebase.database().ref()
            .child('users')
            .child(firebase.auth().currentUser.uid)
            .child('preferences')
            .child(preference)
            .once('value').then(value => {
                if(value.val() == null) return null;
                return value.val();
            });
}

// Saves a given preference for the user
export function savePreference(preference: string, choice: any) {
    return firebase.database().ref()
            .child('users')
            .child(firebase.auth().currentUser.uid)
            .child('preferences')
            .child(preference)
            .set(choice);
}
