import * as Backend from './BackendService'
import * as PlayPage from './PlayPage'
import * as IndexPage from './IndexPage'
import * as EditorPage from './EditorPage'
import * as LevelsPage from './LevelsPage';
import * as CustomLevelsPage from './CustomLevelsPage'
import * as AboutPage from './AboutPage'

window.addEventListener('orientationchange', function () {
    var originalBodyStyle = getComputedStyle(document.body).getPropertyValue('display');
    document.body.style.display='none';
    setTimeout(function () {
        document.body.style.display = originalBodyStyle;
    }, 200);
});

function load() : Promise<void> {
    return new Promise<void>(resolve => window.onload = () => resolve());
}

function loadFonts() {
    return Promise.all([
        (<any>document).fonts.load('12pt "Wendy One"')
    ]);
}

Promise.all([load(), Backend.init(), loadFonts()]).then(() => {
    switch(document.body.id) {
        case 'play-page':
            return PlayPage.init();
        case 'index-page':
            return IndexPage.init();
        case 'levels-page':
            return LevelsPage.init();
        case 'editor-page':
            return EditorPage.init();
        case 'custom-levels-page':
            return CustomLevelsPage.init();
        case 'about-page':
            return AboutPage.init();
    }
    return null;
}).then(() => {
    document.getElementById('loader').classList.add('hidden');
    window.onhashchange = () => location.reload();
});