import { SyncEntry } from '../../types/SyncTypes';
import { DevModes } from '../../DevConsole/configs/DevModesConfig';

export const getDefoliationValue = (
  entry?: SyncEntry
): number => {
  if (!entry?.inferenceResponse?.results) {
    return 0;
  }

  const results = entry.inferenceResponse.results;
  const defoMode = DevModes.getMode("defoMode");

  switch (defoMode) {
    case "leaf_matching":
      return results.leaf_matching_defo_result ?? 0;

    case "area_comp":
      return results.area_comp_defo_result ?? 0;

    case "area_direct":
      return results.area_direct_defo_result ?? 0;

    default:
      return 0;
  }
};