import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.englishclimb.app",
  appName: "English Climb",
  webDir: "out",
  android: {
    allowMixedContent: false
  }
};

export default config;
