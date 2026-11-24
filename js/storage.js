
const DB_NAME = 'CodeFiveTraining';
const DB_VERSION = 1;

let databasePromise;

export function openDatabase() {

    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {

            const db = request.result;

            if (!db.objectStoreNames.contains('events')) {

                const store = db.createObjectStore('events', {
                    keyPath: 'eventId'
                });

                store.createIndex('sessionId', 'sessionId');
                store.createIndex('timestamp', 'timestamp');
                store.createIndex('category', 'category');
            }

            if (!db.objectStoreNames.contains('sessions')) {

                db.createObjectStore('sessions', {
                    keyPath: 'sessionId'
                });
            }
        };

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => {
            databasePromise = null;
            reject(request.error);
        };
    });

    return databasePromise;
}

async function write(storeName, value) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(storeName, 'readwrite');

        tx.objectStore(storeName).put(value);

        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export const saveEvent = event => write('events', event);

export const saveSession = session => write('sessions', session);

export async function getEvents(sessionId) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const store = db
            .transaction('events', 'readonly')
            .objectStore('events');

        const request = sessionId
            ? store.index('sessionId').getAll(sessionId)
            : store.getAll();

        request.onsuccess = () => resolve(
            request.result.sort(
                (a, b) => a.timestamp.localeCompare(b.timestamp)
            )
        );

        request.onerror = () => reject(request.error);
    });
}

export async function getSessions() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const request = db
            .transaction('sessions', 'readonly')
            .objectStore('sessions')
            .getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function downloadJSON(filename, data) {

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
