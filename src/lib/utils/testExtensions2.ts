import axios from 'axios';
import {extensionManager} from '../services/ExtensionManager';

// Test function to verify manifest fetching
export const testManifestFetch = async () => {
  try {
    console.log('Testing manifest fetch...');
    const providers = await extensionManager.fetchManifest(true);
    console.log('Fetched providers:', providers?.length || 0);
    if (providers && providers.length > 0) {
      console.log('First provider:', providers[0]);
    }
    return providers;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
};

// Test the direct URL with axios
export const testDirectFetch = async () => {
  try {
    console.log('Testing direct axios fetch...');
    const response = await axios.get(
      'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main/manifest.json',
      {
        timeout: 10000,
      },
    );
    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    console.log('Response data length:', response.data?.length || 0);
    if (response.data && response.data.length > 0) {
      console.log('Sample provider:', response.data[0]);
    }
    return response.data;
  } catch (error) {
    console.error('Direct fetch failed:', error);
    throw error;
  }
};
