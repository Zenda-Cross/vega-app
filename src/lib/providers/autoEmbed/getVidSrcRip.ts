import {Stream} from '../types';

export async function getVidSrcRip(
  tmdbId: string,
  season: string,
  episode: string,
  stream: Stream[],
) {
  try {
    const sources = ['flixhq'];
    const baseUrl = 'aHR0cHM6Ly92aWRzcmMucmlw';
    const timeout = 3000;

    await Promise.all(
      sources.map(async source => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const apiUrl = await useVRF(source, tmdbId, season, episode);
            const response = await fetch(atob(baseUrl) + apiUrl, {
              signal: controller.signal,
            });
            const data = await response.json();

            if (data.sources?.length > 0) {
              stream.push({
                server: source,
                type: data?.sources[0].file.includes('.mp4') ? 'mp4' : 'm3u8',
                link: data?.sources[0].file,
              });
            }
          } finally {
            clearTimeout(timeoutId); // Clean up the timeout
          }
        } catch (error) {
          // Handle individual source errors
          console.log(`Error fetching from ${source}:`, error);
          // Don't rethrow - allow other sources to continue
        }
      }),
    );
  } catch (e) {
    console.log('vidsrcRip error', e);
  }
}

async function generateVRF(sourceIdentifier: string, tmdbId: string) {
  try {
    // Helper function to fetch key from image
    async function fetchKeyFromImage() {
      const response = await fetch('https://vidsrc.rip/images/skip-button.png');
      const data = await response.text();
      console.log('Fetched data from image:', data);
      return data;
    }

    // XOR encryption/decryption function
    function xorEncryptDecrypt(key: any, data: any) {
      const keyChars = Array.from(key, char => char.charCodeAt(0));
      const dataChars = Array.from(data, char => char.charCodeAt(0));
      const result = [];
      for (let i = 0; i < dataChars.length; i++) {
        result.push(dataChars[i] ^ keyChars[i % keyChars.length]);
      }
      return String.fromCharCode.apply(null, result);
    }

    // Fetch the key
    const key = await fetchKeyFromImage();
    console.log('Fetched key:', key);

    // Construct the input string
    const input = `/api/source/${sourceIdentifier}/${tmdbId}`;

    // Decode the input string
    const decodedInput = decodeURIComponent(input);

    // Perform XOR encryption
    const xorResult = xorEncryptDecrypt(key, decodedInput);

    // Base64 encode and URL encode the result
    const vrf = encodeURIComponent(btoa(xorResult));

    return vrf;
  } catch (e) {
    console.log('error gernerating vrf vidsrcRip', e);
  }
}

// Usage example
async function useVRF(
  sourceIdentifier: string,
  tmdbId: string,
  season: string,
  episode: string,
) {
  try {
    const vrf = await generateVRF(sourceIdentifier, tmdbId);
    console.log('Generated VRF:', vrf);
    const params = season && episode ? `&s=${season}&e=${episode}` : '';
    // Use the VRF in your API call
    const apiUrl = `/api/source/${sourceIdentifier}/${tmdbId}?vrf=${vrf}${params}`;
    console.log('API URL:', apiUrl);

    // Make your API call here
    // const response = await fetch(apiUrl);
    // ... handle the response
    return apiUrl;
  } catch (error) {
    console.error('Error generating VRF:', error);
  }
}
