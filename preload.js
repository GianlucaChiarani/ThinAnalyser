const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-btn').addEventListener('click', () => {
        ipcRenderer.invoke('quit-app');
    });
});