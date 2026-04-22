import { isDevMode } from "../../native/BuildConfigBridge";

type DevFlagsType = {
  useLeafMatching: boolean;
  toggleHealthy: boolean;
  useDevStorage: boolean;
  bypassVideoValidation: boolean;
  altOriginalArea: boolean;
  allowResetEntries: boolean;
  allowIndividualSync: boolean;
};

type Listener = (flags: DevFlagsType) => void;

const flags: DevFlagsType = {
  useLeafMatching: true,
  toggleHealthy: true,
  useDevStorage: false,
  bypassVideoValidation: false,
  altOriginalArea: false,
  allowResetEntries: false,
  allowIndividualSync: false,
};

const listeners = new Set<Listener>();

export const DevFlags = {
  get: (): DevFlagsType => flags,

  getKeys: (): (keyof DevFlagsType)[] => {
    return Object.keys(flags) as (keyof DevFlagsType)[];
  },

  isEnabled: (key: keyof DevFlagsType): boolean => {
    return flags[key];
  },

  set: (key: keyof DevFlagsType, value: boolean) => {
    flags[key] = value;

    // notify subscribers
    listeners.forEach(listener => listener({ ...flags }));
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

export const canUseDevFlags = isDevMode;