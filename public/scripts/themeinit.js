     // The configured mode is stored in local storage
            const theme = localStorage.getItem("themePreference");
            // Put dark class on html tag to enable dark mode
            document.querySelector("html").className = theme;