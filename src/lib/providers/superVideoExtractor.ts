export async function superVideoExtractor(data: any) {
  try {
    // Step 1: Extract the function parameters and the encoded string
    var functionRegex =
      /eval\(function\((.*?)\)\{.*?return p\}.*?\('(.*?)'\.split/;
    var match = functionRegex.exec(data);
    let p = '';
    if (match) {
      // var params = match[1].split(',').map(param => param.trim());
      var encodedString = match[2];

      // console.log('Parameters:', params);
      // console.log('Encoded String:', encodedString.split("',36,")[0], '🔥🔥');

      p = encodedString.split("',36,")?.[0].trim();
      let a = 36;
      let c = encodedString.split("',36,")[1].slice(2).split('|').length;
      let k = encodedString.split("',36,")[1].slice(2).split('|');

      while (c--) {
        if (k[c]) {
          var regex = new RegExp('\\b' + c.toString(a) + '\\b', 'g');
          p = p.replace(regex, k[c]);
        }
      }

      // console.log('Decoded String:', p);
    } else {
      console.log('No match found');
    }

    const streamUrl = p?.match(/file:\s*"([^"]+\.m3u8[^"]*)"/)?.[1];
    console.log('streamUrl:', streamUrl);

    return streamUrl || '';
  } catch (err) {
    console.error('SuperVideoExtractor Error:', err);
    return '';
  }
}
