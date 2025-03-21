export const getNfHeaders = async () => {
  const res = await fetch(
    'https://himanshu8443.github.io/providers/headers.json',
  );
  const data = await res.json();
  const cookie = data.nfmirror;
  return {
    Cookie: cookie,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
  };
};
