import { WebChessGame } from './web_chess_game.js';
import { maiaEngine } from './maia_engine.js';

const CACHE_NAME = "chess-offline-cache-v2";
const OFFLINE_FLAG_KEY = "chess_offline_complete_v2";

const OFFLINE_ASSETS = [
    { url: "./index.html", label: "App Shell" },
    { url: "./style.css", label: "Stylesheet" },
    { url: "./manifest.json", label: "Web Manifest" },
    { url: "./favicon.png", label: "App Icon" },
    { url: "./chessboard.png", label: "Chessboard Texture" },
    { url: "./main.js", label: "Core App Script" },
    { url: "./web_chess_game.js", label: "Game Controller" },
    { url: "./chess_game.js", label: "Chess Rules Engine" },
    { url: "./ai_player.js", label: "AI Controller" },
    { url: "./maia_engine.js", label: "Maia Neural Engine" },
    { url: "./analysis_board.js", label: "Board Analyzer" },
    { url: "./board_builder.js", label: "Board Builder" },
    { url: "./board_element.js", label: "Board Renderer" },
    { url: "./board_position.js", label: "Coordinates" },
    { url: "./chess_clock.js", label: "Chess Clock" },
    { url: "./end_card.js", label: "Game End Dialog" },
    { url: "./move_tracker.js", label: "Move Tracker" },
    { url: "./notation.js", label: "Algebraic Notation" },
    { url: "./observer.js", label: "Observer Module" },
    { url: "./opening_book.js", label: "Opening Book" },
    { url: "./piece.js", label: "Piece Base" },
    { url: "./promotion_card.js", label: "Promotion Dialog" },
    { url: "./sound_effects.js", label: "Sound Synthesizer" },
    { url: "./subject.js", label: "Subject Module" },
    { url: "./pieces/bishop.js", label: "Bishop Logic" },
    { url: "./pieces/empty_piece.js", label: "Empty Square Logic" },
    { url: "./pieces/king.js", label: "King Logic" },
    { url: "./pieces/knight.js", label: "Knight Logic" },
    { url: "./pieces/pawn.js", label: "Pawn Logic" },
    { url: "./pieces/queen.js", label: "Queen Logic" },
    { url: "./pieces/rook.js", label: "Rook Logic" },
    { url: "./assets/bishop_b.png", label: "Piece Assets" },
    { url: "./assets/bishop_w.png", label: "Piece Assets" },
    { url: "./assets/king_b.png", label: "Piece Assets" },
    { url: "./assets/king_b_check.png", label: "Piece Assets" },
    { url: "./assets/king_w.png", label: "Piece Assets" },
    { url: "./assets/king_w_check.png", label: "Piece Assets" },
    { url: "./assets/knight_b.png", label: "Piece Assets" },
    { url: "./assets/knight_w.png", label: "Piece Assets" },
    { url: "./assets/pawn_b.png", label: "Piece Assets" },
    { url: "./assets/pawn_w.png", label: "Piece Assets" },
    { url: "./assets/queen_b.png", label: "Piece Assets" },
    { url: "./assets/queen_w.png", label: "Piece Assets" },
    { url: "./assets/rook_b.png", label: "Piece Assets" },
    { url: "./assets/rook_w.png", label: "Piece Assets" },
    { url: "./assets/red_circle.svg", label: "Board Markers" },
    { url: "./ort.min.js", label: "ONNX Runtime JS" },
    { url: "./ort-wasm-simd-threaded.mjs", label: "ONNX WASM Loader" },
    { url: "./ort-wasm-simd-threaded.wasm", label: "ONNX WASM Binary" },
    { url: "./stockfish.js", label: "Stockfish 3000 Engine" },
    { url: "./models/maia-1100.onnx", label: "Maia 1100 Neural Net" },
    { url: "./models/maia-1300.onnx", label: "Maia 1300 Neural Net" },
    { url: "./models/maia-1500.onnx", label: "Maia 1500 Neural Net" },
    { url: "./models/maia-1700.onnx", label: "Maia 1700 Neural Net" },
    { url: "./models/maia-1900.onnx", label: "Maia 1900 Neural Net" }
];

