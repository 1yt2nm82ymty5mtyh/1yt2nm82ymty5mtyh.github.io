'use strict';
(function(global, factory) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = factory();
  } else {
    if (typeof define === "function" && define.amd) {
      define(factory);
    } else {
      global.Rythm = factory();
    }
  }
})(this, function() {
  /**
   * @param {!AudioNode} instance
   * @param {!Function} Constructor
   * @return {undefined}
   */
  var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  var createClass = function() {
    /**
     * @param {!Function} target
     * @param {!NodeList} props
     * @return {undefined}
     */
    function defineProperties(target, props) {
      /** @type {number} */
      var i = 0;
      for (; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        /** @type {boolean} */
        descriptor.configurable = true;
        if ("value" in descriptor) {
          /** @type {boolean} */
          descriptor.writable = true;
        }
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps) {
        defineProperties(Constructor.prototype, protoProps);
      }
      if (staticProps) {
        defineProperties(Constructor, staticProps);
      }
      return Constructor;
    };
  }();
  /**
   * @return {undefined}
   */
  var Analyser = function Analyser() {
    var _this = this;
    classCallCheck(this, Analyser);
    /**
     * @param {!Object} analyser
     * @return {undefined}
     */
    this.initialise = function(analyser) {
      /** @type {!Object} */
      _this.analyser = analyser;
      /** @type {number} */
      _this.analyser.fftSize = 2048;
    };
    /**
     * @return {undefined}
     */
    this.reset = function() {
      /** @type {!Array} */
      _this.hzHistory = [];
      /** @type {!Uint8Array} */
      _this.frequences = new Uint8Array(_this.analyser.frequencyBinCount);
    };
    /**
     * @return {undefined}
     */
    this.analyse = function() {
      _this.analyser.getByteFrequencyData(_this.frequences);
      /** @type {number} */
      var i = 0;
      for (; i < _this.frequences.length; i++) {
        if (!_this.hzHistory[i]) {
          /** @type {!Array} */
          _this.hzHistory[i] = [];
        }
        if (_this.hzHistory[i].length > _this.maxValueHistory) {
          _this.hzHistory[i].shift();
        }
        _this.hzHistory[i].push(_this.frequences[i]);
      }
    };
    /**
     * @param {number} startingValue
     * @param {number} nbValue
     * @return {?}
     */
    this.getRangeAverageRatio = function(startingValue, nbValue) {
      /** @type {number} */
      var total = 0;
      /** @type {number} */
      var i = startingValue;
      for (; i < nbValue + startingValue; i++) {
        total = total + _this.getFrequenceRatio(i);
      }
      return total / nbValue;
    };
    /**
     * @param {?} index
     * @return {?}
     */
    this.getFrequenceRatio = function(index) {
      /** @type {number} */
      var min = 255;
      /** @type {number} */
      var max = 0;
      _this.hzHistory[index].forEach(function(yValue) {
        if (yValue < min) {
          /** @type {number} */
          min = yValue;
        }
        if (yValue > max) {
          /** @type {number} */
          max = yValue;
        }
      });
      /** @type {number} */
      var count = max - min;
      /** @type {number} */
      var total = _this.frequences[index] - min;
      /** @type {number} */
      var percentage = count === 0 ? 0 : total / count;
      return _this.startingScale + _this.pulseRatio * percentage;
    };
    /** @type {number} */
    this.startingScale = 0;
    /** @type {number} */
    this.pulseRatio = 1;
    /** @type {number} */
    this.maxValueHistory = 100;
    /** @type {!Array} */
    this.hzHistory = [];
  };
  var Analyser$1 = new Analyser;
  /**
   * @param {!AudioContext} xSpawnPos
   * @return {undefined}
   */
  var Player = function Player(xSpawnPos) {
    var _this = this;
    classCallCheck(this, Player);
    /**
     * @param {!Element} audioElement
     * @return {?}
     */
    this.createSourceFromAudioElement = function(audioElement) {
      audioElement.setAttribute("rythm-connected", _this.connectedSources.length);
      var source = _this.audioCtx.createMediaElementSource(audioElement);
      _this.connectedSources.push(source);
      return source;
    };
    /**
     * @param {!Object} audioElement
     * @return {undefined}
     */
    this.connectExternalAudioElement = function(audioElement) {
      /** @type {!Object} */
      _this.audio = audioElement;
      _this.currentInputType = _this.inputTypeList["EXTERNAL"];
      var connectedIndex = audioElement.getAttribute("rythm-connected");
      if (!connectedIndex) {
        _this.source = _this.createSourceFromAudioElement(_this.audio);
      } else {
        _this.source = _this.connectedSources[connectedIndex];
      }
      _this.connectSource(_this.source);
    };
    /**
     * @param {!Object} source
     * @return {undefined}
     */
    this.connectSource = function(source) {
      source.connect(_this.gain);
      _this.gain.connect(Analyser$1.analyser);
      if (_this.currentInputType !== _this.inputTypeList["STREAM"]) {
        Analyser$1.analyser.connect(_this.audioCtx.destination);
        _this.audio.addEventListener("ended", _this.stop);
      } else {
        Analyser$1.analyser.disconnect();
      }
    };
    /**
     * @param {?} trackUrl
     * @return {undefined}
     */
    this.setMusic = function(trackUrl) {
      /** @type {!Audio} */
      _this.audio = new Audio(trackUrl);
      _this.currentInputType = _this.inputTypeList["TRACK"];
      _this.source = _this.createSourceFromAudioElement(_this.audio);
      _this.connectSource(_this.source);
    };
    /**
     * @param {!Object} value
     * @return {undefined}
     */
    this.setGain = function(value) {
      /** @type {!Object} */
      _this.gain.gain.value = value;
    };
    /**
     * @return {?}
     */
    this.plugMicrophone = function() {
      return _this.getMicrophoneStream().then(function(stream) {
        /** @type {string} */
        _this.audio = stream;
        _this.currentInputType = _this.inputTypeList["STREAM"];
        _this.source = _this.audioCtx.createMediaStreamSource(stream);
        _this.connectSource(_this.source);
      });
    };
    /**
     * @return {?}
     */
    this.getMicrophoneStream = function() {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      return new Promise(function(saveNotifs, obtainGETData) {
        navigator.getUserMedia({
          audio : true
        }, function(notifications) {
          return saveNotifs(notifications);
        }, function(val) {
          return obtainGETData(val);
        });
      });
    };
    /**
     * @return {?}
     */
    this.start = function() {
      if (_this.currentInputType === _this.inputTypeList["TRACK"]) {
        if (_this.audioCtx.state === "suspended") {
          _this.audioCtx.resume().then(function() {
            return _this.audio.play();
          });
        } else {
          try {
            _this.audio.play();
          } catch (err) {
            return false;
          }
        }
      }
    };
    /**
     * @return {undefined}
     */
    this.stop = function() {
      if (_this.currentInputType === _this.inputTypeList["TRACK"]) {
        _this.audio.pause();
      } else {
        if (_this.currentInputType === _this.inputTypeList["STREAM"]) {
          /** @type {boolean} */
          _this.audio.getAudioTracks()[0].enabled = false;
        }
      }
    };
    this.browserAudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = xSpawnPos || new this.browserAudioCtx;
    /** @type {!Array} */
    this.connectedSources = [];
    Analyser$1.initialise(this.audioCtx.createAnalyser());
    this.gain = this.audioCtx.createGain();
    this.source = {};
    this.audio = {};
    /** @type {!Array} */
    this.hzHistory = [];
    this.inputTypeList = {
      TRACK : 0,
      STREAM : 1,
      EXTERNAL : 2
    };
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var draw = function(elem, value) {
    var inlets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var hue_green = !isNaN(inlets.max) ? inlets.max : 1.25;
    var hue_red = !isNaN(inlets.min) ? inlets.min : 0.75;
    /** @type {number} */
    var w_h_value_scaled = (hue_green - hue_red) * value;
    /** @type {string} */
    elem.style.transform = "scale(" + (hue_red + w_h_value_scaled) + ") translateZ(0)";
    if (elem.className.indexOf("logo-bass") != -1) {
      /** @type {number} */
      window.pJSDom[0].pJS.particles.move.speed = 0.2 + w_h_value_scaled * 3;
    }
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var artistTrack = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var shake = function(elem, value) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(opts.max) ? opts.max : 15;
    var min = !isNaN(opts.min) ? opts.min : -15;
    if (opts.direction === "left") {
      /** @type {number} */
      max = -max;
      /** @type {number} */
      min = -min;
    }
    /** @type {number} */
    var vanish = (max - min) * value;
    /** @type {string} */
    elem.style.transform = "translate3d(" + (min + vanish) + "px, 0, 0)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var GET_AUTH_URL_TIMEOUT = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} pos
   * @return {undefined}
   */
  var pulse = function(elem, pos) {
    var inlets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(inlets.max) ? inlets.max : 30;
    var min = !isNaN(inlets.min) ? inlets.min : 0;
    /** @type {number} */
    var k = (max - min) * pos;
    /** @type {string} */
    elem.style.transform = "translate3d(0, " + -k + "px, 0)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var numKeysDeleted = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var twist = function(elem, value) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(opts.max) ? opts.max : 20;
    var min = !isNaN(opts.min) ? opts.min : -20;
    if (opts.direction === "left") {
      /** @type {number} */
      max = -max;
      /** @type {number} */
      min = -min;
    }
    /** @type {number} */
    var vanish = (max - min) * value;
    /** @type {string} */
    elem.style.transform = "rotate(" + (min + vanish) + "deg) translateZ(0)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var postDateGmt = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var vanish = function(elem, value) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(options.max) ? options.max : 1;
    var min = !isNaN(options.max) ? options.max : 0;
    /** @type {number} */
    var vanish = (max - min) * value;
    if (options.reverse) {
      /** @type {number} */
      elem.style.opacity = max - vanish;
    } else {
      elem.style.opacity = min + vanish;
    }
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var _maskLayer = function reset(elem) {
    /** @type {string} */
    elem.style.opacity = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var setPosition = function(elem, value) {
    var relatedAssociations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var from = relatedAssociations.from || [0, 0, 0];
    var to = relatedAssociations.to || [255, 255, 255];
    /** @type {number} */
    var scaleR = (to[0] - from[0]) * value;
    /** @type {number} */
    var scaleG = (to[1] - from[1]) * value;
    /** @type {number} */
    var scaleB = (to[2] - from[2]) * value;
    /** @type {string} */
    elem.style.borderColor = "rgb(" + Math.floor(to[0] - scaleR) + ", " + Math.floor(to[1] - scaleG) + ", " + Math.floor(to[2] - scaleB) + ")";
  };
  /**
   * @param {!Element} transDOM
   * @return {undefined}
   */
  var _maskLayerSimulate = function setShaderSuccessStatus(transDOM) {
    /** @type {string} */
    transDOM.style.borderColor = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var color = function(elem, value) {
    var relatedAssociations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var from = relatedAssociations.from || [0, 0, 0];
    var to = relatedAssociations.to || [255, 255, 255];
    /** @type {number} */
    var scaleR = (to[0] - from[0]) * value;
    /** @type {number} */
    var scaleG = (to[1] - from[1]) * value;
    /** @type {number} */
    var scaleB = (to[2] - from[2]) * value;
    /** @type {string} */
    elem.style.backgroundColor = "rgb(" + Math.floor(to[0] - scaleR) + ", " + Math.floor(to[1] - scaleG) + ", " + Math.floor(to[2] - scaleB) + ")";
  };
  /**
   * @param {!Element} color
   * @return {undefined}
   */
  var topShowDialog = function drawneutral(color) {
    /** @type {string} */
    color.style.backgroundColor = "";
  };
  /**
   * @param {!Element} container
   * @param {number} offsetX
   * @return {undefined}
   */
  var initialize = function(container, offsetX) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var numPerRow = !isNaN(options.max) ? options.max : 25;
    var remainingCircle = !isNaN(options.min) ? options.min : 0;
    /** @type {number} */
    var pad = (numPerRow - remainingCircle) * offsetX;
    if (options.reverse) {
      /** @type {number} */
      pad = numPerRow - pad;
    } else {
      pad = remainingCircle + pad;
    }
    /** @type {string} */
    container.style.borderRadius = pad + "px";
  };
  /**
   * @param {!Element} layer
   * @return {undefined}
   */
  var button2Component = function showDialog(layer) {
    /** @type {string} */
    layer.style.borderRadius = "";
  };
  /**
   * @param {!Element} label
   * @param {number} dir
   * @return {undefined}
   */
  var onTouchOrTapEvent = function(label, dir) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(options.max) ? options.max : 8;
    var base = !isNaN(options.min) ? options.min : 0;
    /** @type {number} */
    var pos = (max - base) * dir;
    if (options.reverse) {
      /** @type {number} */
      pos = max - pos;
    } else {
      pos = base + pos;
    }
    /** @type {string} */
    label.style.filter = "blur(" + pos + "px)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var alwaysDownload = function gradientMask_alphaFilter(elem) {
    /** @type {string} */
    elem.style.filter = "";
  };
  var result = {
    up : -1,
    down : 1,
    left : 1,
    right : -1
  };
  /**
   * @param {!Element} config
   * @param {number} frame
   * @return {undefined}
   */
  var set = function(config, frame) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var radius = !isNaN(options.radius) ? options.radius : 20;
    var dir = Object.keys(result).includes(options.direction) ? options.direction : "right";
    var is = Object.keys(result).includes(options.curve) ? options.curve : "down";
    /** @type {!Array} */
    var tiledImageBRs = [result[dir], result[is]];
    var tiledImageBR = tiledImageBRs[0];
    var perColumn = tiledImageBRs[1];
    /** @type {string} */
    config.style.transform = "translate3d(" + tiledImageBR * radius * Math.cos(frame * Math.PI) + "px, " + perColumn * radius * Math.sin(frame * Math.PI) + "px, 0)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var parentViewCtrl = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} div
   * @param {number} value
   * @return {undefined}
   */
  var init = function(div, value) {
    var relatedAssociations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var from = relatedAssociations.from || [0, 0, 0];
    var to = relatedAssociations.to || [255, 255, 255];
    /** @type {number} */
    var scaleR = (to[0] - from[0]) * value;
    /** @type {number} */
    var scaleG = (to[1] - from[1]) * value;
    /** @type {number} */
    var pos = (to[2] - from[2]) * value;
    /** @type {string} */
    div.style.boxShadow = "0 0 1em rgb(" + Math.floor(to[0] - scaleR) + ", " + Math.floor(to[1] - scaleG) + ", " + Math.floor(to[2] - pos) + ")";
  };
  /**
   * @param {!Element} node
   * @return {undefined}
   */
  var swapFrontSource = function highlightNode(node) {
    /** @type {string} */
    node.style.boxShadow = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} value
   * @return {undefined}
   */
  var animate = function(elem, value) {
    var relatedAssociations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var from = relatedAssociations.from || [0, 0, 0];
    var to = relatedAssociations.to || [255, 255, 255];
    /** @type {number} */
    var scaleR = (to[0] - from[0]) * value;
    /** @type {number} */
    var scaleG = (to[1] - from[1]) * value;
    /** @type {number} */
    var scaleB = (to[2] - from[2]) * value;
    /** @type {string} */
    elem.style.textShadow = "0 0 40px rgb(" + Math.floor(to[0] - scaleR) + ", " + Math.floor(to[1] - scaleG) + ", " + Math.floor(to[2] - scaleB) + ")";
    /** @type {number} */
    var r = Math.floor(to[0] - scaleR);
    /** @type {number} */
    var grey = Math.floor(to[1] - scaleG);
    /** @type {number} */
    var b = Math.floor(to[2] - scaleB);
    if (elem.className.indexOf("logo-neon") != -1) {
      window.pJSDom[0].pJS.particles.color.rgb = {
        r : r,
        g : grey,
        b : b
      };
    }
  };
  /**
   * @param {!Element} layer
   * @return {undefined}
   */
  var clojIsReversed = function animate(layer) {
    /** @type {string} */
    layer.style.textShadow = "";
  };
  /**
   * @param {!Element} canvas
   * @param {number} step
   * @return {undefined}
   */
  var render = function(canvas, step) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var size = !isNaN(options.max) ? options.max : 25;
    var padding = !isNaN(options.min) ? options.min : 0;
    /** @type {number} */
    var x = (size - padding) * step;
    if (options.reverse) {
      /** @type {number} */
      x = size - x;
    } else {
      x = padding + x;
    }
    /** @type {string} */
    canvas.style.letterSpacing = x + "px";
  };
  /**
   * @param {!Element} canvas
   * @return {undefined}
   */
  var reconnectingCallback = function render(canvas) {
    /** @type {string} */
    canvas.style.letterSpacing = "";
  };
  /**
   * @param {!Element} tag
   * @param {number} value
   * @return {undefined}
   */
  var getSizeInPixels = function(tag, value) {
    var inlets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var jx = !isNaN(inlets.max) ? inlets.max : 0.8;
    var px = !isNaN(inlets.min) ? inlets.min : 1.2;
    var s = (jx - px) * value + px;
    /** @type {string} */
    tag.style.fontSize = s + "em";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var universalCallback = function reset(elem) {
    /** @type {string} */
    elem.style.fontSize = "1em";
  };
  /**
   * @param {!Element} options
   * @param {number} width
   * @return {undefined}
   */
  var drawGrid = function(options, width) {
    var inlets = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var halfHeight = !isNaN(inlets.max) ? inlets.max : 5;
    var y = !isNaN(inlets.min) ? inlets.min : 0;
    var strokeWidth = (halfHeight - y) * width + y;
    /** @type {string} */
    options.style.borderWidth = strokeWidth + "px";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var hiCallback = function updateElement(elem) {
    /** @type {string} */
    elem.style.borderWidth = "";
  };
  /**
   * @param {!Element} elem
   * @param {number} dir
   * @return {undefined}
   */
  var jump = function(elem, dir) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var max = !isNaN(options.max) ? options.max : 25;
    var min = !isNaN(options.min) ? options.min : 20;
    /** @type {number} */
    var pos = (max - min) * dir;
    if (options.reverse) {
      /** @type {number} */
      pos = max - pos;
    }
    /** @type {string} */
    elem.style.transform = "matrix(1, " + Math.sin(pos) + ", 0, 1 , 0 ,0)";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var atCloseCallback = function reset(elem) {
    /** @type {string} */
    elem.style.transform = "";
  };
  /**
   * @param {!Element} row
   * @param {number} value
   * @return {undefined}
   */
  var triggerAnimationStart = function(row, value) {
    var relatedAssociations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var from = relatedAssociations.from || [0, 0, 0];
    var to = relatedAssociations.to || [255, 255, 255];
    /** @type {number} */
    var scaleR = (to[0] - from[0]) * value;
    /** @type {number} */
    var scaleG = (to[1] - from[1]) * value;
    /** @type {number} */
    var pos = (to[2] - from[2]) * value;
    /** @type {string} */
    row.style.color = "rgb(" + Math.floor(to[0] - scaleR) + ", " + Math.floor(to[1] - scaleG) + ", " + Math.floor(to[2] - pos) + ")";
  };
  /**
   * @param {!Element} elem
   * @return {undefined}
   */
  var tagParseOptions = function reset(elem) {
    /** @type {string} */
    elem.style.color = "";
  };
  var Dancer = function() {
    /**
     * @return {undefined}
     */
    function Dancer() {
      classCallCheck(this, Dancer);
      this.resets = {};
      this.dances = {};
      this.registerDance("size", draw, artistTrack);
      this.registerDance("pulse", draw, artistTrack);
      this.registerDance("shake", shake, GET_AUTH_URL_TIMEOUT);
      this.registerDance("jump", pulse, numKeysDeleted);
      this.registerDance("twist", twist, postDateGmt);
      this.registerDance("vanish", vanish, _maskLayer);
      this.registerDance("color", color, topShowDialog);
      this.registerDance("borderColor", setPosition, _maskLayerSimulate);
      this.registerDance("radius", initialize, button2Component);
      this.registerDance("blur", onTouchOrTapEvent, alwaysDownload);
      this.registerDance("swing", set, parentViewCtrl);
      this.registerDance("neon", init, swapFrontSource);
      this.registerDance("textNeon", animate, clojIsReversed);
      this.registerDance("kern", render, reconnectingCallback);
      this.registerDance("borderWidth", drawGrid, hiCallback);
      this.registerDance("fontSize", getSizeInPixels, universalCallback);
      this.registerDance("tilt", jump, atCloseCallback);
      this.registerDance("fontColor", triggerAnimationStart, tagParseOptions);
    }
    createClass(Dancer, [{
      key : "registerDance",
      value : function registerDance(type, value) {
        var genericRule = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function() {
        };
        this.dances[type] = value;
        this.resets[type] = genericRule;
      }
    }, {
      key : "dance",
      value : function dance(type, child, data, options) {
        var dance = type;
        if (typeof type === "string") {
          dance = this.dances[type] || this.dances["pulse"];
        } else {
          dance = type.dance;
        }
        /** @type {!NodeList<Element>} */
        var elements = document.getElementsByClassName(child);
        Array.from(elements).forEach(function(elem) {
          return dance(elem, data, options);
        });
      }
    }, {
      key : "reset",
      value : function initialize(obj, className) {
        /** @type {!Object} */
        var fn = obj;
        if (typeof obj === "string") {
          fn = this.resets[obj] || this.resets["pulse"];
        } else {
          fn = obj.reset;
        }
        /** @type {!NodeList<Element>} */
        var style = document.getElementsByClassName(className);
        Array.from(style).forEach(function(BeautifulProperties) {
          return fn(BeautifulProperties);
        });
      }
    }]);
    return Dancer;
  }();
  var dancer = new Dancer;
  /**
   * @param {?} opus_sampling_rate
   * @return {undefined}
   */
  var Rythm$1 = function Rythm(opus_sampling_rate) {
    var _this = this;
    classCallCheck(this, Rythm);
    /**
     * @param {!Object} audioElement
     * @return {?}
     */
    this.connectExternalAudioElement = function(audioElement) {
      return _this.player.connectExternalAudioElement(audioElement);
    };
    /**
     * @param {?} url
     * @return {?}
     */
    this.setMusic = function(url) {
      return _this.player.setMusic(url);
    };
    /**
     * @return {?}
     */
    this.plugMicrophone = function() {
      return _this.player.plugMicrophone();
    };
    /**
     * @param {!Object} value
     * @return {?}
     */
    this.setGain = function(value) {
      return _this.player.setGain(value);
    };
    /**
     * @param {!Object} source
     * @return {?}
     */
    this.connectSource = function(source) {
      return _this.player.connectSource(source);
    };
    /**
     * @param {string} elementClass
     * @param {string} type
     * @param {string} startValue
     * @param {number} nbValue
     * @param {!Object} options
     * @return {undefined}
     */
    this.addRythm = function(elementClass, type, startValue, nbValue, options) {
      _this.rythms.push({
        elementClass : elementClass,
        type : type,
        startValue : startValue,
        nbValue : nbValue,
        options : options
      });
    };
    /**
     * @return {undefined}
     */
    this.start = function() {
      /** @type {boolean} */
      _this.stopped = false;
      console.log(_this.player.start());
      _this.analyser.reset();
      _this.renderRythm();
    };
    /**
     * @return {undefined}
     */
    this.renderRythm = function() {
      if (_this.stopped) {
        return;
      }
      _this.analyser.analyse();
      _this.rythms.forEach(function(mappingItem) {
        var type = mappingItem.type;
        var elementClass = mappingItem.elementClass;
        var nbValue = mappingItem.nbValue;
        var startValue = mappingItem.startValue;
        var options = mappingItem.options;
        _this.dancer.dance(type, elementClass, _this.analyser.getRangeAverageRatio(startValue, nbValue), options);
      });
      /** @type {number} */
      _this.animationFrameRequest = requestAnimationFrame(_this.renderRythm);
    };
    /**
     * @return {undefined}
     */
    this.resetRythm = function() {
      _this.rythms.forEach(function(mappingItem) {
        var type = mappingItem.type;
        var elementClass = mappingItem.elementClass;
        var nbValue = mappingItem.nbValue;
        var startValue = mappingItem.startValue;
        var options = mappingItem.options;
        _this.dancer.reset(type, elementClass);
      });
    };
    /**
     * @param {?} allowFailure
     * @return {undefined}
     */
    this.stop = function(allowFailure) {
      /** @type {boolean} */
      _this.stopped = true;
      _this.player.stop();
      if (_this.animationFrameRequest) {
        cancelAnimationFrame(_this.animationFrameRequest);
      }
      if (!allowFailure) {
        _this.resetRythm();
      }
    };
    this.player = new Player(opus_sampling_rate);
    this.analyser = Analyser$1;
    this.maxValueHistory = Analyser$1.maxValueHistory;
    this.dancer = dancer;
    /** @type {!Array} */
    this.rythms = [];
    this.addRythm("rythm-bass", "pulse", 0, 10);
    this.addRythm("rythm-medium", "pulse", 150, 40);
    this.addRythm("rythm-high", "pulse", 400, 200);
    this.animationFrameRequest = void 0;
  };
  return Rythm$1;
});
