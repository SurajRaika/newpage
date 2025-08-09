export function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30.44);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
}


export  function getGoals() {
    try {
        const goalsString = localStorage.getItem("userGoals");
        return goalsString ? JSON.parse(goalsString) : [];
    } catch (e) {
        console.error("Error parsing goals from localStorage:", e);
        return [];
    }
}



export function saveGoals(goalsArray) {
    try {
        localStorage.setItem("userGoals", JSON.stringify(goalsArray));
    } catch (e) {
        console.error("Error saving goals to localStorage:", e);
    }
}

export const searchEnginePlaceholders = {
    google: "Search Google...",
    perplexity: "Search Perplexity...",
    youtube: "Search YouTube...",
    chatgpt: "Search ChatGPT...",
    history: "View search history or search Google..." // Special case for history
};
