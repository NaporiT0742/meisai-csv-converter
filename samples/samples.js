(function (global) {
  "use strict";

  var samples = Object.freeze({
    bank: {
      filename: "sample_bank_sjis.csv",
      label: "銀行（Shift_JIS・入出金2列）",
      base64: "grGCzIN0g0CDQ4OLgsyT4Jdlgs2Ct4LXgsSJy4vzgsWCtwqT+pV0LJNFl3Ysj2+L4CyT/IvgLI5jjYIsg4GDggqX35hhOJROMYyONZP6LInLi/OVtovvk1gsMTI4MCwsMTk4NzIwLI6WlrGXcJVpClI4LjEuNiyDZYNYg2eQVY2eLCw1MDAwMCwyNDg3MjAsicuL85P8i+AKl9+YYTiUTjGMjjeT+iyJy4vzjPCSyoNUgVuDcoNYLDg2MCwsMjQ3ODYwLIjak66U7wpSOC4xLjgsicuL85BIk7AsOTUwLCwyNDY5MTAskcWNh4K5CpffmGE4lE4xjI45k/osg2WDWINnjuiQlJe/LDIyMCwsMjQ2NjkwLApSOC4xLjEwLInLi/OOc4/qLDMyNDAsLDI0MzQ1MCyPwZbVlWkKl9+YYTiUTjGMjjExk/osg2WDWINnldSL4CwsNTAwLDI0Mzk1MCyV1IvgClI4LjEuMTIsicuL84jzjfyTWCw0ODAwLCwyMzkxNTAsiPON/AqX35hhOJROMYyOMTOT+iyJy4vzlHqRl5XWLDc4MCwsMjM4MzcwLJStkZcKUjguMS4xNCyDZYNYg2eUhI/jLCwzNjAwMCwyNzQzNzAsicuL85P8i+AKl9+YYTiUTjGMjjE1k/osicuL84tpkoMsNzIwLCwyNzM2NTAskcWNh4K5ClI4LjEuMTYsicuL85T1lWmTWCw4OTAwLCwyNjQ3NTAslPWVaQqX35hhOJROMYyOMTeT+iyDZYNYg2eXmJdwl78sMTIwMCwsMjYzNTUwLApSOC4xLjE4LInLi/OPkZNYLDI2NDAsLDI2MDkxMCyOkZe/CpffmGE4lE4xjI4xOZP6LINlg1iDZ5BVjZ4sLDEyNTAwLDI3MzQxMCyJy4vzk/yL4ApSOC4xLjIwLInLi/ON7IvGjrosNTUwMCwsMjY3OTEwLJeYl3CXvwqX35hhOJROMYyOMjGT+iyJy4vzl1iRl5GLjPssNDMwLCwyNjc0ODAsl1iRlwpSOC4xLjIyLINlg1iDZ5eYkacsLDE4LDI2NzQ5OCwKl9+YYTiUTjGMjjIzk/osicuL846Rjd6TWCw2NzgwLCwyNjA3MTgsjpGN3gpSOC4xLjI0LInLi/OQtJF8g1SBW4Nyg1gsMzMwMCwsMjU3NDE4LJC0kXwK"
    },
    card: {
      filename: "sample_card_utf8.csv",
      label: "カード（UTF-8・金額1列）",
      base64: "77u/44GT44Gu44OV44Kh44Kk44Or44Gu5YaF5a6544Gv44GZ44G544Gm5p6256m644Gn44GZCuWIqeeUqOaXpSzliKnnlKjlhYgs6YeR6aGNCjIwMjYvMS8yLOaetuepuuaWh+WFt+W6lywxMjgwCjIwMjYvMS8zLOaetuepuumFjeS/oeOCteODvOODk+OCuSw5ODAKMjAyNi8xLzQs5p6256m65Lqk6YCa44K144O844OT44K5LDQ2MAoyMDI2LzEvNSzmnrbnqbrpo5/loIIsMTEwMAoyMDI2LzEvNizmnrbnqbros4fmlpnlupcsMjQ1MAoyMDI2LzEvNyzmnrbnqbrphY3pgIHkvr8sNzIwCjIwMjYvMS84LOaetuepuuW4guWgtCwzMTgwCjIwMjYvMS85LOaetuepuuWNsOWIt+W6lyw1NjAwCjIwMjYvMS8xMCzmnrbnqbrllqvojLYsNjUwCjIwMjYvMS8xMSzmnrbnqbrlgpnlk4HlupcsODQwMAoyMDI2LzEvMTIs5p6256m65L2c5qWt5a6kLDMyMDAKMjAyNi8xLzEzLOaetuepuumDtemAgeeqk+WPoyw1MTAKMjAyNi8xLzE0LOaetuepuuizh+adkOW6lyw0MjcwCjIwMjYvMS8xNSzmnrbnqbrmuIXmjoPjgrXjg7zjg5PjgrksMjgwMAoyMDI2LzEvMTYs5p6256m65L+d566h44K144O844OT44K5LDE1MDAKMjAyNi8xLzE3LOaetuepuuS8muitsOWupCw0NDAwCjIwMjYvMS8xOCzmnrbnqbrlhpnnnJ/lupcsMTc2MAoyMDI2LzEvMTks5p6256m65L+u55CG56qT5Y+jLDYzMDAKMjAyNi8xLzIwLOaetuepuuiyqeWjsuaJgCw5MjAKMjAyNi8xLzIxLOaetuepuuS6i+WLmeOCteODvOODk+OCuSwyMTAwCg=="
    },
    netbank: {
      filename: "sample_netbank.csv",
      label: "ネット銀行（全角・△金額）",
      base64: "44GT44Gu44OV44Kh44Kk44Or44Gu5YaF5a6544Gv44GZ44G544Gm5p6256m644Gn44GZCuWPluW8leaXpSzoqbPntLAs6YeR6aGNCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8kizmnrbnqbrmloflhbflupcs4pazNDQwCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8kyzjg4bjgrnjg4jlhaXph5Es77yL77yR77yM77yS77yV77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8lCzmnrbnqbrkuqTpgJrjgrXjg7zjg5Pjgrks77yN77yY77yW77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8lSzmnrbnqbrpo5/loIIs4pay77yZ77yV77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8lizjg4bjgrnjg4jmiYvmlbDmlpks77yS77yS77yQ77yNCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8lyzmnrbnqbrluILloLQs77yI77yT77yM77yS77yU77yQ77yJCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8mCzjg4bjgrnjg4jov5Tph5Es77yL77yV77yQ77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8mSzmnrbnqbrljbDliLflupcs4paz77yU77yM77yY77yQ77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8ke+8kCzmnrbnqbrphY3pgIHkvr8sLTc4MArvvJLvvJDvvJLvvJbvvI/vvJHvvI/vvJHvvJEs44OG44K544OI5aOy5LiKLO+8i++8k++8lu+8jO+8kO+8kO+8kArvvJLvvJDvvJLvvJbvvI/vvJHvvI/vvJHvvJIs5p6256m65Zar6Iy2LOKWs++8l++8ku+8kArvvJLvvJDvvJLvvJbvvI/vvJHvvI/vvJHvvJMs5p6256m65YKZ5ZOB5bqXLC3vvJjvvJnvvJDvvJAK77yS77yQ77yS77yW77yP77yR77yP77yR77yULOODhuOCueODiOWIqeeUqOaWmSzvvI3vvJHvvIzvvJLvvJDvvJAK77yS77yQ77yS77yW77yP77yR77yP77yR77yVLOaetuepuuabuOW6lyzilrPvvJLvvJbvvJTvvJAK77yS77yQ77yS77yW77yP77yR77yP77yR77yWLOODhuOCueODiOaMr+i+vCzvvIvvvJHvvJLvvIzvvJXvvJDvvJAK77yS77yQ77yS77yW77yP77yR77yP77yR77yXLOaetuepuuS9nOalreWupCzilrLvvJXvvIzvvJXvvJDvvJAK77yS77yQ77yS77yW77yP77yR77yP77yR77yYLOaetuepuumDtemAgeeqk+WPoywtNDMwCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8ke+8mSzjg4bjgrnjg4jliKnmga8s77yL77yR77yYCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8ku+8kCzmnrbnqbros4fmnZDlupcs4paz77yW77yM77yX77yY77yQCu+8ku+8kO+8ku+8lu+8j++8ke+8j++8ku+8kSzmnrbnqbrmuIXmjoPjgrXjg7zjg5Pjgrks77yN77yT77yT77yQ77yQCg=="
    }
  });

  function toBytes(key) {
    var sample = samples[key];
    if (!sample) { throw new Error("不明なサンプルです"); }
    var binary = atob(sample.base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
    return bytes;
  }

  global.MeisaiSamples = Object.freeze({ items: samples, toBytes: toBytes });
}(window));
