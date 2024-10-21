import {inherits} from "node:util";

import ChunkStream from "./chunkstream.js";
import Filter from "./filter-parse.js";

const FilterAsync = function (bitmapInfo) {
  ChunkStream.call(this);

  const buffers = [];
  const that = this;
  this._filter = new Filter(bitmapInfo, {
    complete() {
      that.emit("complete", Buffer.concat(buffers));
    },
    read: this.read.bind(this),
    write(buffer) {
      buffers.push(buffer);
    },
  });

  this._filter.start();
};
inherits(FilterAsync, ChunkStream);

export default FilterAsync;
