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
  
  
  const handleSync = async (
    fieldAnnotations: FieldAnnotation[],
    plantAnnotations: PlantAnnotation[],
    leafAnnotations: LeafAnnotation[],
    setSyncResult: (message: string) => void
  ) => {

    let serverURL = DevServerConfig.getBaseURL(); 

    const entriesToSend = leafAnnotations
    .filter((leaf) =>
      leaf.video &&
      isLeafDetailsValid(leaf.length, leaf.leafNumber, leaf.directArea, leaf.maxLength, leaf.maxWidth)
    )
    .map((leaf) => {
      const leafConfig: any = {
        "X-Leaf-ID": leaf.id,
        "X-Leaf-Name": getHierarchyName(leaf.id, "leaf", "leaf"),
        "X-Is-Healthy": leaf.isHealthy || false, 
      };

      const params: any = {
        length: leaf.length,
        leafNumber: leaf.leafNumber,
      };

      if (DevFlags.isEnabled("altOriginalArea")){
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
        leafConfig
      };
    });
   
    // Run Sync Inference
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error('Inference Sync error:', error);
      setSyncResult("Inference Sync Failed: " + error.message);
      setTimeout(() => setSyncResult(null), 3000);
    }

    // Run Sync Manifests
    try {
      await syncAllManifest(serverURL, fieldAnnotations, plantAnnotations, leafAnnotations);
    } catch (error: any) {
      console.error("Manifest Sync error:", error);
      setSyncResult("Manifest Sync Failed: " + error.message);
      setTimeout(() => setSyncResult(null), 3000);
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
  
    // Get all plants belonging to this field
    const plantIdSet = new Set(field.childPlants);
  
    const fieldPlants = plantAnnotations.filter(
      plant => plantIdSet.has(plant.id)
    );
  
    // Collect all leaf IDs from those plants
    const leafIdSet = new Set(
      fieldPlants.flatMap(plant => plant.childLeaves)
    );
  
    const fieldLeaves = leafAnnotations.filter(
      leaf => leafIdSet.has(leaf.id)
    );
  
    const entriesToSend = fieldLeaves
      .filter(
        (leaf) =>
          leaf.video &&
          isLeafDetailsValid(
            leaf.length,
            leaf.leafNumber,
            leaf.directArea,
            leaf.maxLength,
            leaf.maxWidth
          )
      )
      .map((leaf) => {
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
      });
  
    if (entriesToSend.length === 0) {
      setSyncResult(`No valid leaves to sync for field ${field.name}`);
      return;
    }
  
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error("Field Sync error:", error);
      setSyncResult("Field Sync Failed: " + error.message);
      setTimeout(() => setSyncResult(null), 3000);
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
  
    const leafIdSet = new Set(plant.childLeaves);
  
    const plantLeaves = leafAnnotations.filter(
      leaf => leafIdSet.has(leaf.id)
    );
  
    const entriesToSend = plantLeaves
      .filter((leaf) =>
        leaf.video &&
        isLeafDetailsValid(leaf.length, leaf.leafNumber, leaf.directArea, leaf.maxLength, leaf.maxWidth)
      )
      .map((leaf) => {
  
        const leafConfig: any = {
          "X-Leaf-ID": leaf.id,
          "X-Leaf-Name": getHierarchyName(leaf.id, "leaf", "leaf"),
          "X-Is-Healthy": leaf.isHealthy || false, 
        };
  
        const params: any = {
          length: leaf.length,
          leafNumber: leaf.leafNumber,
        };
  
        if (DevFlags.isEnabled("altOriginalArea")){
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
          leafConfig
        };
      });

    if (entriesToSend.length === 0) {
      setSyncResult(`No valid leaves to sync for plant ${plantId}`);
      return;
    }
  
    try {
      await syncAllPending(serverURL, entriesToSend, setSyncResult);
    } catch (error: any) {
      console.error('Inference Sync error:', error);
      setSyncResult("Inference Sync Failed: " + error.message);
      setTimeout(() => setSyncResult(null), 3000);
    }
  };
  

  return { handleSync, handleSyncField, handleSyncPlant };
}

export default useHandleSync;