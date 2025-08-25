
 
 const LayoutManager = (() => {
                // --- State & Elements ---
             
                const engineSelection =
                    document.getElementById("engine-selection");
                const topElementsContainer =
                    document.getElementById("top-elements");
                const mainContentBottomContainer = document.getElementById(
                    "main-content-bottom",
                );

                // --- Private Methods ---
                const update = () => {
             
                
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
     