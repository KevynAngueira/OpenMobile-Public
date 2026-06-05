import { isDevMode } from "../../native/BuildConfigBridge";

/* -------------------------
   Mode Types
-------------------------- */

export type SyncMode = "all" | "field" | "plant";
export type DefoMode =  "leaf_matching" | "area_direct" | "area_comp"

type DevModesType = {
  syncMode: SyncMode;
  defoMode: DefoMode
};

/* -------------------------
   Mode Metadata
-------------------------- */
const modeValues: {
  [K in keyof DevModesType]: DevModesType[K][];
} = {
  syncMode: ["all", "field", "plant"],
  defoMode: ["leaf_matching", "area_direct", "area_comp"],
};

type Listener = (modes: DevModesType) => void;

/* -------------------------
   Default Values
-------------------------- */
const modes: DevModesType = {
  syncMode: "field",
  defoMode: "area_direct",
};

const listeners = new Set<Listener>();

const notifyListeners = () => {
  listeners.forEach(listener =>
    listener({ ...modes })
  );
};

export const DevModes = {
  get: (): DevModesType => modes,

  getKeys: (): (keyof DevModesType)[] => {
    return Object.keys(modes) as (keyof DevModesType)[];
  },

  getModeValues: <
    K extends keyof DevModesType
  >(key: K): DevModesType[K][] => {
    return modeValues[key];
  },

  getMode: <
    K extends keyof DevModesType
  >(key: K): DevModesType[K] => {
    return modes[key];
  },

  setMode: <
    K extends keyof DevModesType
  >(
    key: K,
    value: DevModesType[K]
  ) => {
    modes[key] = value;
    notifyListeners();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export const canUseDevModes = isDevMode;