(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.FHIRAuth = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Flow = function () {
  function Flow() {
    _classCallCheck(this, Flow);
  }

  _createClass(Flow, [{
    key: 'token',
    value: function token(hash) {
      if (!hash) hash = window.location.hash;
      return Promise(function (resolve, reject) {
        var oauthResult = hash.match(/#(.*)/);
        oauthResult = oauthResult ? oauthResult[1] : '';
        oauthResult = oauthResult.split(/&/);
        var authorization = {};
        for (var i = 0; i < oauthResult.length; i++) {
          var kv = oauthResult[i].split(/=/);
          if (kv[0].length > 0 && kv[1]) {
            authorization[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
          }
        }
        resolve(authorization);
      });
    }
  }, {
    key: 'code',
    value: function code(params) {
      if (!params) {
        params = {
          code: _util2.default.getParam('code'),
          state: _util2.default.getParam('state')
        };
      }
      var state = JSON.parse(sessionStorage[params.state]);

      // Using window.history.pushState to append state to the query param.
      // This will allow session data to be retrieved via the state param.
      if (window.history.pushState) {
        var queryParam = window.location.search;
        if (window.location.search.indexOf('state') === -1) {
          // Append state query param to URI for later.
          // state query param will be used to look up
          // token response upon page reload.

          queryParam += window.location.search ? '&' : '?';
          queryParam += 'state=' + params.state;

          var url = window.location.protocol + '//' + window.location.host + window.location.pathname + queryParam;

          window.history.pushState({}, '', url);
        }
      }

      var data = {
        code: params.code,
        grant_type: 'authorization_code',
        redirect_uri: state.client.redirect_uri
      };

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', state.provider.oauth2.token_uri);
        if (state.client.secret) xhr.setRequestHeader('Authorization', 'Basic ' + btoa(state.client.client_id + ':' + state.client.secret));else data['client_id'] = state.client.client_id;
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) resolve(_util2.default.extend(JSON.parse(xhr.response), params));else {
            reject(new Error({
              status: this.status,
              statusText: xhr.statusText
            }));
          }
        };
        xhr.onerror = function () {
          reject(new Error({
            status: this.status,
            statusText: xhr.statusText
          }));
        };
        xhr.send(JSON.stringify(data));
      });
    }
  }]);

  return Flow;
}();

