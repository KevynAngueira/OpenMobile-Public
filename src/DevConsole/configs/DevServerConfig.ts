// DevServerConfig.ts

const DEFAULT_URL = "https://demo.rainhail.com/leafscan/";

let customIP: string | null = null;
let customPort: string | null = null;

export const DevServerConfig = {
  setIP: (ip: string) => {
    customIP = ip;
  },

  setPort: (port: string) => {
    customPort = port;
  },

  getIP: () => customIP ?? "",
  getPort: () => customPort ?? "",

  getBaseURL: () => {
    if (customIP && customPort) {
      return `http://${customIP}:${customPort}`;
    }
    return DEFAULT_URL;
  },

  useDefault: () => {
    customIP = null;
    customPort = null;
  },

  isUsingDefault: () => customIP === null && customPort === null,

  getDefaultURL: () => DEFAULT_URL,
};
