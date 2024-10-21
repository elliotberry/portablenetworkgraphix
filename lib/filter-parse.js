

import {getImagePasses} from "./interlace.js";
import paethPredictor from "./paeth-predictor.js";

function getByteWidth(width, bpp, depth) {
  const byteWidth = width * bpp;
  if (depth !== 8) {
    return Math.ceil(byteWidth / (8 / depth));
  }
  return byteWidth;
}

const Filter = function(bitmapInfo, {complete, read, write}) {
  const width = bitmapInfo.width;
  const height = bitmapInfo.height;
  const interlace = bitmapInfo.interlace;
  const bpp = bitmapInfo.bpp;
  const depth = bitmapInfo.depth;

  this.read = read;
  this.write = write;
  this.complete = complete;

  this._imageIndex = 0;
  this._images = [];
  if (interlace) {
    const passes = getImagePasses(width, height);
    for (const pass of passes) {
      this._images.push({
        byteWidth: getByteWidth(pass.width, bpp, depth),
        height: pass.height,
        lineIndex: 0,
      });
    }
  } else {
    this._images.push({
      byteWidth: getByteWidth(width, bpp, depth),
      height,
      lineIndex: 0,
    });
  }

  // when filtering the line we look at the pixel to the left
  // the spec also says it is done on a byte level regardless of the number of pixels
  // so if the depth is byte compatible (8 or 16) we subtract the bpp in order to compare back
  // a pixel rather than just a different byte part. However if we are sub byte, we ignore.
  if (depth === 8) {
    this._xComparison = bpp;
  } else if (depth === 16) {
    this._xComparison = bpp * 2;
  } else {
    this._xComparison = 1;
  }
};

Filter.prototype.start = function () {
  this.read(
    this._images[this._imageIndex].byteWidth + 1,
    this._reverseFilterLine.bind(this)
  );
};

Filter.prototype._unFilterType1 = function (
  rawData,
  unfilteredLine,
  byteWidth
) {
  const xComparison = this._xComparison;
  const xBiggerThan = xComparison - 1;

  for (let x = 0; x < byteWidth; x++) {
    const rawByte = rawData[1 + x];
    const f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    unfilteredLine[x] = rawByte + f1Left;
  }
};

Filter.prototype._unFilterType2 = function (
  rawData,
  unfilteredLine,
  byteWidth
) {
  const lastLine = this._lastLine;

  for (let x = 0; x < byteWidth; x++) {
    const rawByte = rawData[1 + x];
    const f2Up = lastLine ? lastLine[x] : 0;
    unfilteredLine[x] = rawByte + f2Up;
  }
};

Filter.prototype._unFilterType3 = function (
  rawData,
  unfilteredLine,
  byteWidth
) {
  const xComparison = this._xComparison;
  const xBiggerThan = xComparison - 1;
  const lastLine = this._lastLine;

  for (let x = 0; x < byteWidth; x++) {
    const rawByte = rawData[1 + x];
    const f3Up = lastLine ? lastLine[x] : 0;
    const f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    const f3Add = Math.floor((f3Left + f3Up) / 2);
    unfilteredLine[x] = rawByte + f3Add;
  }
};

Filter.prototype._unFilterType4 = function (
  rawData,
  unfilteredLine,
  byteWidth
) {
  const xComparison = this._xComparison;
  const xBiggerThan = xComparison - 1;
  const lastLine = this._lastLine;

  for (let x = 0; x < byteWidth; x++) {
    const rawByte = rawData[1 + x];
    const f4Up = lastLine ? lastLine[x] : 0;
    const f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    const f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
    const f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
    unfilteredLine[x] = rawByte + f4Add;
  }
};

Filter.prototype._reverseFilterLine = function (rawData) {
  const filter = rawData[0];
  let unfilteredLine;
  let currentImage = this._images[this._imageIndex];
  const byteWidth = currentImage.byteWidth;

  if (filter === 0) {
    unfilteredLine = rawData.slice(1, byteWidth + 1);
  } else {
    unfilteredLine = Buffer.alloc(byteWidth);

    switch (filter) {
      case 1: {
        this._unFilterType1(rawData, unfilteredLine, byteWidth);
        break;
      }
      case 2: {
        this._unFilterType2(rawData, unfilteredLine, byteWidth);
        break;
      }
      case 3: {
        this._unFilterType3(rawData, unfilteredLine, byteWidth);
        break;
      }
      case 4: {
        this._unFilterType4(rawData, unfilteredLine, byteWidth);
        break;
      }
      default: {
        throw new Error(`Unrecognised filter type - ${filter}`);
      }
    }
  }

  this.write(unfilteredLine);

  currentImage.lineIndex++;
  if (currentImage.lineIndex >= currentImage.height) {
    this._lastLine = null;
    this._imageIndex++;
    currentImage = this._images[this._imageIndex];
  } else {
    this._lastLine = unfilteredLine;
  }

  if (currentImage) {
    // read, using the byte width that may be from the new current image
    this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
  } else {
    this._lastLine = null;
    this.complete();
  }
};

export default Filter;