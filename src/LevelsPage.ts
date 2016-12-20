import * as Backend from './BackendService'

export function init(): Promise<void> {
    return Backend.getUserLevel().then(userProgress => {
        let levelElements = [];
        let curTotalLevel = 0;
        for (let world = 1; world <= 4; world++) {
            levelElements.push("<div class='world-section' id='world-" + world + "-section'>");
            levelElements.push("<h2 class='world-header'>World "+ world +"</h2>");
            levelElements.push("<div class='levels-container'>");
            levelElements.push("<div class='levels-row'>");
            for (let level = 1; level <= 10; level++) {
                if (level == 6) {
                    levelElements.push("</div><div class='levels-row'>");
                }
                curTotalLevel = level + (world*10 - 10);
                if (curTotalLevel > userProgress) {
                    levelElements.push("<a href='' class='level-link locked'><i class='fa fa-lock'></i></a>");
                } else {
                    levelElements.push("<a href='play.html#"+ curTotalLevel + "' class='level-link'>"+ world + "-" + level + "</a>");
                }
            }
            levelElements.push('</div></div></div>');
        }
        document.getElementById("level-select-container").innerHTML = levelElements.join("");
    });
}