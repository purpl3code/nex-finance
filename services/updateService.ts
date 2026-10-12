import { APP_VERSION } from '../constants';
import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';

export interface AppUpdate {
  version: string;
  url: string;
  apkUrl: string;
  apkSha256?: string;
  releaseNotes?: string;
}

export interface UpdateDownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  progress: number;
}

interface NativeUpdaterPlugin {
  downloadAndInstall(options: { url: string; version: string; sha256?: string }): Promise<{
    status: 'permission_required' | 'installer_opened';
  }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (progress: UpdateDownloadProgress) => void
  ): Promise<PluginListenerHandle>;
}

const NativeUpdater = registerPlugin<NativeUpdaterPlugin>('NativeUpdater');

// Helper to compare semver versions (e.g., "v1.2.1" > "v1.2.0")
const isNewerVersion = (latest: string, current: string): boolean => {
  try {
    const clean = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const [lMajor, lMinor, lPatch] = clean(latest);
    const [cMajor, cMinor, cPatch] = clean(current);
    
    if (isNaN(lMajor) || isNaN(cMajor)) return latest !== current; // Fallback
    
    if (lMajor > cMajor) return true;
    if (lMajor === cMajor && lMinor > cMinor) return true;
    if (lMajor === cMajor && lMinor === cMinor && lPatch > cPatch) return true;
    return false;
  } catch {
    return latest !== current; // Fallback
  }
};

export const UpdateService = {
  checkForUpdates: async (): Promise<AppUpdate | null> => {
    try {
      const response = await fetch('https://api.github.com/repos/purpl3code/nex-finance/releases/latest');
      if (!response.ok) return null;
      
      const data = await response.json();
      const latestVersion = data.tag_name; // e.g., "v1.2.0"
      
      if (latestVersion && isNewerVersion(latestVersion, APP_VERSION)) {
        // Find the first APK asset, or fallback to the release page HTML url
        const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));
        const apkUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;
        const apkSha256 = typeof apkAsset?.digest === 'string'
          ? apkAsset.digest.replace(/^sha256:/i, '')
          : undefined;
        
        return {
          version: latestVersion,
          url: data.html_url,
          apkUrl: apkUrl,
          apkSha256,
          releaseNotes: data.body
        };
      }
      return null;
    } catch (e) {
      console.error('Error checking for updates:', e);
      return null;
    }
  },

  installUpdate: async (
    update: AppUpdate,
    onProgress: (progress: UpdateDownloadProgress) => void
  ): Promise<{ status: 'permission_required' | 'installer_opened' | 'browser_opened' }> => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      window.location.href = update.apkUrl;
      return { status: 'browser_opened' };
    }

    const listener = await NativeUpdater.addListener('downloadProgress', onProgress);
    try {
      return await NativeUpdater.downloadAndInstall({
        url: update.apkUrl,
        version: update.version,
        sha256: update.apkSha256,
      });
    } finally {
      await listener.remove();
    }
  }
};
