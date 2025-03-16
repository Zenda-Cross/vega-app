export const generateWhvxToken = async () => {
  try {
    // Fetch the WASM binary from the favicon URL
    const response = await fetch('https://www.vidbinge.com/favicon.png');
    const wasmArrayBuffer = await response.arrayBuffer();

    // Import definition similar to the original code
    const imports = {
      env: {
        rb(N: any, U: any) {
          // Create buffer from memory to write random bytes
          const memoryBuffer = wasmInstance.exports.memory.buffer;

          // Check for out-of-bounds access
          if (N + U > memoryBuffer.byteLength) {
            throw new RangeError(
              `[VBTK] Requested memory out of bounds: ptr=${N}, len=${U}, buffer size=${memoryBuffer.byteLength}`,
            );
          }

          // Generate and set random values (16 bytes)
          const randomArray = new Uint8Array(memoryBuffer, N, 16);
          for (let i = 0; i < 16; i++) {
            randomArray[i] = Math.floor(Math.random() * 256);
          }

          // Write the timestamp
          const timestamp = Math.floor(Date.now() / 1000);
          const view = new DataView(memoryBuffer, N + 16, 8);
          view.setBigUint64(0, BigInt(timestamp), true);
        },
      },
    };

    // Instantiate the WebAssembly with the imports
    const {instance: wasmInstance} = await WebAssembly.instantiate(
      wasmArrayBuffer,
      imports,
    );

    // Call the `vbtk` export to generate the token
    const {vbtk} = wasmInstance.exports;
    const tokenPtr = vbtk();
    if (tokenPtr === 0) {
      console.error('[VBTK] Error: Failed to generate token.');
      return;
    }

    // Extract the generated token from WASM memory
    const memoryBuffer = wasmInstance.exports.memory.buffer;
    let length = 0;
    while (new Uint8Array(memoryBuffer, tokenPtr + length, 1)[0] !== 0) {
      length++;
    }

    const token = new TextDecoder('utf-8').decode(
      new Uint8Array(memoryBuffer, tokenPtr, length),
    );
    console.log('Generated Token:', token);
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
  }
};
