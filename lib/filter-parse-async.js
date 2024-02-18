import util from "util";
import ChunkStream from "./chunkstream.js";
import Filter from "./filter-parse.js";

let FilterAsync = function (bitmapInfo) {
  ChunkStream.call(this);

  let buffers = [];
  let that = this;
  this._filter = new Filter(bitmapInfo, {
    read: this.read.bind(this),
    write(buffer) {
      buffers.push(buffer);
    },
    complete() {
      that.emit("complete", Buffer.concat(buffers));
    },
  });

  this._filter.start();
};
util.inherits(FilterAsync, ChunkStream);

export default FilterAsync;
