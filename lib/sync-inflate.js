import {ok as assert} from "node:assert";

import {Buffer,kMaxLength} from "node:buffer";
import zlib from "node:zlib";
class Inflate extends zlib.Inflate {
  constructor(options) {
    if (!(this instanceof Inflate)) {
      return new Inflate(options);
    }

    if (options && options.chunkSize < zlib.Z_MIN_CHUNK) {
      options.chunkSize = zlib.Z_MIN_CHUNK;
    }

    super(options);

    // Node 8 --> 9 compatibility check
    this._offset = this._offset === undefined ? this._outOffset : this._offset;
    this._buffer = this._buffer || this._outBuffer;

    if (options && options.maxLength != undefined) {
      this._maxLength = options.maxLength;
    }
  }

  _processChunk(chunk, flushFlag, asyncCallback) {
    if (typeof asyncCallback === "function") {
      return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCallback);
    }

    const self = this;

    let availInBefore = chunk && chunk.length;
    let availOutBefore = this._chunkSize - this._offset;
    let leftToInflate = this._maxLength;
    let inOff = 0;

    const buffers = [];
    let nread = 0;

    let error;
    this.on("error", error_ => {
      error = error_;
    });

    function handleChunk(availInAfter, availOutAfter) {
      if (self._hadError) {
        return;
      }

      const have = availOutBefore - availOutAfter;
      assert(have >= 0, "have should not go down");

      if (have > 0) {
        let out = self._buffer.slice(self._offset, self._offset + have);
        self._offset += have;

        if (out.length > leftToInflate) {
          out = out.slice(0, leftToInflate);
        }

        buffers.push(out);
        nread += out.length;
        leftToInflate -= out.length;

        if (leftToInflate === 0) {
          return false;
        }
      }

      if (availOutAfter === 0 || self._offset >= self._chunkSize) {
        availOutBefore = self._chunkSize;
        self._offset = 0;
        self._buffer = Buffer.allocUnsafe(self._chunkSize);
      }

      if (availOutAfter === 0) {
        inOff += availInBefore - availInAfter;
        availInBefore = availInAfter;

        return true;
      }

      return false;
    }

    assert(this._handle, "zlib binding closed");
    let res;
    do {
      res = this._handle.writeSync(
        flushFlag,
        chunk, // in
        inOff, // in_off
        availInBefore, // in_len
        this._buffer, // out
        this._offset, //out_off
        availOutBefore
      ); // out_len
      // Node 8 --> 9 compatibility check
      res = res || this._writeState;
    } while (!this._hadError && handleChunk(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    if (nread >= kMaxLength) {
      _close(this);
      throw new RangeError(
        `Cannot create final Buffer. It would be larger than 0x${kMaxLength.toString(16)} bytes`
      );
    }

    const buf = Buffer.concat(buffers, nread);
    _close(this);

    return buf;
  }
}

function createInflate(options) {
  return new Inflate(options);
}

function _close(engine, callback) {
  if (callback) {
    process.nextTick(callback);
  }

  // Caller may invoke .close after a zlib error (which will null _handle).
  if (!engine._handle) {
    return;
  }

  engine._handle.close();
  engine._handle = null;
}

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer);
  }
  if (!(buffer instanceof Buffer)) {
    throw new TypeError("Not a string or buffer");
  }

  let flushFlag = engine._finishFlushFlag;
  if (flushFlag == undefined) {
    flushFlag = zlib.Z_FINISH;
  }

  return engine._processChunk(buffer, flushFlag);
}

function inflateSync(buffer, options) {
  return zlibBufferSync(new Inflate(options), buffer);
}


export {createInflate, Inflate, inflateSync};

