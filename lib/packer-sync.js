import zlib from "node:zlib";
let hasSyncZlib = true;
if (!zlib.deflateSync) {
  hasSyncZlib = false;
}
import constants from "./constants.js";
import Packer from "./packer.js";

export default ({width, height, gamma, data}, opt) => {
  if (!hasSyncZlib) {
    throw new Error(
      "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
    );
  }

  let options = opt || {};

  let packer = new Packer(options);

  let chunks = [];

  // Signature
  chunks.push(Buffer.from(constants.PNG_SIGNATURE));

  // Header
  chunks.push(packer.packIHDR(width, height));

  if (gamma) {
    chunks.push(packer.packGAMA(gamma));
  }

  let filteredData = packer.filterData(
    data,
    width,
    height
  );

  // compress it
  let compressedData = zlib.deflateSync(
    filteredData,
    packer.getDeflateOptions()
  );
  filteredData = null;

  if (!compressedData || !compressedData.length) {
    throw new Error("bad png - invalid compressed data response");
  }
  chunks.push(packer.packIDAT(compressedData));

  // End
  chunks.push(packer.packIEND());

  return Buffer.concat(chunks);
};
