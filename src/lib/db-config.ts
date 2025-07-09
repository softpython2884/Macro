'use server';

// This function decodes Base64 strings to retrieve the configuration.
function decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
}

export function getDbConfig() {
    // Encoded credentials
    const host_encoded = 'MTg1LjIwNy4yMjYuOQ';
    const port_encoded = 'MzMwNg';
    const db_name_encoded = 'aXF6bGZwX25hdGlvbnF1X2Ri';
    const user_encoded = 'aXF6bGZwX25hdGlvbnF1X2Ri';
    const password_encoded = 'SllTMTN3LWowayVtKl9YNQ';

    return {
        host: decode(host_encoded),
        port: parseInt(decode(port_encoded), 10),
        database: decode(db_name_encoded),
        user: decode(user_encoded),
        password: decode(password_encoded)
    };
}
