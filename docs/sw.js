const CACHE_NAME = "chess-offline-cache-v2";

const PRECACHE_ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.json",
    "./favicon.png",
    "./chessboard.png",
    "./ort.min.js",
    "./ort-wasm-simd-threaded.mjs",
    "./ort-wasm-simd-threaded.wasm",
    "./stockfish.js",
    "./main.js",
    "./web_chess_game.js",
    "./chess_game.js",
    "./ai_player.js",
    "./maia_engine.js",
    "./analysis_board.js",
    "./board_builder.js",
    "./board_element.js",
    "./board_position.js",
    "./chess_clock.js",
    "./end_card.js",
    "./move_tracker.js",
    "./notation.js",
    "./observer.js",
    "./opening_book.js",
    "./piece.js",
    "./promotion_card.js",
    "./sound_effects.js",
    "./subject.js",
    "./pieces/bishop.js",
    "./pieces/empty_piece.js",
    "./pieces/king.js",
    "./pieces/knight.js",
    "./pieces/pawn.js",
    "./pieces/queen.js",
    "./pieces/rook.js",
    "./assets/bishop_b.png",
    "./assets/bishop_w.png",
    "./assets/king_b.png",
    "./assets/king_b_check.png",
    "./assets/king_w.png",
    "./assets/king_w_check.png",
    "./assets/knight_b.png",
    "./assets/knight_w.png",
    "./assets/pawn_b.png",
    "./assets/pawn_w.png",
    "./assets/queen_b.png",
    "./assets/queen_w.png",
    "./assets/rook_b.png",
    "./assets/rook_w.png",
    "./assets/red_circle.svg",
    "./models/maia-1100.onnx",
    "./models/maia-1300.onnx",
    "./models/maia-1500.onnx",
    "./models/maia-1700.onnx",
    "./models/maia-1900.onnx"
];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Cache core shell and models resiliently so a single failure doesn't block installation
            await Promise.allSettled(
                PRECACHE_ASSETS.map(async (url) => {
                    try {
                        const match = await cache.match(url);
                        if (!match) {
                            const response = await fetch(url, { cache: "no-cache" });
                            if (response && response.ok) {
                                await cache.put(url, response);
                            }
                        }
                    } catch (e) {
                        // Ignore individual asset error during install
                    }
                })
            );
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(req, { ignoreSearch: true });
            if (cachedResponse) {
                // For large binary files (.onnx, .wasm, .png, stockfish.js), return cached immediately without re-fetching
                const url = req.url;
                if (
                    url.endsWith(".onnx") ||
                    url.endsWith(".wasm") ||
                    url.endsWith(".png") ||
                    url.endsWith(".svg") ||
                    url.endsWith("stockfish.js") ||
                    url.endsWith("ort.min.js")
                ) {
                    return cachedResponse;
                }

                // Stale-while-revalidate for lightweight app shell files
                fetch(req).then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        cache.put(req, networkResponse.clone());
                    }
                }).catch(() => {});

                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(req);
                if (networkResponse && networkResponse.ok) {
                    cache.put(req, networkResponse.clone());
                }
                return networkResponse;
            } catch (err) {
                if (req.mode === "navigate") {
                    const fallback = await cache.match("./index.html");
                    if (fallback) return fallback;
                }
                throw err;
            }
        })
    );
});
