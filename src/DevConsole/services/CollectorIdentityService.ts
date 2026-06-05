import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "device_id";
const COLLECTOR_ID_KEY = "collector_id";
const COLLECTOR_NAME_KEY = "collector_name";

export interface CollectorIdentity {
  deviceId: string;
  collectorId: string;
  collectorName: string;
}

function generateId(): string {
  return `id_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export class CollectorIdentityService {
  static async initialize(): Promise<CollectorIdentity> {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    let collectorId = await AsyncStorage.getItem(COLLECTOR_ID_KEY);
    let collectorName = await AsyncStorage.getItem(COLLECTOR_NAME_KEY);

    if (!deviceId) {
      deviceId = generateId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    if (!collectorId) {
      collectorId = generateId();
      await AsyncStorage.setItem(COLLECTOR_ID_KEY, collectorId);
    }

    if (!collectorName) {
      collectorName = "Default Collector";
      await AsyncStorage.setItem(COLLECTOR_NAME_KEY, collectorName);
    }

    return {
      deviceId,
      collectorId,
      collectorName
    };
  }

  static async transferDevice(newName: string) {
    const newCollectorId = generateId();

    await AsyncStorage.setItem(COLLECTOR_ID_KEY, newCollectorId);
    await AsyncStorage.setItem(COLLECTOR_NAME_KEY, newName);
  }

  static async getIdentity(): Promise<CollectorIdentity> {
    return this.initialize();
  }
}