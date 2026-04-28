import { FieldAnnotation, PlantAnnotation, LeafAnnotation } from "../../types/AnnotationTypes";
import { ManifestSyncEntry } from "../../types/SyncTypes";
  
function buildPlantManifestEntry(
  plant: PlantAnnotation,
  leafMap: Record<string, LeafAnnotation>,
  getHierarchyName: any
): ManifestSyncEntry {

  const leafArtifactIds = plant.childLeaves
    .map((leafId) => {
      const leaf = leafMap[leafId];

      if (!leaf?.video) return null;

      return leaf.video
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "");
    })
    .filter(Boolean) as string[];

  const last_updated = new Date().toISOString();

  const artifact = {
    id: plant.id,
    name: plant.name,
    fieldId: plant.parentField,
    leaves: leafArtifactIds,
    last_updated
  };

  return {
    endpoint: "/send/manifest/plant",
    artifact,
    last_updated,
    manifestConfig: {
      "X-Artifact-Family": "manifest",
      "X-Manifest-ID": plant.id,
      "X-Manifest-Name": getHierarchyName(
        plant.id,
        "plant",
        "plant"
      ),
      "X-Manifest-Type": "plant",
    }
  };
}

function buildFieldManifestEntry(
  field: FieldAnnotation,
  getHierarchyName: any
): ManifestSyncEntry {

  const last_updated = new Date().toISOString();

  const artifact = {
    id: field.id,
    name: field.name,
    plants: field.childPlants,
    last_updated
  };

  return {
    endpoint: "/send/manifest/field",
    artifact,
    last_updated,
    manifestConfig: {
      "X-Artifact-Family": "manifest",
      "X-Manifest-ID": field.id,
      "X-Manifest-Name": getHierarchyName(
        field.id,
        "field",
        "field"
      ),
      "X-Manifest-Type": "field",
    }
  };
}

export function buildManifestEntries(
  fields: FieldAnnotation[],
  plants: PlantAnnotation[],
  leafMap: Record<string, LeafAnnotation>,
  getHierarchyName: any
): ManifestSyncEntry[] {

  const plantEntries = plants.map((plant) => buildPlantManifestEntry(plant, leafMap, getHierarchyName));
  const fieldEntries = fields.map((field) => buildFieldManifestEntry(field, getHierarchyName));

  return [...plantEntries, ...fieldEntries];
}