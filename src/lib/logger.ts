
const isDev = process.env.NODE_ENV === 'development';
const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
    log: (message: string, ...args: any[]) => {
        if (isDev || isDebug) {
            console.log(`[LOG] ${message}`, ...args);
        }
    },
    info: (message: string, ...args: any[]) => {
        if (isDev || isDebug) {
            console.info(`[INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        // Warnings are always useful, but can be silenced if needed
        if (isDev || isDebug) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
    error: (message: string, ...args: any[]) => {
        // Errors should always be logged
        console.error(`[ERROR] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        if (isDev || isDebug) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};
