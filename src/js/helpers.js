export function addToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

export function updateLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
}

export function getCurrentTime() {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${period}`;
}