exports.default = new Flow();

},{"./util":6}],2:[function(require,module,exports){
(function (process){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _flow = require('./flow');

var _flow2 = _interopRequireDefault(_flow);

var _smart = require('./smart');

var _smart2 = _interopRequireDefault(_smart);

var _jwt = require('./jwt');

var _jwt2 = _interopRequireDefault(_jwt);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  ready: ready
};

function getPreviousToken() {
  var state = _util2.default.getParam('state');
  return JSON.parse(sessionStorage[state]).tokenResponse;
}

function completePageReload() {
  return new Promise(function (resolve, reject) {
    process.nextTick(function () {
      resolve(getPreviousToken());
    });
  });
}

function readyArgs() {
  var input = null;
  var callback = function callback() {};
  var errback = function errback() {};

  if (arguments.length === 0) {
    throw new Error('Cannot call ready without arguments');
  } else if (arguments.length === 1) {
    callback = arguments[0];
  } else if (arguments.length === 2) {
    if (typeof arguments[0] === 'function') {
      callback = arguments[0];
      errback = arguments[1];
    } else if (_typeof(arguments[0]) === 'object') {
      input = arguments[0];
      callback = arguments[1];
    } else {
      throw new Error('ready called with invalid arguments');
    }
  } else if (arguments.length === 3) {
    input = arguments[0];
    callback = arguments[1];
    errback = arguments[2];
  } else {
    throw new Error('ready called with invalid arguments');
  }

  return {
    input: input,
    callback: callback,
    errback: errback
  };
}

/**
* Check the tokenResponse object to see if it is valid or not.
* This is to handle the case of a refresh/reload of the page
* after the token was already obtain.
* @return boolean
*/
function validTokenResponse() {
  var args = arguments;
  var state = _util2.default.getParam('state') || args.input && args.input.state;
  return state && sessionStorage[state] && JSON.parse(sessionStorage[state]).tokenResponse;
}

function ready(input, callback, errback) {
  var args = readyArgs.apply(this, arguments);

  // decide between token flow (implicit grant) and code flow (authorization code grant)
  var isCode = _util2.default.getParam('code') || args.input && args.input.code;

  var accessTokenResolver = null;

  if (validTokenResponse()) {
    // we're reloading after successful completion
    accessTokenResolver = completePageReload();
  } else if (isCode) {
    // code flow
    accessTokenResolver = _flow2.default.code(args.input);
  } else {
    // token flow
    accessTokenResolver = _flow2.default.token(args.input);
  }
  accessTokenResolver.then(function (tokenResponse) {
    if (!tokenResponse || !tokenResponse.state) {
      return args.errback('No state parameter found in authorization response.');
    }

    // Save the tokenResponse object and the state into sessionStorage keyed by state
    sessionStorage[tokenResponse.state] = JSON.stringify(_util2.default.extend(JSON.parse(sessionStorage[tokenResponse.state]), { tokenResponse: tokenResponse }));

    var state = JSON.parse(sessionStorage[tokenResponse.state]);
    if (state.fake_token_response) {
      tokenResponse = state.fake_token_response;
    }

    var fhirClientParams = {
      serviceUrl: state.provider.url,
      patientId: tokenResponse.patient
    };

    if (tokenResponse.id_token) {
      var id_token = tokenResponse.id_token; // eslint-disable-line
      var payload = _jwt2.default.decode(id_token);
      fhirClientParams['userId'] = payload['profile'];
    }

    if (tokenResponse.access_token) {
      fhirClientParams.auth = {
        type: 'bearer',
        token: tokenResponse.access_token
      };
    } else if (!state.fake_token_response) {
      return args.errback('Failed to obtain access token.');
    }

    var smart = new _smart2.default(fhirClientParams);
    smart.state = JSON.parse(JSON.stringify(state));
    smart.tokenResponse = JSON.parse(JSON.stringify(tokenResponse));
    args.callback(smart);
  }, function () {
    args.errback('Failed to obtain access token.');
  });
}

}).call(this,require('_process'))
},{"./flow":1,"./jwt":3,"./smart":5,"./util":6,"_process":4}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JWT = function () {
  function JWT() {
    _classCallCheck(this, JWT);
  }

  _createClass(JWT, [{
    key: 'decode',
    value: function decode(token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(window.atob(base64));
    }
  }]);

  return JWT;
}();

exports.default = new JWT();

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Smart = function Smart(p) {
  _classCallCheck(this, Smart);

  this.userId = p.userId;
  if (p.patientId) {
    this.patient = {};
    this.patient.id = p.patientId;
  }
  this.user = {
    'read': function read() {
      var userId = this.userId;
      var resource = userId.split('/')[0];
      var uid = userId.split('/')[1];
      return this.get({
        resource: resource,
        id: uid
      });
    }
  };

  var server = this.server = {
    serviceUrl: p.serviceUrl,
    auth: p.auth || {
      type: 'none'
    }
  };
  server.auth = server.auth || {
    type: 'none'
  };
  if (!this.server.serviceUrl || !this.server.serviceUrl.match(/https?:\/\/.+[^/]$/)) {
    throw new Error('Must supply a `server` property whose `serviceUrl` begins with http(s) ' + 'and does NOT include a trailing slash. E.g. `https://fhir.aws.af.cm/fhir`');
  }
};

exports.default = Smart;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = function () {
  function Util() {
    _classCallCheck(this, Util);
  }

  _createClass(Util, [{
    key: 'getParam',
    value: function getParam(p) {
      var query = location.search.substr(1);
      var data = query.split('&');
      var result = [];

      for (var i = 0; i < data.length; i++) {
        var item = data[i].split('=');
        if (item[0] === p) {
          var res = item[1].replace(/\+/g, '%20');
          result.push(decodeURIComponent(res));
        }
      }
      if (result.length) return result[0];
    }
  }, {
    key: 'extend',
    value: function extend(a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) a[key] = b[key];
      }return a;
    }
  }]);

  return Util;
}();

exports.default = new Util();

},{}]},{},[2])(2)
});