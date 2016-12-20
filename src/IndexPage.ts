import * as Backend from './BackendService'

export function init(): Promise<void> {
    let signInBtn = document.getElementById('index-sign-in-button');
    signInBtn.addEventListener('click', Backend.logInOrOut);
    if(!Backend.isUserGuest()) signInBtn.innerText = "Logout";
    else document.getElementById('index-editor-button').classList.add('disabled');
    return Promise.resolve();
}