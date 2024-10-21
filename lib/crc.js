const crcTable = [];

{
  for (let index = 0; index < 256; index++) {
    let currentCrc = index;
    for (let index_ = 0; index_ < 8; index_++) {
      currentCrc = currentCrc & 1 ? 0xed_b8_83_20 ^ (currentCrc >>> 1) : currentCrc >>> 1;
    }
    crcTable[index] = currentCrc;
  }
}

const CrcCalculator = function () {
  this._crc = -1;
};

CrcCalculator.prototype.write = function (data) {
  for (const datum of data) {
    this._crc = crcTable[(this._crc ^ datum) & 0xff] ^ (this._crc >>> 8);
  }
  return true;
};

CrcCalculator.prototype.crc32 = function () {
  return this._crc ^ -1;
};

CrcCalculator.crc32 = buf => {
  let crc = -1;
  for (const element of buf) {
    crc = crcTable[(crc ^ element) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
};

export { CrcCalculator };
