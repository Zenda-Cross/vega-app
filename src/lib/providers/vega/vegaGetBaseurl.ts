import axios from 'axios';

export const vegaGetBaseurl = async (
  providerValue: string,
): Promise<string> => {
  try {
    const baseUrlRes = await axios.get(
      'https://himanshu8443.github.io/providers/modflix.json',
    );
    const baseUrl =
      providerValue === 'vega'
        ? baseUrlRes.data.Vega.url
        : baseUrlRes.data.lux.url;

    return baseUrl;
  } catch (err) {
    console.error(err);
    return 'https://vegamovies.org/';
  }
};
