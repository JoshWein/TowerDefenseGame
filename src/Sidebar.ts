import TowerDefenseGame from './TowerDefenseGame'

export default class Sidebar {
    public sidebarElement: HTMLElement;
    private sidebarNubElement: HTMLElement;
    private sidebarNubIcon: HTMLElement;
    private sidebarHelpElement: HTMLElement;
    private helpElement: HTMLElement;
    private phaserInstance: TowerDefenseGame;
    private wasPaused: boolean;

    constructor(phaserInstance?: TowerDefenseGame) {
        if(phaserInstance)
            this.phaserInstance = phaserInstance;
        this.sidebarElement = document.getElementById('sidebar');
        this.sidebarNubElement = document.getElementById('sidebar-nub');
        this.sidebarNubIcon = <HTMLElement>this.sidebarNubElement.children[0];
        this.sidebarNubElement.addEventListener('click', () => this.toggleSidebar());
        this.helpElement = document.getElementById('help-modal');
        this.sidebarHelpElement = document.getElementById('help-nub');
        this.sidebarHelpElement.addEventListener('click', () => this.openHelp());
        document.getElementById('close-help').addEventListener('click', () => this.closeHelp());
    }

    // Toggles sidebar visibility and change nub icon
    private toggleSidebar() {
        this.sidebarElement.classList.toggle('active');
        if(this.sidebarElement.classList.contains('active')) {
            this.sidebarNubIcon.classList.add('fa-long-arrow-right');
            this.sidebarNubIcon.classList.remove('fa-long-arrow-left');
        } else {
            this.sidebarNubIcon.classList.add('fa-long-arrow-left');
            this.sidebarNubIcon.classList.remove('fa-long-arrow-right');
        }
    }

    private openHelp() {
        this.helpElement.classList.toggle('hidden');
        if (this.phaserInstance) {
            this.wasPaused = this.phaserInstance.paused;
            this.phaserInstance.paused = true;
        }
    }

    private closeHelp() {
        this.helpElement.classList.toggle('hidden');
        if (this.phaserInstance) {
            if (!this.wasPaused) {
                this.phaserInstance.paused = false;
            }
        }
    }
}