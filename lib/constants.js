export default {
  COLORTYPE_ALPHA: 4, // e.g. grayscale and alpha

  COLORTYPE_COLOR: 2,
  COLORTYPE_COLOR_ALPHA: 6,
  // color-type bits
  COLORTYPE_GRAYSCALE: 0,
  COLORTYPE_PALETTE: 1,
  // color-type combinations
  COLORTYPE_PALETTE_COLOR: 3,
  COLORTYPE_TO_BPP_MAP: {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4,
  },

  GAMMA_DIVISION: 100_000,
  PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  TYPE_gAMA: 0x67_41_4d_41,  
  TYPE_IDAT: 0x49_44_41_54,

  TYPE_IEND: 0x49_45_4e_44,
  TYPE_IHDR: 0x49_48_44_52,

  TYPE_PLTE: 0x50_4c_54_45,

  TYPE_tRNS: 0x74_52_4e_53,  
};
