import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orenzatech.orenza',
  appName: 'ORENZA',
  webDir: 'public',
  server: {
    url: 'https://orenza-platform.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
