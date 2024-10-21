import zlib from "node:zlib";
import {Buffer} from "node:buffer";
import {dataToBitMap} from "./bitmapper.js";
import {process} from "./filter-parse-sync.js";
import formatNormaliser from "./format-normaliser.js";
import Parser from "./parser.js";
import {inflateSync} from "./sync-inflate.js";
import SyncReader from "./sync-reader.js";


let hasSyncZlib = true;
if (!zlib.deflateSync) {
  hasSyncZlib = false;
}

export default (buffer, options) => {
  if (!hasSyncZlib) {
    throw new Error(
      "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
    );
  }

  let error;
  function handleError(_error_) {
    error = _error_;
  }

  let metaData;
  function handleMetaData(_metaData_) {
    metaData = _metaData_;
  }

  function handleTransColor(transColor) {
    metaData.transColor = transColor;
  }

  function handlePalette(palette) {
    metaData.palette = palette;
  }

  function handleSimpleTransparency() {
    metaData.alpha = true;
  }

  let gamma;
  function handleGamma(_gamma_) {
    gamma = _gamma_;
  }

  let inflateDataList = [];
  function handleInflateData(inflatedData) {
    inflateDataList.push(inflatedData);
  }

  let reader = new SyncReader(buffer);

  let parser = new Parser(options, {
    error: handleError,
    gamma: handleGamma,
    inflateData: handleInflateData,
    metadata: handleMetaData,
    palette: handlePalette,
    read: reader.read.bind(reader),
    simpleTransparency: handleSimpleTransparency,
    transColor: handleTransColor,
  });

  parser.start();
  reader.process();

  if (error) {
    throw error;
  }

  //join together the inflate datas
  let inflateData = Buffer.concat(inflateDataList);
  inflateDataList.length = 0;

  let inflatedData;
  if (metaData.interlace) {
    inflatedData = zlib.inflateSync(inflateData);
  } else {
    let rowSize =
      ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1;
    let imageSize = rowSize * metaData.height;
    inflatedData = inflateSync(inflateData, {
      chunkSize: imageSize,
      maxLength: imageSize,
    });
  }
  inflateData = null;

  if (!inflatedData || inflatedData.length === 0) {
    throw new Error("bad png - invalid inflate data response");
  }

  let unfilteredData = process(inflatedData, metaData);
  inflateData = null;

  let bitmapData = dataToBitMap(unfilteredData, metaData);
  unfilteredData = null;

  let normalisedBitmapData = formatNormaliser(
    bitmapData,
    metaData,
    options.skipRescale
  );

  metaData.data = normalisedBitmapData;
  metaData.gamma = gamma || 0;

  return metaData;
};
