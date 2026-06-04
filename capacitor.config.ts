import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ciadoceu.hekat',
  appName: 'Hekat Astromemorias',
  webDir: 'dist',
  server: {
    hostname: 'hekat-astromemorias-app-store.vercel.app',
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
