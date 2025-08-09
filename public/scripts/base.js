
 
 const LayoutManager = (() => {
                // --- State & Elements ---
                let goalsEnabled = false;
                const goalsContainer =
                    document.getElementById("goals-container");
                const engineSelection =
                    document.getElementById("engine-selection");
                const topElementsContainer =
                    document.getElementById("top-elements");
                const mainContentBottomContainer = document.getElementById(
                    "main-content-bottom",
                );

                // --- Private Methods ---
                const update = () => {
                    goalsEnabled =
                        localStorage.getItem("goalsEnabled") === "true";
                    if (goalsEnabled) {
                        goalsContainer.classList.remove("hidden");
                        topElementsContainer.appendChild(engineSelection);
                        topElementsContainer.classList.add("with-engine");
                    } else {
                        goalsContainer.classList.add("hidden");
                        mainContentBottomContainer.prepend(engineSelection);
                        topElementsContainer.classList.remove("with-engine");
                    }
                    // Ask other modules to update their UI
                    // GoalsManager.render();
                    setTimeout(
                        () =>
                            document.dispatchEvent(
                                new CustomEvent("render-goals-manager"),
                            ),
                        0,
                    );
                    setTimeout(
                        () =>
                            document.dispatchEvent(
                                new CustomEvent("update-active-line"),
                            ),
                        0,
                    );
                };

                // --- Public Methods & Event Listeners ---
                const init = () => {
                    document.addEventListener("toggle-tasks", update);
                    update(); // Initial layout setup
                };

                return { init };
            })();

            function initializeApp() {
                const blankScreenOverlay = document.getElementById(
                    "blank-screen-overlay",
                );
                const searchInput = document.getElementById("search-input");

                // Initialize all modules
                LayoutManager.init();

                // Fix for blank screen on browser back button
                window.addEventListener("pageshow", (event) => {
                    if (event.persisted) {
                        blankScreenOverlay.style.opacity = "0";
                        blankScreenOverlay.style.pointerEvents = "none";
                    }
                });

                // Hide loading overlay and focus search input
                blankScreenOverlay.style.opacity = "0";
                blankScreenOverlay.style.pointerEvents = "none";
                setTimeout(() => searchInput.focus(), 400);
            }

            document.addEventListener("DOMContentLoaded", initializeApp);
     