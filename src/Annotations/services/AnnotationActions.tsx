// AnnotationsActions.tsx
import { server } from '../../../metro.config';
import { useSync } from '../../Sync/context/SyncContext';
import { isLeafDetailsValid } from '../utils/AnnotationValidation';
import { useManifestSync } from '../../Sync/context/ManifestSyncContext';
import { FieldAnnotation, LeafAnnotation, PlantAnnotation } from '../../types/AnnotationTypes';

import { DevServerConfig } from '../../DevConsole/configs/DevServerConfig';
import { DevFlags } from '../../DevConsole/configs/DevFlagsConfig';
import { useAnnotationMaps } from '../../hooks/useAnnotationMaps';

const useHandleSync = (getHierarchyName: any) => {
  const { syncAllPending } = useSync();
  const { syncAllManifest } = useManifestSync();
  
  // ------------------------------------------
  //      ---- Helper Functions ----
  // ------------------------------------------

  const getValidLeaves = (leaves: LeafAnnotation[]) => {
    return leaves.filter(
      (leaf) =>
        leaf.video &&
        isLeafDetailsValid(
          leaf.length,
          leaf.leafNumber,
          leaf.directArea,
          leaf.maxLength,
          leaf.maxWidth
        )
    );
  };

  const buildSyncEntry = (leaf: LeafAnnotation, getHierarchyName: any) => {
    const leafConfig: any = {
      "X-Leaf-ID": leaf.id,
      "X-Leaf-Name": getHierarchyName(leaf.id, "leaf", "leaf"),
      "X-Is-Healthy": leaf.isHealthy || false,
    };
  
    const params: any = {
      length: leaf.length,
      leafNumber: leaf.leafNumber,
    };
  
    if (DevFlags.isEnabled("altOriginalArea")) {
      params.directArea = leaf.directArea;
      params.maxLength = leaf.maxLength;
      params.maxWidth = leaf.maxWidth;
    } else {
      params.directArea = "";
      params.maxLength = "";
      params.maxWidth = "";
    }
  
    return {
      path: leaf.video,
      params,
      leafConfig,
    };
  };
  
  // ------------------------------------------
  //         ---- Handle Sync ----
  // ------------------------------------------

  const handleSync = async (
    fieldAnnotations: FieldAnnotation[],
    plantAnnotations: PlantAnnotation[],
    leafAnnotations: LeafAnnotation[],
    setSyncResult: (message: string) => void
  ) => {

    const serverURL = DevServerConfig.getBaseURL();

    const validLeaves = getValidLeaves(leafAnnotations);
  
    const entriesToSend = validLeaves.map(leaf =>
      buildSyncEntry(leaf, getHierarchyName)
    );
  
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error("Inference Sync error:", error);
      setSyncResult("Inference Sync Failed: " + error.message);
    }
  
    try {
      await syncAllManifest(
        serverURL,
        fieldAnnotations,
        plantAnnotations,
        leafAnnotations
      );
    } catch (error: any) {
      console.error("Manifest Sync error:", error);
      setSyncResult("Manifest Sync Failed: " + error.message);
    }
  };


  const handleSyncField = async (
    fieldId: string,
    fieldAnnotations: FieldAnnotation[],
    plantAnnotations: PlantAnnotation[],
    leafAnnotations: LeafAnnotation[],
    setSyncResult: (message: string) => void
  ) => {
    const serverURL = DevServerConfig.getBaseURL();

    const field = fieldAnnotations.find(f => f.id === fieldId);
  
    if (!field) {
      setSyncResult(`Field not found: ${fieldId}`);
      return;
    }
  
    const fieldPlants = plantAnnotations.filter(p =>
      field.childPlants.includes(p.id)
    );
  
    const leafIds = fieldPlants.flatMap(p => p.childLeaves);
  
    const fieldLeaves = leafAnnotations.filter(l =>
      leafIds.includes(l.id)
    );
  
    const validLeaves = getValidLeaves(fieldLeaves);
  
    const entriesToSend = validLeaves.map(leaf =>
      buildSyncEntry(leaf, getHierarchyName)
    );
  
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error("Field Sync error:", error);
      setSyncResult("Field Sync Failed: " + error.message);
    }
  };


  const handleSyncPlant = async (
    plantId: string,
    fieldAnnotations: FieldAnnotation[],
    plantAnnotations: PlantAnnotation[],
    leafAnnotations: LeafAnnotation[],
    setSyncResult: (message: string) => void
  ) => {
    const serverURL = DevServerConfig.getBaseURL();

    const plant = plantAnnotations.find(p => p.id === plantId);
  
    if (!plant) {
      setSyncResult(`Plant not found: ${plantId}`);
      return;
    }
  
    const plantLeaves = leafAnnotations.filter(leaf =>
      plant.childLeaves.includes(leaf.id)
    );
  
    const validLeaves = getValidLeaves(plantLeaves);
  
    const entriesToSend = validLeaves.map(leaf =>
      buildSyncEntry(leaf, getHierarchyName)
    );
  
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error("Inference Sync error:", error);
      setSyncResult("Inference Sync Failed: " + error.message);
    }
  };
  
  
  return { handleSync, handleSyncField, handleSyncPlant };
}

export default useHandleSync;