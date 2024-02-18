#!/usr/bin/env node

import fs from "fs";
import {PNG} from "../lib/png.js";
import test from "tape";
import bufferEqual from "buffer-equal";

test("outputs background, created from scratch", t => {
  t.timeoutAfter(1000 * 60 * 5);

  let png = new PNG({
    width: 10,
    height: 10,
    filterType: -1,
  });

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      let idx = (png.width * y + x) << 2;

      let col = (x < png.width >> 1) ^ (y < png.height >> 1) ? 0xe5 : 0xff;

      png.data[idx] = col;
      png.data[idx + 1] = col;
      png.data[idx + 2] = col;
      png.data[idx + 3] = 0xff;
    }
  }

  png
    .pack()
    .pipe(fs.createWriteStream(`${__dirname}/bg.png`))
    .on("finish", () => {
      let out = fs.readFileSync(`${__dirname}/bg.png`);
      let ref = fs.readFileSync(`${__dirname}/bg-ref.png`);

      let isBufferEqual = bufferEqual(out, ref);
      t.ok(isBufferEqual, "compares with working file ok");

      if (!isBufferEqual) {
        console.log(out.length, ref.length);
      }

      t.end();
    });
});