const boardContainer = document.querySelector(".board-container");
if (boardContainer) {
    new WebChessGame(boardContainer);
}

async function isEverythingCached() {
    if (typeof window === "undefined" || !("caches" in window)) return false;
    try {
        if (localStorage.getItem(OFFLINE_FLAG_KEY) !== "true") return false;
        const cache = await window.caches.open(CACHE_NAME);
        const requiredCheckUrls = [
            "./index.html",
            "./ort-wasm-simd-threaded.wasm",
            "./stockfish.js",
            "./models/maia-1100.onnx",
            "./models/maia-1300.onnx",
            "./models/maia-1500.onnx",
            "./models/maia-1700.onnx",
            "./models/maia-1900.onnx"
        ];
        for (const url of requiredCheckUrls) {
            const match = await cache.match(url, { ignoreSearch: true });
            if (!match) return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

async function downloadAllForOffline() {
    const offlineBox = document.getElementById("offline-box");
    const btnLoad = document.getElementById("btn-load-offline");
    const progressContainer = document.getElementById("offline-progress-container");
    const progressLabel = document.getElementById("offline-progress-label");
    const progressPct = document.getElementById("offline-progress-pct");
    const progressBar = document.getElementById("offline-progress-bar");

    if (btnLoad) btnLoad.style.display = "none";
    if (progressContainer) progressContainer.style.display = "flex";

    try {
        if ("serviceWorker" in navigator) {
            await navigator.serviceWorker.register("./sw.js").catch(() => {});
        }
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist().catch(() => {});
        }

        const cache = await window.caches.open(CACHE_NAME);
        const total = OFFLINE_ASSETS.length;

        for (let i = 0; i < total; i++) {
            const item = OFFLINE_ASSETS[i];
            const pct = Math.round(((i) / total) * 100);
            if (progressLabel) progressLabel.innerText = `Caching ${item.label} (${i + 1}/${total})...`;
            if (progressPct) progressPct.innerText = `${pct}%`;
            if (progressBar) progressBar.style.width = `${pct}%`;

            const existing = await cache.match(item.url, { ignoreSearch: true });
            if (!existing) {
                const response = await fetch(item.url, { cache: "no-cache" });
                if (!response || !response.ok) {
                    throw new Error(`Failed to fetch ${item.url}`);
                }
                await cache.put(item.url, response.clone());
                if (item.url === "./index.html") {
                    await cache.put("./", response.clone());
                }
            }
        }

        if (progressLabel) progressLabel.innerText = "Warming Maia 1500 neural net...";
        if (progressPct) progressPct.innerText = "99%";
        if (progressBar) progressBar.style.width = "99%";

        await maiaEngine.loadModel("1500").catch(() => {});

        localStorage.setItem(OFFLINE_FLAG_KEY, "true");

        if (progressLabel) progressLabel.innerText = "Offline cache complete!";
        if (progressPct) progressPct.innerText = "100%";
        if (progressBar) progressBar.style.width = "100%";

        setTimeout(() => {
            if (offlineBox) {
                offlineBox.style.display = "none";
                offlineBox.remove();
            }
        }, 650);
    } catch (err) {
        if (progressLabel) progressLabel.innerText = "Cache interrupted — tap to retry";
        if (btnLoad) {
            btnLoad.style.display = "block";
            btnLoad.innerText = "Retry Offline Download";
        }
    }
}

async function initOfflineSupport() {
    const offlineBox = document.getElementById("offline-box");
    const btnLoad = document.getElementById("btn-load-offline");

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    const alreadyCached = await isEverythingCached();
    if (alreadyCached) {
        if (offlineBox) {
            offlineBox.style.display = "none";
            offlineBox.remove();
        }
        maiaEngine.loadModel("1500").catch(() => {});
        return;
    }

    if (btnLoad) {
        btnLoad.addEventListener("click", () => {
            downloadAllForOffline();
        });
    }
}

if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initOfflineSupport);
    } else {
        initOfflineSupport();
    }
}
