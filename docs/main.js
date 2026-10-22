import { WebChessGame } from './web_chess_game.js';
import { maiaEngine } from './maia_engine.js';

const boardContainer = document.querySelector(".board-container");
if (boardContainer) {
    new WebChessGame(boardContainer);
}

// Automatically register Service Worker and persist all assets + Maia models in local browser cache
if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        }
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().catch(() => {});
        }
        setTimeout(() => {
            maiaEngine.warmCache();
        }, 500);
    });
}
