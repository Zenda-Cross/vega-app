function rot13(str: string) {
  return str.replace(/[a-zA-Z]/g, function (char) {
    const charCode = char.charCodeAt(0);
    const isUpperCase = char <= 'Z';
    const baseCharCode = isUpperCase ? 65 : 97;
    return String.fromCharCode(
      ((charCode - baseCharCode + 13) % 26) + baseCharCode,
    );
  });
}

export function decodeString(encryptedString: string) {
  try {
    // First base64 decode
    let decoded = atob(encryptedString);

    // Second base64 decode
    decoded = atob(decoded);

    // ROT13 decode
    decoded = rot13(decoded);

    // Third base64 decode
    decoded = atob(decoded);

    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding string:', error);
    return null;
  }
}
