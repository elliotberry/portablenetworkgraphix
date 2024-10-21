import {getImagePasses,getInterlaceIterator } from "./interlace.js";

const pixelBppMapper = [
  // 0 - dummy entry
  () => {},

  // 1 - L
  // 0: 0, 1: 0, 2: 0, 3: 0xff
  (pxData, data, pxPos, rawPos) => {
    if (rawPos === data.length) {
      throw new Error("Ran out of data");
    }

    const pixel = data[rawPos];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = 0xff;
  },

  // 2 - LA
  // 0: 0, 1: 0, 2: 0, 3: 1
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 1 >= data.length) {
      throw new Error("Ran out of data");
    }

    const pixel = data[rawPos];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = data[rawPos + 1];
  },

  // 3 - RGB
  // 0: 0, 1: 1, 2: 2, 3: 0xff
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 2 >= data.length) {
      throw new Error("Ran out of data");
    }

    pxData[pxPos] = data[rawPos];
    pxData[pxPos + 1] = data[rawPos + 1];
    pxData[pxPos + 2] = data[rawPos + 2];
    pxData[pxPos + 3] = 0xff;
  },

  // 4 - RGBA
  // 0: 0, 1: 1, 2: 2, 3: 3
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 3 >= data.length) {
      throw new Error("Ran out of data");
    }

    pxData[pxPos] = data[rawPos];
    pxData[pxPos + 1] = data[rawPos + 1];
    pxData[pxPos + 2] = data[rawPos + 2];
    pxData[pxPos + 3] = data[rawPos + 3];
  },
];

const pixelBppCustomMapper = [
  // 0 - dummy entry
  () => {},

  // 1 - L
  // 0: 0, 1: 0, 2: 0, 3: 0xff
  (pxData, pixelData, pxPos, maxBit) => {
    const pixel = pixelData[0];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = maxBit;
  },

  // 2 - LA
  // 0: 0, 1: 0, 2: 0, 3: 1
  (pxData, pixelData, pxPos) => {
    const pixel = pixelData[0];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = pixelData[1];
  },

  // 3 - RGB
  // 0: 0, 1: 1, 2: 2, 3: 0xff
  (pxData, pixelData, pxPos, maxBit) => {
    pxData[pxPos] = pixelData[0];
    pxData[pxPos + 1] = pixelData[1];
    pxData[pxPos + 2] = pixelData[2];
    pxData[pxPos + 3] = maxBit;
  },

  // 4 - RGBA
  // 0: 0, 1: 1, 2: 2, 3: 3
  (pxData, pixelData, pxPos) => {
    pxData[pxPos] = pixelData[0];
    pxData[pxPos + 1] = pixelData[1];
    pxData[pxPos + 2] = pixelData[2];
    pxData[pxPos + 3] = pixelData[3];
  },
];

function bitRetriever(data, depth) {
  let leftOver = [];
  let index = 0;

  function split() {
    if (index === data.length) {
      throw new Error("Ran out of data");
    }
    const byte = data[index];
    index++;
    let byte8;
    let byte7;
    let byte6;
    let byte5;
    let byte4;
    let byte3;
    let byte2;
    let byte1;
    switch (depth) {
      default: {
        throw new Error("unrecognised depth");
      }
      case 16: {
        byte2 = data[index];
        index++;
        leftOver.push((byte << 8) + byte2);
        break;
      }
      case 4: {
        byte2 = byte & 0x0f;
        byte1 = byte >> 4;
        leftOver.push(byte1, byte2);
        break;
      }
      case 2: {
        byte4 = byte & 3;
        byte3 = (byte >> 2) & 3;
        byte2 = (byte >> 4) & 3;
        byte1 = (byte >> 6) & 3;
        leftOver.push(byte1, byte2, byte3, byte4);
        break;
      }
      case 1: {
        byte8 = byte & 1;
        byte7 = (byte >> 1) & 1;
        byte6 = (byte >> 2) & 1;
        byte5 = (byte >> 3) & 1;
        byte4 = (byte >> 4) & 1;
        byte3 = (byte >> 5) & 1;
        byte2 = (byte >> 6) & 1;
        byte1 = (byte >> 7) & 1;
        leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
        break;
      }
    }
  }

  return {
    end() {
      if (index !== data.length) {
        throw new Error("extra data found");
      }
    },
    get(count) {
      while (leftOver.length < count) {
        split();
      }
      const returner = leftOver.slice(0, count);
      leftOver = leftOver.slice(count);
      return returner;
    },
    resetAfterLine() {
      leftOver.length = 0;
    },
  };
}

function mapImage8Bit({height, index, width}, pxData, getPxPos, bpp, data, rawPos) {
   for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pxPos = getPxPos(x, y, index);
      pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
      rawPos += bpp;    
    }
  }
  return rawPos;
}

function mapImageCustomBit({height, index, width}, pxData, getPxPos, bpp, bits, maxBit) {
   for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelData = bits.get(bpp);
      const pxPos = getPxPos(x, y, index);
      pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
    }
    bits.resetAfterLine();
  }
}

export function dataToBitMap(data, bitmapInfo) {
  const width = bitmapInfo.width;
  const height = bitmapInfo.height;
  const depth = bitmapInfo.depth;
  const bpp = bitmapInfo.bpp;
  const interlace = bitmapInfo.interlace;
  let bits;

  if (depth !== 8) {
    bits = bitRetriever(data, depth);
  }
  const pxData = depth <= 8 ? Buffer.alloc(width * height * 4) : new Uint16Array(width * height * 4);
  const maxBit = 2 ** depth - 1;
  let rawPos = 0;
  let images;
  let getPxPos;

  if (interlace) {
    images = getImagePasses(width, height);
    getPxPos = getInterlaceIterator(width, height);
  } else {
    let nonInterlacedPxPos = 0;
    getPxPos = () => {
      const returner = nonInterlacedPxPos;
      nonInterlacedPxPos += 4;
      return returner;
    };
    images = [{ height, width }];
  }

  for (const image of images) {
    if (depth === 8) {
      rawPos = mapImage8Bit(
        image,
        pxData,
        getPxPos,
        bpp,
        data,
        rawPos
      );
    } else {
      mapImageCustomBit(
        image,
        pxData,
        getPxPos,
        bpp,
        bits,
        maxBit
      );
    }
  }
  if (depth === 8) {
    if (rawPos !== data.length) {
      throw new Error("extra data found");
    }
  } else {
    bits.end();
  }

  return pxData;
}
