import { LeafAnnotation } from "../../types/AnnotationTypes";
import { DevFlags } from "../../DevConsole/configs/DevFlagsConfig";
import { isLeafDetailsValid } from "../../Annotations/utils/AnnotationValidation";


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

const buildLeaf = (leaf: LeafAnnotation, getHierarchyName: any) => {
  const leafConfig: any = {
    "X-Artifact-Family": "leaf",
    "X-Leaf-ID": leaf.id,
    "X-Leaf-Name": getHierarchyName(leaf.id, "leaf", "leaf"),
    "X-Is-Healthy": String(leaf.isHealthy || false),
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

export function buildLeafSyncEntries(
  leaves: LeafAnnotation[],
  getHierarchyName: any
) {

  const validLeaves = getValidLeaves(leaves);

  const  protoLeafEntries = validLeaves.map((leaf) => buildLeaf(leaf, getHierarchyName));

  return protoLeafEntries;
}