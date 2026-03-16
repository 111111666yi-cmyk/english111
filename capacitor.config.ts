import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.englishclimb.app",
  appName: "Open English",
  webDir: "out",
  android: {
    allowMixedContent: false
  }
};

export default config;
