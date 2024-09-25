const { windowManager } = require("node-window-manager");
 
function getPrimaryWindow() {
    const window = windowManager.getPrimaryMonitor();
    return window;
}

function getActiveWindow() {
    const window = windowManager.getActiveWindow();
    return window;
}   

module.exports = {
    getPrimaryWindow,
    getActiveWindow
};