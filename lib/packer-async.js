import util from "util";
import Stream from "stream";
import constants from "./constants.js";
import Packer from "./packer.js";

let PackerAsync = function (opt) {
  Stream.call(this);

  let options = opt || {};

  this._packer = new Packer(options);
  this._deflate = this._packer.createDeflate();

  this.readable = true;
};
util.inherits(PackerAsync, Stream);

PackerAsync.prototype.pack = function (data, width, height, gamma) {
  // Signature
  this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
  this.emit("data", this._packer.packIHDR(width, height));

  if (gamma) {
    this.emit("data", this._packer.packGAMA(gamma));
  }

  let filteredData = this._packer.filterData(data, width, height);

  // compress it
  this._deflate.on("error", this.emit.bind(this, "error"));

  this._deflate.on(
    "data",
    compressedData => {
      this.emit("data", this._packer.packIDAT(compressedData));
    }
  );

  this._deflate.on(
    "end",
    () => {
      this.emit("data", this._packer.packIEND());
      this.emit("end");
    }
  );

  this._deflate.end(filteredData);
};
export default PackerAsync;
