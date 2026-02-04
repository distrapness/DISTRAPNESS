import config from '../config';

export const getImageUrl = (url) => {
    if (!url) return "/assets/placeholder.jpg";

    // 1. If it's a full URL to cloudinary or external (and NOT localhost), leave it.
    if (url.startsWith('http') && !url.includes('localhost')) {
        return url;
    }

    // 2. If it has localhost, strip it to become relative path
    let cleanUrl = url;
    if (url.includes("localhost:5001/uploads/")) {
        cleanUrl = url.replace(/http:\/\/localhost:5001\/uploads\//g, "/uploads/")
            .replace(/https:\/\/localhost:5001\/uploads\//g, "/uploads/");
    }

    // 3. If it is a relative path (starts with /uploads), prepend the ACTIVE Backend URL
    // so that localhost frontend fetches images from the Remote Backend (Vercel)
    if (cleanUrl.startsWith("/uploads/")) {
        return `${config.API_URL}${cleanUrl}`;
    }

    return cleanUrl;
};
