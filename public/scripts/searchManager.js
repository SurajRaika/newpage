const SearchManager = (() => {
        // --- State & Elements ---
        let isCtrlPressed = false;
        const searchForm = document.getElementById("search-form");
        const searchInput = document.getElementById("search-input");
        const blankScreenOverlay = document.getElementById(
            "blank-screen-overlay",
        );

        // --- Private Methods ---
        const performSearch = (query, engine, newTab = false) => {
            if (!query) return;

            if (engine === "history") {
                engine = "google"; // Default to Google if history is selected
                const googleRadio = document.querySelector(
                    'input[name="engine"][value="google"]',
                );
                if (googleRadio) googleRadio.checked = true;
                // Announce engine change to update UI
                document.dispatchEvent(
                    new Event("change", { bubbles: true }),
                );
            }

            const urls = {
                google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
                youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                                bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,

                    

            };
            const url = urls[engine];
            if (!url) return;

            // Announce search for history module
            document.dispatchEvent(
                new CustomEvent("add-to-history", {
                    detail: { query, engine },
                }),
            );

            if (newTab) {
                window.open(url, "_blank");
            } else {
                blankScreenOverlay.style.opacity = "1";
                blankScreenOverlay.style.pointerEvents = "auto";
                setTimeout(() => {
                    window.location.href = url;
                }, 200);
            }
        };

        // --- Public Methods & Event Listeners ---
        const init = () => {
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                const engine = document.querySelector(
                    'input[name="engine"]:checked',
                ).value;
                performSearch(query, engine, isCtrlPressed);
            });

            // Keyboard shortcuts for search
            document.addEventListener("keydown", (e) => {
                const isInputActive =
                    document.activeElement === searchInput;
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    performSearch(
                        searchInput.value.trim(),
                        document.querySelector(
                            'input[name="engine"]:checked',
                        ).value,
                        true,
                    );
                } else if (e.key === "/" && !isInputActive) {
                    e.preventDefault();
                    searchInput.focus();
                } else if (e.key === "Escape" && isInputActive) {
                    searchInput.blur();
                }
            });

            // Track Ctrl/Cmd key state for new tab submissions
            document.addEventListener("keydown", (e) => {
                if (e.key === "Control" || e.key === "Meta")
                    isCtrlPressed = true;
            });
            document.addEventListener("keyup", (e) => {
                if (e.key === "Control" || e.key === "Meta")
                    isCtrlPressed = false;
            });
        };

        return { init };
    })();

    SearchManager.init();