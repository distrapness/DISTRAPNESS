export const getImageUrl = (url) => {
    if (!url) return "/assets/placeholder.jpg";

    // Jika URL berisi localhost:5001/uploads, ganti menjadi /uploads (relative path)
    if (url.includes("localhost:5001/uploads/")) {
        return url.replace(/http:\/\/localhost:5001\/uploads\//g, "/uploads/")
            .replace(/https:\/\/localhost:5001\/uploads\//g, "/uploads/");
    }

    // Jika URL sudah relative /uploads, biarkan
    if (url.startsWith("/uploads/")) {
        return url;
    }

    return url;
};
