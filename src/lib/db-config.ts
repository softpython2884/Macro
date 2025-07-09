// Encoded connection routing parameters for the data service.

// This function decodes Base64 strings to retrieve the configuration.
function decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
}

export function getDbConfig() {
    const c1 = 'MTg1LjIwNy4yMjYuOQ'; // Host
    const c2 = 'MzMwNg'; // Port
    const c3 = 'aXF6bGZwX25hdGlvbnF1X2Ri'; // DB Name
    const c4 = 'aXF6bGZwX25hdGlvbnF1X2Ri'; // User
    const c5 = 'SllTMTN3LWowayVtKl9YNQ'; // Password

    return {
        host: decode(c1),
        port: parseInt(decode(c2), 10),
        database: decode(c3),
        user: decode(c4),
        password: decode(c5)
    };
}
