import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.orenzatech.orenza.admin',
  appName: 'ORENZA Admin',
  webDir: 'public',
  server: {
    url: 'https://orenza-platform.vercel.app/admin',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
