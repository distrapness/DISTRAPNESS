import config from '../config.js';

export const getImageUrl = (url, options = {}) => {
    if (!url) return "/assets/placeholder.jpg";

    let cleanUrl = url;

    // 1. If it has localhost, strip it to become relative path
    if (url.includes("localhost:5001/uploads/")) {
        cleanUrl = url.replace(/http:\/\/localhost:5001\/uploads\//g, "/uploads/")
            .replace(/https:\/\/localhost:5001\/uploads\//g, "/uploads/");
    }

    // 2. If it is a relative path (starts with /uploads), prepend the ACTIVE Backend URL
    if (cleanUrl.startsWith("/uploads/")) {
        cleanUrl = `${config.API_URL}${cleanUrl}`;
    }

    // 3. Cloudinary Dynamic Optimization (WebP, Compression, Sizing)
    if (cleanUrl.includes('res.cloudinary.com')) {
        const parts = cleanUrl.split('/upload/');
        if (parts.length === 2) {
            let transformations = 'f_auto,q_auto'; // Auto format (WebP/AVIF) & Auto quality
            if (options.width) {
                transformations += `,w_${options.width}`;
            }
            if (options.height) {
                transformations += `,h_${options.height}`;
            }
            cleanUrl = `${parts[0]}/upload/${transformations}/${parts[1]}`;
        }
    }

    return cleanUrl;
};
