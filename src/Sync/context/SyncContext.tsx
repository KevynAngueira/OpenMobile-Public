// SyncContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { sendMedia, sendParams } from '../../utils/MediaUploader';
import { SyncEntry } from '../../types/SyncTypes';
import { server } from '../../../metro.config';
import { read } from 'react-native-fs';
import { apiFetch } from '../../network/ApiFetch';
import { processWithConcurrency } from '../../utils/AsyncQueue';
import { DevServerConfig } from '../../DevConsole/configs/DevServerConfig';

import { atomicAddEntry, atomicUpdateEntry, atomicRemoveEntry, atomicRemoveDeprecatedEntries } from '../services/SyncContextHandler';

interface SyncContextType {
  syncEntries: SyncEntry[];
  addSyncEntry: (videoPath: string) => Promise<void>;
  updateSyncEntry: (id: string, updates: Partial<SyncEntry>) => void;
  removeSyncEntry: (id: string) => Promise<void>;
  removeAllSyncEntry: () => Promise<void>;
  syncAllPending: (
    serverURL: string, 
    mediaItems: {path: string; params?: Record<string, any>, leafConfigs?: Record<string, any>}[], 
    setSyncResult: (message: string) => void
  ) => Promise<void>;
}

type InferenceQueueItem = {
  id: string;
  setSyncResult: (message: string) => void;
};



const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

const SYNC_STORAGE_KEY = '@syncEntries';

