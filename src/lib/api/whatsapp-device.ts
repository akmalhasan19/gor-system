
/**
 * Create a new device in Fonnte
 * Requires Master Token
 */
export async function createFonnteDevice(deviceName: string, masterToken: string): Promise<{ token: string; deviceId: string } | { error: string }> {
    try {
        // Note: This is an assumption based on "API Add Device" capability.
        // If Fonnte requires manual creation, this flow might need adjustment.
        // Common Fonnte API for adding device usually involves a POST to specific endpoint.
        // We will target standard endpoint.

        const response = await fetch('https://api.fonnte.com/add-device', {
            method: 'POST',
            headers: {
                'Authorization': masterToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: deviceName,
                device: deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-') // slugify
            })
        });

        const data = await response.json();

        if (data.status) {
            return {
                token: data.token,
                deviceId: data.device_id || deviceName // storage fallback
            };
        }

        // Fonnte usually returns 'reason' or 'detail' or just a message in 'status' if false (sometimes)
        return { error: data.reason || data.detail || (typeof data.status === 'string' ? data.status : 'Unknown Fonnte Error') };
    } catch (e: any) {
        console.error('Fonnte Create Device Error:', e);
        return { error: e.message || 'Network Error' };
    }
}

/**
 * Get QR Code for a device
 */
export async function getFonnteQR(deviceToken: string): Promise<string | null> {
    try {
        const response = await fetch('https://api.fonnte.com/qr', {
            method: 'POST',
            headers: {
                'Authorization': deviceToken,
            }
        });

        const data = await response.json();

        if (data.status) {
            // Fonnte returns base64 or url. If base64, usually data.url or data.qr
            return data.url || data.qr;
        }
        return null;
    } catch (e) {
        console.error('Fonnte QR Error:', e);
        return null;
    }
}

/**
 * Get Device Status
 */
export async function getFonnteDeviceStatus(deviceToken: string): Promise<'connected' | 'disconnected' | 'unknown'> {
    try {
        const response = await fetch('https://api.fonnte.com/device', {
            method: 'POST',
            headers: {
                'Authorization': deviceToken,
            }
        });

        const data = await response.json();

        // Fonnte status response parsing
        if (data.status === 'connect' || data.device_status === 'connect') return 'connected';
        if (data.status === 'disconnect') return 'disconnected';

        return 'disconnected';
    } catch (e) {
        return 'unknown';
    }
}

/**
 * Disconnect/Delete Device
 */
export async function disconnectFonnteDevice(deviceToken: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.fonnte.com/disconnect', {
            method: 'POST',
            headers: {
                'Authorization': deviceToken,
            }
        });

        const data = await response.json();
        return !!data.status;
    } catch (e) {
        return false;
    }
}
