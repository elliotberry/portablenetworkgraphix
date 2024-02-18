#!/usr/bin/env node

import fs from "fs";
import {PNG} from "../lib/png.js";
let srcFname = process.argv[2];
let dstFname = process.argv[3] || "out.png";

// Read a PNG file
let data = fs.readFileSync(srcFname);
// Parse it
let png = PNG.sync.read(data, {
  filterType: -1,
});
// Pack it back into a PNG data
let buff = PNG.sync.write(png);
// Write a PNG file
fs.writeFileSync(dstFname, buff);
