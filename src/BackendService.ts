import * as firebase from 'firebase'
import { FIREBASE_CONFIG } from './LocalConstants'
import TowerDefenseLevel from './TowerDefenseLevel'
import CustomLevel from './CustomLevel'

const AUTH_PROVIDER = new firebase.auth.GoogleAuthProvider();

export interface CustomLevelIndexObject {
    uid: string,
    authorUid: string,
    name: string
}

function waitFor(promise: firebase.Promise<any>): firebase.Promise<any> {
    document.getElementById('loader').classList.remove('hidden');
    return promise.then(() => document.getElementById('loader').classList.add('hidden'));
}

export function init(): Promise<void> {
    firebase.initializeApp(FIREBASE_CONFIG);
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
