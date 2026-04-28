import React, { createContext, useContext, useState } from 'react';
import { FieldAnnotation, PlantAnnotation, LeafAnnotation } from '../../types/AnnotationTypes';
import { apiFetch } from '../../network/ApiFetch';
import { processWithConcurrency } from '../../utils/AsyncQueue';
import { FieldArtifact, PlantArtifact, ManifestSyncEntry } from '../../types/SyncTypes'


export interface ManifestSyncContextType {
  syncAllManifest: (
    serverURL: string,
    manifestEntries: ManifestSyncEntry[]
  ) => Promise<void>;
  lastResult: string | null;
}


const ManifestSyncContext = createContext<ManifestSyncContextType | undefined>(undefined);

export const useManifestSync = () => {
  const context = useContext(ManifestSyncContext);
  if (!context) {
    throw new Error('useManifestSync must be used within ManifestSyncProvider');
  }
  return context;
};

export const ManifestSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastResult, setLastResult] = useState<string | null>(null);

  ////////////////////////////////////////////
  // ORCHESTRATE UPLOADS
  ////////////////////////////////////////////
  
  const syncAllManifest = async (
    serverURL: string,
    manifestEntries: ManifestSyncEntry[]
  ) => {
    await processWithConcurrency(
      manifestEntries,
      async (entry) => {
        try {
          const res = await apiFetch(
            `${serverURL}${entry.endpoint}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(entry.artifact)
            },
            entry.manifestConfig
          );
  
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText);
          }
  
        } catch (err) {
          console.error(
            `Manifest ${entry.artifact.id} failed:`,
            err
          );
        }
      },
      3
    );
  };
  
  
  return (
    <ManifestSyncContext.Provider value={{ syncAllManifest, lastResult }}>
      {children}
    </ManifestSyncContext.Provider>
  );
};
