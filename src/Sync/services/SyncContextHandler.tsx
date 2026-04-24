import { SyncEntry } from "../../types/SyncTypes";

//////////////////////////////////////////// 
//      CRUD Functions (Atomic)
////////////////////////////////////////////

export function atomicAddEntry(
    entries: SyncEntry[],
    videoPath: string,
    params: Record<string, any>,
    leafConfig: Record<string, any>
): {allEntries: SyncEntry[], newEntry: SyncEntry| null} {

    const id = videoPath.split('/').pop();
    if (!id) return {allEntries: entries, newEntry: null};
    if (entries.some((entry) => entry.id === id)) return {allEntries: entries, newEntry: null}; // Avoid duplicates

    const newEntry: SyncEntry = {
        id,
        videoPath,
        params,
        leafConfig,
        videoUploadStatus: 'uploading',
        paramUploadStatus: 'new',
        inferenceStatus: 'new',
    };

    const allEntries = [...entries, newEntry];
    return {allEntries, newEntry};
}

export function atomicUpdateEntry(
    entries: SyncEntry[],
    id: string,
    updates: Partial<SyncEntry>
): {allEntries: SyncEntry[], updatedEntry: SyncEntry | null, changed: Boolean} {

    let changed = false;
    let updatedEntry = null;

    const allEntries = entries.map((entry) => {
        if (entry.id !== id) return entry;

        let newEntry = { ...entry, ...updates };
        updatedEntry = newEntry;

        // If videoPath changed
        if (updates.videoPath && updates.videoPath !== entry.videoPath) {
        changed = true;
        newEntry.id = updates.videoPath.split('/').pop() || entry.id;
        newEntry.videoUploadStatus = 'uploading';
        newEntry.videoUploadResponse = undefined;
        newEntry.inferenceStatus = 'new';
        newEntry.inferenceResponse = undefined;
        }

        // If params changed
        if (updates.params && !_.isEqual(updates.params, entry.params)) {
        changed = true;
        newEntry.paramUploadStatus = 'new';
        newEntry.paramUploadResponse = undefined;
        newEntry.inferenceStatus = 'new';
        newEntry.inferenceResponse = undefined;
        }

        //If leafConfig changed
        if (updates.leafConfig && !_.isEqual(updates.leafConfig, entry.leafConfig)) {
        changed = true;
        newEntry.paramUploadStatus = 'new';
        newEntry.paramUploadResponse = undefined;
        newEntry.inferenceStatus = 'new';
        newEntry.inferenceResponse = undefined;
        }

        return newEntry;
    });

    return {allEntries, updatedEntry, changed};
}

export function atomicRemoveEntry(
    entries: SyncEntry[],
    id: string
): SyncEntry[] {
    return entries.filter((entry) => entry.id !== id);
}

export function atomicRemoveDeprecatedEntries(
    entries: SyncEntry[],
    mediaItems: { path: string }[]
): SyncEntry[] {
    const mediaPaths = new Set(mediaItems.map((item) => item.path));
    return entries.filter((entry) => mediaPaths.has(entry.videoPath));
}  
