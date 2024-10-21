import Filter from "./filter-parse.js";
import SyncReader from "./sync-reader.js";

export function process(inBuffer, bitmapInfo) {
  const outBuffers = [];
  const reader = new SyncReader(inBuffer);
  const filter = new Filter(bitmapInfo, {
    complete() {},
    read: reader.read.bind(reader),
    write(bufferPart) {
      outBuffers.push(bufferPart);
    },
  });

  filter.start();
  reader.process();

  return Buffer.concat(outBuffers);
}
