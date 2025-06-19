import {extensionManager} from '../../lib/services/ExtensionManager';

// Test function to verify manifest fetching
export const testManifestFetch = async () => {
  try {
    console.log('Testing manifest fetch...');
    const providers = await extensionManager.fetchManifest(true);
    console.log('Fetched providers:', providers.length);
    console.log('First provider:', providers[0]);
    return providers;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

// Test the direct URL
export const testDirectFetch = async () => {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/manifest.json',
    );
    const data = await response.json();
    console.log('Direct fetch result:', data.length, 'providers');
    return data;
  } catch (error) {
    console.error('Direct fetch failed:', error);
    throw error;
  }
};