export const SyncProvider: React.FC = ({ children }) => {
  const [syncEntries, setSyncEntries] = useState<SyncEntry[]>([]);
  const inferenceQueueRef = useRef<Map<string, InferenceQueueItem>>(new Map());
  const [inferenceQueueVersion, setInferenceQueueVersion] = useState(0);
  const syncEntriesRef = useRef(syncEntries);
  const serverURL = DevServerConfig.getBaseURL();

  useEffect(() => {
    syncEntriesRef.current = syncEntries;
  }, [syncEntries]);

  // Load sync entries from AsyncStorage when the app starts
  useEffect(() => {
    const loadSyncEntries = async () => {
      try {
        const storedEntries = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
        if (storedEntries) {
          setSyncEntries(JSON.parse(storedEntries));
        }
      } catch (error) {
        console.error('Failed to load sync entries:', error);
      }
    };

    loadSyncEntries();
  }, []);

  // Save sync entries to AsyncStorage whenever they change
  useEffect(() => {
    const saveSyncEntries = async () => {
      try {
        await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncEntries));
      } catch (error) {
        console.error('Failed to save sync entries:', error);
      }
    };

    saveSyncEntries();
  }, [syncEntries]);

  // Fetch Inference Poller
  useEffect(() => {
    if (inferenceQueueRef.current.size === 0) return;
  
    let cancelled = false;
  
    const poll = async () => {
      while (!cancelled && inferenceQueueRef.current.size > 0) {
        const queueItems = Array.from(
          inferenceQueueRef.current.values()
        );
  
        await Promise.all(
          queueItems.map(async ({ id, setSyncResult }) => {
            const entry = syncEntriesRef.current.find(
              e => e.id === id
            );
  
            if (!entry) return;
  
            const updated = { ...entry };
  
            await inference(serverURL, updated, setSyncResult);
  
            setSyncEntries(prev => updateEntryById(prev, updated));
  
            const done =
              updated.inferenceStatus === "completed" ||
              updated.inferenceStatus === "failed";
  
            if (done) {
              inferenceQueueRef.current.delete(id);
              setInferenceQueueVersion(v => v + 1);
            }
          })
        );
  
        console.log("Waiting 30 seconds before next poll...");
        await new Promise(r => setTimeout(r, 30000));
      }
    };
  
    poll();
  
    return () => {
      cancelled = true;
    };
  }, [inferenceQueueVersion, serverURL]);

  
  //////////////////////////////////////////// 
  //      CRUD Functions (Async)
  ////////////////////////////////////////////

  const addSyncEntry = async (
    videoPath: string,
    params: Record<string, any>,
    leafConfig: Record<string, any>
  ) => {
    setSyncEntries((prev) => atomicAddEntry(prev, videoPath, params, leafConfig).allEntries);
  };
  
  const updateSyncEntry = async (
    videoPath: string,
    updates: Record<string, any>,
  ) => {
    setSyncEntries((prev) => atomicUpdateEntry(prev, videoPath, updates).allEntries);
  };

  const removeSyncEntry = async (
    id: string,
  ) => {
    setSyncEntries((prev) => atomicRemoveEntry(prev, id));
  };

  const removeAllSyncEntry = async () => {
    setSyncEntries([]);
  };


  //////////////////////////////////////////// 
  //            Helper Functions
  ////////////////////////////////////////////

  function updateEntryById(
    entries: SyncEntry[],
    updatedEntry: SyncEntry
  ): SyncEntry[] {
    return entries.map(e => (e.id === updatedEntry.id ? updatedEntry : e));
  }  

  const enqueueInference = (
    entry: SyncEntry,
    setSyncResult: (message: string) => void
  ) => {
    const alreadyQueued = inferenceQueueRef.current.has(entry.id);
  
    if (alreadyQueued) {
      return;
    }
  
    inferenceQueueRef.current.set(entry.id, {
      id: entry.id,
      setSyncResult
    });
  
    setInferenceQueueVersion(v => v + 1);
  };

  //////////////////////////////////////////// 
  //            Upload Functions
  ////////////////////////////////////////////
  
  const uploadVideo = async (
    serverURL: string, 
    entry: SyncEntry, 
    setSyncResult: (message: string) => void
  ) => {
    console.log('Video Upload Start: ', entry.videoPath);
    setSyncResult(`Video Upload Start: ${entry.videoPath}`);
    setTimeout(() => setSyncResult(null), 3000);
    entry.videoUploadStatus = 'uploading';

    try {
      const uploadResponse = await sendMedia(
        'video',
        [{
          path: entry.videoPath,
          params: entry.params,
          leafConfig: entry.leafConfig
        }],
        `${serverURL}/send/video`
      );

      entry.videoUploadResponse = uploadResponse[0].data;
      console.log('Video Upload Response: ', entry.videoUploadResponse);
      setSyncResult(`Video Upload Response: ${entry.videoUploadResponse}`);
      setTimeout(() => setSyncResult(null), 3000);

      if (entry.videoUploadResponse?.status === "success") {
        entry.videoUploadStatus = 'uploaded';
        console.log('Video Upload Successful!');
      }
    } catch (error) {
      console.error('Sync error for video upload:', entry.videoPath, error);
      setSyncResult(`Upload Failed: ${entry.id} => ${error.message}`);
      setTimeout(() => setSyncResult(null), 3000);
      entry.videoUploadStatus = 'failed';
    }
  };

  const uploadParams = async (
    serverURL: string, 
    entry: SyncEntry, 
    setSyncResult: (message: string) => void
  ) => {
    console.log('Param Upload Start: ', entry.videoPath);
    setSyncResult(`Param Upload Start: ${entry.videoPath}`);
    setTimeout(() => setSyncResult(null), 3000);
    //entry.paramUploadStatus = 'uploading';

    try {
      const uploadResponse = await sendParams(
        [{
          path: entry.videoPath,
          params: entry.params,
          leafConfig: entry.leafConfig
        }],
        `${serverURL}/send/params`
      );

      entry.paramUploadResponse = uploadResponse[0].data;
      
      console.log('Param Upload Response: ', entry.paramUploadResponse);
      setSyncResult(`Param Upload Response: ${entry.paramUploadResponse}`);
      setTimeout(() => setSyncResult(null), 3000);

      if (entry.paramUploadResponse?.status === "success") {
        entry.paramUploadStatus = 'uploaded';
        console.log('Param Upload Successful!');
      }
    } catch (error) {
      console.error('Sync error for param upload:', entry.videoPath, error);
      setSyncResult(`Upload Failed: ${entry.id} => ${error.message}`);
      setTimeout(() => setSyncResult(null), 3000);
      entry.paramUploadStatus = 'failed';
    }
  };

  const syncUploads = async (
    serverURL: string, 
    entries: SyncEntry[], 
    toUploadIds: Set<string>,
    setSyncResult: (message: string) => void
  ) => {

    const uploadTargets = entries.filter(e => toUploadIds.has(e.id));

    await processWithConcurrency(uploadTargets, async (entry) => {
      const videoAttached = entry.videoUploadStatus === 'uploaded';
      const paramsAttached = entry.paramUploadStatus === 'uploaded';

      if (videoAttached && paramsAttached) {
        console.warn(`Warning: Skipping upload: ${entry.id}`);
        setSyncResult(`Warning: skipping upload ${entry.id}, video and params previously uploaded`);
        setTimeout(() => setSyncResult(null), 3000);
        return;
      }

      let updated = { ...entry };

      if (!paramsAttached) {
        await uploadParams(serverURL, updated, setSyncResult);
      }

      if (!videoAttached) {
        await uploadVideo(serverURL, updated, setSyncResult);
      }

      setSyncEntries(prev => updateEntryById(prev, updated));

      enqueueInference(updated, setSyncResult);
    }, 3);

    return entries;
  };
    
  //////////////////////////////////////////// 
  //            Inference Functions
  ////////////////////////////////////////////

  const inference = async (
    serverURL: string, 
    entry: SyncEntry, 
    setSyncResult: (message: string) => void
  ) => {
    console.log('Inference Start: ', entry.videoPath);
    setSyncResult(`Inference Start: ${entry.videoPath}`);
    setTimeout(() => setSyncResult(null), 3000);
    entry.inferenceStatus = 'running';
    
    try {
      const fileNameWithoutExtension = entry.id.replace(/\.[^/.]+$/, '');
      const inferenceResponse = await apiFetch(
        `${serverURL}/inference/${fileNameWithoutExtension}`,
        {
          method: 'GET',
        },
        entry.leafConfig
      );
      const inferenceJson = await inferenceResponse.json();     

      entry.inferenceResponse = inferenceJson;
      console.log('Inference Response: ', entry.inferenceResponse);
      setSyncResult(`Inference Response: ${JSON.stringify(inferenceJson)}`);
      setTimeout(() => setSyncResult(null), 3000);

      if (inferenceJson.status === 'waiting' && inferenceJson.reupload) {
        const reupload = inferenceJson.reupload;
        const videoStillUploading = entry.videoUploadStatus == 'uploading';

        if (reupload.video && !videoStillUploading) {
          entry.videoUploadStatus = 'failed';
          entry.videoUploadResponse = undefined;
        }
        if (reupload.params) {
          entry.paramUploadStatus = 'failed';
          entry.paramUploadResponse = undefined;
        }  

        if (!videoStillUploading) {
          entry.inferenceStatus = 'waiting';
          setSyncResult(`⚠️ Waiting on dependencies. Marked failed uploads: ${JSON.stringify(reupload)}`);
          setTimeout(() => setSyncResult(null), 3000);
        }
      }

      if (entry.inferenceResponse?.status === "error") {
        entry.inferenceStatus = 'failed';
      }

      if (entry.inferenceResponse?.status === "completed") {
        entry.inferenceStatus = 'completed';
        console.log('Inference Successful!');
      }

    } catch (error) {
      console.error('Sync error for inference:', entry.videoPath, error);
      setSyncResult(`Inference Failed: ${entry.id} => ${error.message}`);
      setTimeout(() => setSyncResult(null), 3000);
      entry.inferenceStatus = 'failed';
    }
  };

  const syncInference = async (
    serverURL: string,
    entries: SyncEntry[], 
    toInferIds: Set<string>,
    setSyncResult: (message: string) => void
  ) => {

    const inferTargets = entries.filter(e => toInferIds.has(e.id));

    await processWithConcurrency(inferTargets, async (entry) => {
  
      let updated = { ...entry };
  
      await inference(serverURL, updated, setSyncResult);
  
      setSyncEntries(prev => updateEntryById(prev, updated));
  
    }, 2); // inference is heavier → lower concurrency
  
    return entries;
  };

  //////////////////////////////////////////// 
  //            Sync All
  ////////////////////////////////////////////
  
  const syncAllPending = async (
    serverURL: string,
    mediaItems: {path: string; params?: Record<string, any>, leafConfig?: Record<string, any>}[], 
    setSyncResult: (message: string) => void
  ) => {
    let updatedEntries = ([...(syncEntries || [])]).filter(Boolean);
  
    setSyncResult('Pre-loading sync entries...');
    setTimeout(() => setSyncResult(null), 3000);

    // Step 1: Remove deprecated entries
    console.log('Removing Deprecated Sync Entries...');
    updatedEntries = atomicRemoveDeprecatedEntries(updatedEntries, mediaItems);

    // Step 2: Create new entries
    const uploadList = new Set<string>();
    const inferenceList = new Set<string>();

    console.log('Creating or Updating Sync Entries...');
    for (const item of mediaItems) {
      const id = item.path.split('/').pop();
      const existingEntry = syncEntries.find((entry) => entry.id === id);

      if (!existingEntry) {
        const {allEntries, newEntry} = atomicAddEntry(updatedEntries, item.path, item.params || {}, item.leafConfig || {});
        updatedEntries = allEntries;
        if (newEntry) {
          uploadList.add(id!)
          console.log(`NEW ENTRY ${id}`);
        };
        console.log(`Added new sync entry: ${id}`);
      } else {
        const {allEntries, updatedEntry, changed} = atomicUpdateEntry(
          updatedEntries,
          id!, 
          {
            videoPath: item.path,
            params: item.params,
            leafConfig: item.leafConfig
          }
        );
        
        updatedEntries = allEntries;
        if (updatedEntry){
          if (changed) {
            console.log(`UPDATED ENTRY ${id}`);
            uploadList.add(id!);
          } else {
            console.log(`NO UPDATES ENTRY ${id}`);
            inferenceList.add(id!);
          }
        }
        console.log(`Updated sync entry: ${id}`);
      }
    }
    setSyncEntries(updatedEntries);
    console.log(updatedEntries);

    // Step 2.5: Reconcile failed states
    console.log('Reconciling failed sync states...');

    for (const entry of updatedEntries) {

      const uploadFailed =
        entry.videoUploadStatus === 'failed' ||
        entry.paramUploadStatus === 'failed';

      const inferenceFailed =
        entry.inferenceStatus === 'failed';

      const inferenceWaiting =
        entry.inferenceStatus === 'waiting';

      // Failed uploads must go back through upload pipeline
      if (uploadFailed) {
        uploadList.add(entry.id);

        console.log(`REQUEUE UPLOAD ${entry.id}`);

        // If upload failed, inference must rerun later
        inferenceList.delete(entry.id);
        continue;
      }

      // Failed/waiting inference should retry inference
      if (inferenceFailed || inferenceWaiting) {
        inferenceList.add(entry.id);

        console.log(`REQUEUE INFERENCE ${entry.id}`);
      }
    }

    if (updatedEntries.length === 0) {
      setSyncResult("No videos attached to annotations.");
      setTimeout(() => setSyncResult(null), 3000);
      return;
    }

    setSyncResult("Starting Upload...");
    setTimeout(() => setSyncResult(null), 3000);

    // Step 3: Upload videos
    console.log('== Start Entry Upload ==');
    updatedEntries = await syncUploads(serverURL, updatedEntries, uploadList, setSyncResult);
    console.log('== End Entry Upload ==');
    
    setSyncResult("Upload Successful! Running Inference...");
    setTimeout(() => setSyncResult(null), 3000);
    
    // Step 4: Run inference
    console.log('== Start Entry Inference ==');
    updatedEntries = await syncInference(serverURL, updatedEntries, inferenceList, setSyncResult);
    console.log('== End Entry Inference ==');
    
    setTimeout(() => setSyncResult("Inference Successful! Sync Complete"), 3000);
    setTimeout(() => setSyncResult(null), 6000);
  };
  
  return (
    <SyncContext.Provider
      value={{
        syncEntries,
        setSyncEntries,
        addSyncEntry,
        updateSyncEntry,
        removeSyncEntry,
        removeAllSyncEntry,
        syncAllPending,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};