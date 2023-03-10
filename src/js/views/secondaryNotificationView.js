import { SECONDARY_NOTIFICATION_SEC } from "../config.js";

export function showSecondaryNotification(message, icon = 'ri-notification-4-line') {
    const existingNotification = document.querySelector('#secondary__notification');

    // If the existing notification is found, just update its content and reset the timeout
    if (existingNotification) {
        existingNotification.querySelector('.message').textContent = message;
        existingNotification.querySelector('.icon').className = `icon ${icon}`;

        clearTimeout(existingNotification.dataset.timeoutId);

        existingNotification.dataset.timeoutId = setTimeout(() => {
            existingNotification.classList.add('hide');

            setTimeout(() => {
                existingNotification.remove();
            }, 200);
        }, SECONDARY_NOTIFICATION_SEC);
    }
    else {
        // If the existing notification is not found, create a new element and add it to the DOM
        const notification = document.createElement('div');
        notification.classList.add('secondary__notification', 'show');
        notification.id = 'secondary__notification';
        notification.innerHTML = `
            <i class="icon ${icon}"></i>
            <span class="message">${message}</span>
        `;
        document.body.appendChild(notification);

        notification.dataset.timeoutId = setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 200);
        }, SECONDARY_NOTIFICATION_SEC);
    }
}