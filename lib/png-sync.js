import parse from "./parser-sync.js";
import pack from "./packer-sync.js";

export function read(buffer, options) {
  return parse(buffer, options || {});
}

export function write(png, options) {
  return pack(png, options);
}
