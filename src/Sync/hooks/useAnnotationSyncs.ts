import { useSync } from "../context/SyncContext";
import { useManifestSync } from "../context/ManifestSyncContext";
import { DevServerConfig } from "../../DevConsole/configs/DevServerConfig";

import { buildLeafSyncEntries } from "../adapters/leafSyncAdapter";
import { buildManifestEntries } from "../adapters/manifestSyncAdapter";

import {
  FieldAnnotation,
  PlantAnnotation,
  LeafAnnotation
} from "../../types/AnnotationTypes";

export function useAnnotationSync(
  getHierarchyName: any,
  leafMap: Record<string, LeafAnnotation>
) {
  const { syncAllPending } = useSync();
  const { syncAllManifest } = useManifestSync();

  //////////////////////////////////////////////////
  // FULL DATASET SYNC
  //////////////////////////////////////////////////

  const handleSync = async (
    fields: FieldAnnotation[],
    plants: PlantAnnotation[],
    leaves: LeafAnnotation[],
    setSyncResult: (msg: string) => void
  ) => {
    const serverURL = DevServerConfig.getBaseURL();

    const leafEntries = buildLeafSyncEntries(
      leaves,
      getHierarchyName
    );

    const manifestEntries = buildManifestEntries(
      fields,
      plants,
      leafMap,
      getHierarchyName
    );

    await syncAllPending(
      serverURL,
      leafEntries,
      setSyncResult
    );

    await syncAllManifest(
      serverURL,
      manifestEntries
    );
  };

  //////////////////////////////////////////////////
  // FIELD SYNC
  //////////////////////////////////////////////////

  const handleSyncField = async (
    fieldId: string,
    fields: FieldAnnotation[],
    plants: PlantAnnotation[],
    leaves: LeafAnnotation[],
    setSyncResult: (msg: string) => void
  ) => {
    const serverURL = DevServerConfig.getBaseURL();

    const field = fields.find(f => f.id === fieldId);

    if (!field) {
      setSyncResult(`Field not found: ${fieldId}`);
      return;
    }

    // only plants belonging to this field
    const fieldPlants = plants.filter(p =>
      field.childPlants.includes(p.id)
    );

    // only leaves belonging to those plants
    const fieldLeafIds = fieldPlants.flatMap(
      p => p.childLeaves
    );

    const fieldLeaves = leaves.filter(l =>
      fieldLeafIds.includes(l.id)
    );

    const leafEntries = buildLeafSyncEntries(
      fieldLeaves,
      getHierarchyName
    );

    // only send:
    // - this field manifest
    // - plants inside this field
    const manifestEntries = buildManifestEntries(
      [field],
      fieldPlants,
      leafMap,
      getHierarchyName
    );

    await syncAllPending(
      serverURL,
      leafEntries,
      setSyncResult
    );

    await syncAllManifest(
      serverURL,
      manifestEntries
    );
  };

  //////////////////////////////////////////////////
  // PLANT SYNC
  //////////////////////////////////////////////////

  const handleSyncPlant = async (
    plantId: string,
    fields: FieldAnnotation[],
    plants: PlantAnnotation[],
    leaves: LeafAnnotation[],
    setSyncResult: (msg: string) => void
  ) => {
    const serverURL = DevServerConfig.getBaseURL();

    const plant = plants.find(p => p.id === plantId);

    if (!plant) {
      setSyncResult(`Plant not found: ${plantId}`);
      return;
    }

    const parentField = fields.find(
      f => f.id === plant.parentField
    );

    if (!parentField) {
      setSyncResult(
        `Parent field not found for plant: ${plantId}`
      );
      return;
    }

    const plantLeaves = leaves.filter(l =>
      plant.childLeaves.includes(l.id)
    );

    const leafEntries = buildLeafSyncEntries(
      plantLeaves,
      getHierarchyName
    );

    // only send:
    // - this plant manifest
    // - parent field manifest
    const manifestEntries = buildManifestEntries(
      [parentField],
      [plant],
      leafMap,
      getHierarchyName
    );

    await syncAllPending(
      serverURL,
      leafEntries,
      setSyncResult
    );

    await syncAllManifest(
      serverURL,
      manifestEntries
    );
  };

  return {
    handleSync,
    handleSyncField,
    handleSyncPlant
  };
}