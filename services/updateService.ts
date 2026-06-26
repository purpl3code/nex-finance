import { APP_VERSION } from '../constants';

export interface AppUpdate {
  version: string;
  url: string;
  apkUrl: string;
  releaseNotes?: string;
}

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
        
        return {
          version: latestVersion,
          url: data.html_url,
          apkUrl: apkUrl,
          releaseNotes: data.body
        };
      }
      return null;
    } catch (e) {
      console.error('Error checking for updates:', e);
      return null;
    }
  }
};
