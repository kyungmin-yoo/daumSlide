/*jshint browser: true
*/

(function (exports) {
    "use strict";

    exports.event = {
        on: function () {
            if (document.addEventListener) {
                return function (el, type, fn) {
                    if (!el) {
                        throw 'failed to add event. Element: "' + el + '", Event: "' + type + '", handler: ' + fn.toString();
                    }
                    el.addEventListener(type, fn, false);
                };
            } else {
                return function (el, type, fn) {
                    el.attachEvent('on' + type, fn);
                };
            }
        }(),
        off: function () {
            if (document.removeEventListener) {
                return function (el, type, fn) {
                    el.removeEventListener(type, fn, false);
                };
            } else {
                return function (el, type, fn) {
                    el.detachEvent("on" + type, fn);
                };
            }
        }(),
        preventDefault: function (e) {
            var ev = e || window.event;
            if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                ev.returnValue = false;
            }
        },
        stopPropagation: function (e) {
            var ev = e || window.event;
            if (ev.stopPropagation) {
                ev.stopPropagation();
            } else {
                ev.cancelBubble = true;
            }
        },
        getTarget: function (e) {
            var ev = e || window.event;
            return ev.target || ev.srcElement;
        }
    };
})(window.daumtools = (typeof window.daumtools === 'undefined') ? {} : window.daumtools);

/*jshint browser: true
*/

(function (exports) {
    "use strict";
    
    exports.extend = function (dest, src, overwrite) {
        dest = dest || {};
        
        for(var key in src) {
            if (src.hasOwnProperty(key)) {
                if (!dest[key] || overwrite) {
                    dest[key] = src[key];
                }
            }
        }

        return dest;
    };
        
})(window.daumtools = (typeof window.daumtools === 'undefined') ? {} : window.daumtools);
/* source: https://gist.github.com/shakyShane/5944153
 *
 * Simple JavaScript Inheritance for ES 5.1 ( includes polyfill for IE < 9 )
 * based on http://ejohn.org/blog/simple-javascript-inheritance/
 *  (inspired by base2 and Prototype)
 * MIT Licensed.
 */
(function (global) {
    "use strict";

    if (!Object.create) {
        Object.create = (function () {
            function F() {
            }

            return function (o) {
                if (arguments.length !== 1) {
                    throw new Error("Object.create implementation only accepts one parameter.");
                }
                F.prototype = o;
                return new F();
            };
        })();
    }

    var fnTest = /xyz/.test(function () {
        /* jshint ignore:start */
        xyz;
        /* jshint ignore:end */
    }) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    function BaseClass() {
    }

    // Create a new Class that inherits from this class
    BaseClass.extend = function (props) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        var proto = Object.create(_super);

        // Copy the properties over onto the new prototype
        for (var name in props) {
            // Check if we're overwriting an existing function
            proto[name] = typeof props[name] === "function" &&
                typeof _super[name] === "function" && fnTest.test(props[name]) ?
                (function (name, fn) {
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, props[name]) :
                props[name];
        }

        // The new constructor
        var newClass = function () {
            if (typeof this.init === "function") {
                this.init.apply(this, arguments);
            }
        };


        // Populate our constructed prototype object
        newClass.prototype = proto;

        // Enforce the constructor to be what we expect
        proto.constructor = newClass;

        // And make this class extendable
        newClass.extend = BaseClass.extend;

        return newClass;
    };

    // export
    global.Class = BaseClass;
})(this);
/*jshint devel: true
 */
(function (exports) {
    'use strict';

    exports.Observer = Class.extend({
        on: function (event, listener) {
            var events = [].concat(event);
            for (var i = 0, l = events.length; i < l; i++) {
                this.addListener.apply(this, [events[i], listener]);
            }

            return this;
        },
        addListener: function (event, listener) {
            var listeners = this.getListeners(event);
            listeners.push(listener);
            return this;
        },
        once: function (event, listener) {
            if (!listener) {
                return ;
            }
            var self = this;
            var onetimeListener = function () {
                self.off(event, onetimeListener);
                listener.apply(this, arguments);
            };
            listener.__onetime_listener = onetimeListener;
            this.on(event, onetimeListener);
        },
        emit: function (event) {
            var events = [].concat(event);
            var args = [].slice.call(arguments, 1);
            for (var i = 0, l = events.length; i < l; i++) {
                this._emit(events[i], args);
            }

            return this;
        },
        _emit: function (event, args) {
            var cloneListeners = this.getListeners(event).slice(0);
            if (typeof cloneListeners !== 'undefined') {
                for (var i = 0, len = cloneListeners.length; i < len; i++) {
                    try {
                        cloneListeners[i].apply(this, args);
                    } catch (e) {
                        if (typeof console !== 'undefined') {
                            console.error('failed on while "' + event + '" event, caused by\r\n > ' + e);
                        }
                        throw e;
                    }
                }
            }
        },
        getListeners: function (event) {
            this.listeners = this.listeners || {};
            this.listeners[event] = this.listeners[event] || [];
            return this.listeners[event];
        },
        off: function (event, listener) {
            var events = [].concat(event);
            if (listener && typeof listener.__onetime_listener === 'function') {
                listener = listener.__onetime_listener;
            }

            for (var i = 0, l = events.length; i < l; i++) {
                this.removeListener.apply(this, [events[i], listener]);
            }

            if (listener && typeof listener.__onetime_listener === 'function') {
                delete listener.__onetime_listener;
            }
            return this;
        },
        removeListener: function (event, listener) {
            var listeners = this.getListeners(event);
            if (typeof listeners !== 'undefined') {
                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener || listeners[i].__original__ === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
            return this;
        },
        destroy: function () {
            this.listeners = null;
        }
    });
})(this);
/*! ua_parser - v1.0.14 - 2013-08-08
* Copyright (c) 2013 HTML5 Tech. Team in Daum Communications Corp.;
* Licensed MIT - https://github.com/daumcorp/ua_parser/blob/master/LICENSE*/
/*jshint browser: true, node: true
*/

(function (exports) {
    'use strict';

    var userAgent = exports.userAgent = function (ua) {
        ua = (ua || window.navigator.userAgent).toString().toLowerCase();
        function checkUserAgent(ua) {
            var browser = {};
            var match = /(dolfin)[ \/]([\w.]+)/.exec( ua ) ||
                    /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                    /(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(webkit)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
                    /(msie) ([\w.]+)/.exec( ua ) ||
                    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
                    ["","unknown"];
            if (match[1] === "webkit") {
                match = /(iphone|ipad|ipod)[\S\s]*os ([\w._\-]+) like/.exec(ua) ||
                    /(android)[ \/]([\w._\-]+);/.exec(ua) || [match[0], "safari", match[2]];
            } else if (match[1] === "mozilla") {
                if (/trident/.test(ua)) {
                    match[1] = "msie";
                } else {
                    match[1] = "firefox";
                }
            } else if (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)) {
                match[1] = "polaris";
            }

            browser[match[1]] = true;
            browser.name = match[1];
            browser.version = setVersion(match[2]);

            return browser;
        }

        function setVersion(versionString) {
            var version = {};

            var versions = versionString ? versionString.split(/\.|-|_/) : ["0","0","0"];
            version.info = versions.join(".");
            version.major = versions[0] || "0";
            version.minor = versions[1] || "0";
            version.patch = versions[2] || "0";

            return version;
        }

        function checkPlatform (ua) {
            if (isPc(ua)) {
                return "pc";
            } else if (isTablet(ua)) {
                return "tablet";
            } else if (isMobile(ua)) {
                return "mobile";
            } else {
                return "";
            }
        }
        function isPc (ua) {
            if (ua.match(/linux|windows (nt|98)|macintosh/) && !ua.match(/android|mobile|polaris|lgtelecom|uzard|natebrowser|ktf;|skt;/)) {
                return true;
            }
            return false;
        }
        function isTablet (ua) {
            if (ua.match(/ipad/) || (ua.match(/android/) && !ua.match(/mobi|mini|fennec/))) {
                return true;
            }
            return false;
        }
        function isMobile (ua) {
            if (!!ua.match(/ip(hone|od)|android.+mobile|windows (ce|phone)|blackberry|bb10|symbian|webos|firefox.+fennec|opera m(ob|in)i|polaris|iemobile|lgtelecom|nokia|sonyericsson|dolfin|uzard|natebrowser|ktf;|skt;/)) {
                return true;
            } else {
                return false;
            }
        }

        function checkOs (ua) {
            var os = {},
                match = /(iphone|ipad|ipod)[\S\s]*os ([\w._\-]+) like/.exec(ua) ||
                        /(android)[ \/]([\w._\-]+);/.exec(ua) ||
                        (/android/.test(ua)? ["", "android", "0.0.0"] : false) ||
                        (/polaris|natebrowser|([010|011|016|017|018|019]{3}\d{3,4}\d{4}$)/.test(ua)? ["", "polaris", "0.0.0"] : false) ||
                        /(windows)(?: nt | phone(?: os){0,1} | )([\w._\-]+)/.exec(ua) ||
                        (/(windows)/.test(ua)? ["", "windows", "0.0.0"] : false) ||
                        /(mac) os x ([\w._\-]+)/.exec(ua) ||
                        (/(linux)/.test(ua)? ["", "linux", "0.0.0"] : false) ||
                        (/webos/.test(ua)? ["", "webos", "0.0.0"] : false) ||
                        /(bada)[ \/]([\w._\-]+)/.exec(ua) ||
                        (/bada/.test(ua)? ["", "bada", "0.0.0"] : false) ||
                        (/(rim|blackberry|bb10)/.test(ua)? ["", "blackberry", "0.0.0"] : false) ||
                        ["", "unknown", "0.0.0"];

            if (match[1] === "iphone" || match[1] === "ipad" || match[1] === "ipod") {
                match[1] = "ios";
            } else if (match[1] === "windows" && match[2] === "98") {
                match[2] = "0.98.0";
            }
            os[match[1]] = true;
            os.name = match[1];
            os.version = setVersion(match[2]);
            return os;
        }

        function checkApp (ua) {
            var app = {},
                match = /(crios)[ \/]([\w.]+)/.exec( ua ) ||
                        /(daumapps)[ \/]([\w.]+)/.exec( ua ) ||
                        ["",""];

            if (match[1]) {
                app.isApp = true;
                app.name = match[1];
                app.version = setVersion(match[2]);
            } else {
                app.isApp = false;
            }

            return app;
        }

        return {
            ua: ua,
            browser: checkUserAgent(ua),
            platform: checkPlatform(ua),
            os: checkOs(ua),
            app: checkApp(ua)
        };
    };

    if (typeof window === 'object' && window.navigator.userAgent) {
        window.ua_result = userAgent(window.navigator.userAgent) || null;
    }

})((function (){
    // Make userAgent a Node module, if possible.
    if (typeof exports === 'object') {
        exports.daumtools = exports;
        exports.util = exports;
        return exports;
    } else if (typeof window === 'object') {
        window.daumtools = (typeof window.daumtools === 'undefined') ? {} : window.daumtools;
        window.util = (typeof window.util === 'undefined') ? window.daumtools : window.util;
        return window.daumtools;
    }
})());
/*
                           _                           
        _____  ____  ___ _| |_ _   _  _  __  ____      
       |  _  |/ __ \/ __|_   _| | | || |/__|/ __ \   
       | (_) |  ___/\__ \ | | | |_| ||  /  |  ___/   
        \__  |\____/|___/ | |_ \___/ |_|    \____/ 
        ___) |            |__/                         
        \____/                                         

  Version   : 2.0.0-pre13
  Copyright : 2014-10-21
  Author    : HTML5 tech team, Daum corp

*/
/*global daumtools:true, Class:true, gesture:true*/
(function (exports) {
    "use strict";

    var TOUCH_EVENT = {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
        cancel: 'touchcancel'
    };
    var MOUSE_EVENT = {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup'
    };

    exports.EVENT = !!('ontouchstart' in window) ? TOUCH_EVENT : MOUSE_EVENT;

    exports.DIRECTION = {
        left: 'left',
        right: 'right',
        up: 'up',
        down: 'down',
        origin: 'origin'
    };
    exports.TYPE = {
        swipe: 'swipe',
        scroll: 'scroll',
        tab: 'tab',
        down: 'down'
    };

    var util = exports.util = {};
    try {
        var eventUtil = window.daumtools.event;
        
        util.on = eventUtil.on;
        util.off = eventUtil.off;
        util.preventDefault = eventUtil.preventDefault;
        util.stopPropagation = eventUtil.stopPropagation;
        util.extend = window.daumtools.extend;
    } catch(e) {
        throw new Error("Not found : event and extend");
    }
    exports.Class = window.Class || (window.daumtools && window.daumtools.Class);
    exports.Observable = window.Observer || window.Observable || (window.daumtools && window.daumtools.Observable);
    if (!exports.Class || !exports.Observable) {
       new Error("Not found : Class & Observable");
    }

})(window.gesture = (typeof gesture === 'undefined') ? {} : gesture);

(function (exports) {
    "use strict";

    var DIRECTION = exports.DIRECTION,
        TYPE = exports.TYPE;

    exports.Session = Class.extend({
        init: function(e, threshold) {
            this.threshold = threshold;

            this.type = TYPE.tab;
            this.direction = DIRECTION.origin;
            this.startPos = null;
            this.delta = null;
            this.targetEvent = null;

            this._start(e);
        },
        _start: function(e) {
            this.startTime = new Date();

            this.setTargetEvent(e);
            this.startPos = this.getPoint();
        },
        update: function(e) {
            this.setTargetEvent(e);
            this.setDelta();
            this.setType();
        },
        setType: function () {
            if (this.type === TYPE.tab) {
                var absX = Math.abs(this.delta.x);
                var absY = Math.abs(this.delta.y);

                if (absX > 0 && absX >= absY) {
                    this.type = TYPE.swipe;
                } else if (absY > 0 && absY > absX) {
                    this.type = TYPE.scroll;
                }
            }
        },
        finishUpdate: function (e) {
            this.setTargetEvent(e);
            this.setDirection();
        },
        setDirection: function () {
            if (this.type === TYPE.swipe && this.delta.x !== 0) {
                this.direction = (this.delta.x < 0) ? DIRECTION.left : DIRECTION.right;
            } else if (this.type === TYPE.scroll && this.delta.y !== 0) {
                this.direction = (this.delta.y < 0) ? DIRECTION.up : DIRECTION.down;
            }
        },
        setTargetEvent: function(e) {
            this.targetEvent = e || window.event;
        },
        setDelta: function () {
            var currentPos = this.getPoint(),
                deltaX = currentPos.x - this.startPos.x,
                deltaY = currentPos.y - this.startPos.y;

            this.delta = {
                x: (Math.abs(deltaX) > this.threshold) ? deltaX : 0,
                y: (Math.abs(deltaY) > this.threshold) ? deltaY : 0
            };
        },
        getPoint: function() {
            return {
                x: this.getX(this.targetEvent),
                y: this.getY(this.targetEvent)
            };
        },
        getX: function (e) {
            var point = e.touches ? e.touches[0] : e;
            return point.pageX || point.clientX;
        },
        getY: function (e) {
            var point = e.touches ? e.touches[0] : e;
            return point.pageY || point.clientY;
        }
    });

})(window.gesture = (typeof gesture === 'undefined') ? {} : gesture);

(function (exports) {
    "use strict";

    var util = exports.util;

    var DEFAULT_OPTION = {
        threshold: 10
    };

    var EVENT = exports.EVENT,
        TYPE = exports.TYPE;

    exports.Listener = exports.Observable.extend({
        init: function(el, option) {
            this.option = util.extend(option, DEFAULT_OPTION);
            this.session = null;
            this.el = el;

            this._bindEvent();
            this.start();
        },
        _bindEvent: function() {
            var self = this;
            this._onStart = function _onStart(e) {
                self._start(e);
            };
            this._onMove = function _onMove(e) {
                self._move(e);
            };
            this._onEnd = function _onEnd(e) {
                self._end(e);
            };
        },
        start: function () {
            util.on(this.el, EVENT.start, this._onStart);
        },
        stop: function () {
            util.off(this.el, EVENT.start, this._onStart);
            this._unbindExtraGesureEvent();
        },
        _start: function(e) {
            if (this.session) {
                this._end(e);
                return;
            }

            this.session = new exports.Session(e, this.option.threshold);
            this._fireStartEvent(this.session);
            this._bindExtraGestureEvent();
        },
        _move: function (e) {
            var session = this.session;
            if (session) {
                session.update(e);
                this._fireMoveEvent(session);
            }
        },
        _end: function (e) {
            var session = this.session;
            if (session) {
                session.finishUpdate(e);
                this._fireEndEvent(session);
            }

            this._unbindExtraGesureEvent();
            this.session = null;
        },
        _fireStartEvent: function(session) {
            this.emit('start', session);
        },
        _fireMoveEvent: function (session) {
            if(session.type === TYPE.swipe || session.type === TYPE.scroll) {
                this.emit([session.type, 'move'], session);
            }
        },
        _fireEndEvent: function(session) {
            if(session.type === TYPE.tab) {
                this.emit(TYPE.tab, session);
            }
            this.emit(session.direction, session);
            this.emit('end', session);
        },
        _bindExtraGestureEvent: function () {
            util.on(document, EVENT.move, this._onMove);
            util.on(document, EVENT.end, this._onEnd);
            if(EVENT.cancel) {
                util.on(document, EVENT.cancel, this._onEnd);
            }
        },
        _unbindExtraGesureEvent: function () {
            util.off(document, EVENT.move, this._onMove);
            util.off(document, EVENT.end, this._onEnd);
            if(EVENT.cancel) {
                util.off(document, EVENT.cancel, this._onEnd);
            }
        },
        onSwipe: function(callback) {
            this.on(TYPE.swipe, callback);
        },
        onScroll: function(callback) {
            this.on(TYPE.scroll, callback);
        },
        onStart: function(callback) {
            this.on('start', callback);
        },
        onMove: function(callback) {
            this.on('move', callback);
        },
        onEnd: function(callback) {
            this.on('end', callback);
        },
        onTab: function(callback) {
            this.on(TYPE.tab, callback);
        },
        destroy: function () {
            util.off(this.el, EVENT.start, this._onStart);
            this.session = null;
            this.el = null;

            this._super();
        }
    });

})(window.gesture = (typeof gesture === 'undefined') ? {} : gesture);

/*
       _  _     _          
      | |(_)   | |         
   ___| | _  __| | ____    
  / __| || |/ _  |/ __ \   
  \__ \ || | (_| |  ___/   
  |___/_||_|\____|\____/   

  Version   : 2.0.0-pre18
  Copyright : 2014-11-28
  Author    : HTML5 Cell, daumkakao corp

*/
/*jshint browser: true
*/
/*global slide:true, Class, gesture, clay, util, daumtools, dongtl*/
/**
 * @module slide
 * @main
 */
 /**
 * @class slide
 * @static
 */
(function (exports) {
    'use strict';

    var _prefix = ['', '-webkit-'];
    var _style = (document.body || document.documentElement).style;
    function getPrefixStyle(exp) {
        var _prefixExp = '';
        for(var i=0, len=_prefix.length; i<len; i+=1) {
            _prefixExp = _prefix[i] + exp;
            if(_prefixExp in _style) {
                return _prefixExp;
            }
        }
        return '';
    }

    // slide mode for animation
    exports.MODE_SIMPLE = 1;
    exports.MODE_INTERVAL = 2;
    exports.MODE_TRANSFORM = 3;

    // style preset
    exports.TRANSFORM = getPrefixStyle('transform');
    exports.TRANSFORM_STYLE = getPrefixStyle('transform-style');
    exports.PERSPECTIVE = getPrefixStyle('perspective');
    exports.BACKFACE_VISIBILITY = getPrefixStyle('backface-visibility');
    exports.TRANSITION_DURATION = getPrefixStyle('transition-duration');

    // slide status
    exports.EMPTY = null;

    exports.DIVIDED = 1;
    exports.FIXED = 2;

    exports.LEFT = 1;
    exports.RIGHT = 2;
    exports.CENTER = 3;

    exports.CANCEL = 'cancel';
    exports.NEXT = 'next';
    exports.PREV = 'prev';

    var util = exports.util = {};
    // event & extend library
    try {
        var eventUtil = window.daumtools.event;
        /**
         * dom event 등록 함수
         *
         * @method on
         * @param el {HTMLElement} 이벤트가 발생하는 엘리먼트
         * @param eventName {String} 이벤트 이름
         * @param callback {Function} 이벤트 발생시 동작할 콜백 함수
         */
        util.on = eventUtil.on;
        /**
         * dom event 제거 함수
         *
         * @method off
         * @param el {HTMLElement} 이벤트가 발생하는 엘리먼트
         * @param eventName {String} 이벤트 이름
         * @param callback {Function} 이벤트 발생시 동작 하지 않게 제거할 콜백 함수
         */
        util.off = eventUtil.off;
        /**
         * 해당 event에 의한 browser 의 기본 동작을 막는 함수.
         *
         * @method preventDefault
         * @param e {Event} dom event object
         */
        util.preventDefault = eventUtil.preventDefault;
        /**
         * 해당 event에 의한 browser 버블링 현상을 막는 함수.
         *
         * @method stopPropagation
         * @param e {Event} dom event object
         */
        util.stopPropagation = eventUtil.stopPropagation;
        /**
         * 해당 event에 의한 browser 버블링 현상을 막는 함수.
         *
         * @method stopPropagation
         * @param e {Event} dom event object
         */
        util.extend = window.daumtools.extend;

        util.toNumber = function(n, defaultN) {
            if(!n) {
                return defaultN;
            }

            return n-0;
        };

        util.createDelegate = function(delegate, scope) {
            return function _delegate() {
                return delegate.apply(scope, arguments);
            };
        };

    } catch(e) {
        throw new Error("Not found : daumtools event");
    }

    // class & observable library
    /**
     * 상속기능을 제공하는 Class library
     *
     * @class Class
     * @static
     */
    /**
     * 상속 기능을 갖는 클래스를 생성한다.
     *
     * @method extend
     * @param object {Object} 클래스로 생성할 객체
     * @return {Class} 상속을 받아 새롭게 생성된 Class 객체
     */
    exports.Class = window.Class || (window.daumtools && window.daumtools.Class);
    /**
     * custom event emitter Class.
     *
     * @class Observable
     * @extends Class
     * @static
     */
    /**
     * Add custom event.
     *
     * @method on
     * @chainable
     * @param eventName {String} 등록할 커스텀 이벤트
     * @param callback {Function} 등록한 이벤트 발생시 호출될 콜백 함수
     */
    /**
     * Remove custom event.
     *
     * @method off
     * @chainable
     * @param eventName {String} 제거할 커스텀 이벤트
     * @param callback {Function} 제거할 콜백 함수
     */
    /**
     * Emit custom event.
     *
     * @method emit
     * @chainable
     * @param eventName {String} 호출할 커스텀 이벤트
     * @param [args]* {mixed} 호출될 콜백 함수에게 넘겨줄 인자 값
     */
    exports.Observable = window.Observer || window.Observable || (window.daumtools && window.daumtools.Observable);
    if (!exports.Class || !exports.Observable) {
       new Error("Not found : Class & Observable");
    }
    
    /**
     * ua_parser library parsing result
     *
     * @property ua
     * @type Object
     * @for slide
     */
    exports.ua = window.ua_result;
    if (!exports.ua) {
       new Error("Not found : ua_parser");
    }

    /**
     * gesture library
     *
     * @class gesture
     * @static
     */
    /**
     * @method GestureListener
     * @param frameEl {HTMLElement} gesture 를 감지할 영역에 해당하는 엘리먼트
     * @param threshold {Number} gesture 를 감지를 시작하기 위한 최소값
     * @return {GestureListenerObj}
     */
    exports.gesture = window.gesture;
    if (!exports.gesture) {
       new Error("Not found : gesture");
    }

    /**
     * 3d gpu 가속 여부를 사용할수 있는지 판단한다.
     */
    var ua = exports.ua;
    var os = ua.os;
    var browser = ua.browser;
    var browserVersion = browser.version;
    var isTransformEnabled = (function () {
        var isExist = !!exports.TRANSFORM;
        var isOverIcs = (function () {
            if (browser.android) {
                var major = parseInt(browserVersion.major, 10);
                return major > 3;
            }
            return false;
        })();
        return !!(isExist && (isOverIcs || os.ios || browser.safari || browser.chrome || (browser.msie && browserVersion.major >= 10)));
    })();
    var isOldIE = (function () {
        return !!(ua.platform === "pc" && browser.msie && browserVersion.major <= 9);
    })();

    exports.config = {
        mode: isTransformEnabled ? exports.MODE_TRANSFORM : (isOldIE ? exports.MODE_INTERVAL : exports.MODE_SIMPLE),
        isTransformEnabled: isTransformEnabled,
        isOldIE: isOldIE,
        isBindingVisibilityChange: !!(os.ios && parseInt(os.version.major, 10) > 6),
        hardwareAccelStyle: isTransformEnabled ? exports.TRANSFORM + ':translate3d(0,0,0);' : ''
    };
})(window.slide = (typeof slide === 'undefined') ? {} : slide);

/*global Class: true, slide: true */
(function (exports) {
    "use strict";

    var EMPTY_FUNC = function() {};

    /**
     * slide 를 위한 데이터소스 delegate
     * 새로운 DataSource를 생성/초기화한다.
     *
     * @class DataSource
     * @constructor
     * @param data {Array}
     */
    exports.DataSource = Class.extend({
        /**
         * 새로운 DataSource를 생성/초기화한다.
         * @param data {Array}
         */
        init: function (data) {
            this.data = data;
            this.index = 0;
            this.EMPTY = '_empty';
        },
        /**
         * 현재 인덱스를 설정한다.
         *
         * @method setIndex
         * @param index {Number} 현재 인덱스로 세팅할 값
         */
        setIndex: function (index) {
            this.index = index;
        },

        getIndex: function () {
            return this.index;
        },

        setIndexByOffset: function(offset) {
            this.index = this.getIndexByOffset(offset);
        },
        getIndexByOffset: function(offset) {
            return this.index + offset;
        },

        /**
         * 이전 데이터를 불러온다.
         * 데이터가 없을 경우 해당 필드는 null 로 세팅된다.
         *
         * @method queryPrev
         * @async
         * @param callback {Function} 데이터를 모두 로드 된후 해당 데이터를 인자로 갖고 실행될 callback 함수
         */
        queryPrev: function (callback) {
            var index = this.getIndexByOffset(-1);
            this.queryData(index, callback);
        },
        /**
         * 현재 데이터를 불러온다.
         *
         * @method queryCurrent
         * @async
         * @param callback {Function} 데이터를 모두 로드 된후 해당 데이터를 인자로 갖고 실행될 callback 함수
         */
        queryCurrent: function (callback) {
            this.queryData(this.index, callback);
        },
        /**
         * 다음 데이터를 불러온다.
         * 데이터가 없을 경우 해당 필드는 null 로 세팅된다.
         *
         * @method queryNext
         * @async
         * @param callback {Function} 데이터를 모두 로드 된후 해당 데이터를 인자로 갖고 실행될 callback 함수
         */
        queryNext: function (callback) {
            var index = this.getIndexByOffset(1);
            this.queryData(index, callback);
        },
        /**
         * 다음 데이터로 이동
         *
         * @method next
         */
        next: function (movedCount) {
            this.index = this.getIndexByOffset(movedCount || 1);
        },
        /**
         * 이전 데이터로 이동
         *
         * @method prev
         */
        prev: function (movedCount) {
            this.index = this.getIndexByOffset(-(movedCount || 1));
        },
        /**
         * 데이터 끝에 도달하였을 때 호출될 delegate를 설정한다.
         *
         * @method willQueryEndOfData
         * @param delegate {Function}
         */
        willQueryEndOfData: function (delegate) {
            this.willQueryEndOfDataDelegate = delegate;
        },
        /**
         * 현재 데이터 끝에 도달하였을 때 호출될 기본 delegate.
         * callback에 null을 넘겨 호출하여 준다.
         *
         * @method willQueryEndOfDataDelegate
         * @param callback {Function}
         */
        willQueryEndOfDataDelegate: function (callback, index) {
            callback(exports.EMPTY);
        },
        /**
         * 데이터 시작에 도달하였을 때 호출될 delegate를 설정한다.
         *
         * @method willQueryFirstOfData
         * @param delegate {Function}
         */
        willQueryFirstOfData: function (delegate) {
            this.willQueryFirstOfDataDelegate = delegate;
        },
        /**
         * 현재 데이터 시작에 도달하였을 때 호출될 기본 delegate.
         * callback에 null을 넘겨 호출하여 준다.
         *
         * @method willQueryFirstOfDataDelegate
         * @param callback {Function}
         */
        willQueryFirstOfDataDelegate: function (callback, index) {
            callback(exports.EMPTY);
        },
        /**
         * 기존의 데이터 뒤에 새로운 데이터를 추가한다.
         *
         * @method addNextData
         * @param addends {Array} 추가될 data Array
         */
        addNextData: function (addends) {
            this.data = this.data.concat(addends);
        },
        /**
         * 기존의 데이터 앞에 새로운 데이터를 추가한다.
         *
         * @method addPrevData
         * @param addends {Array} 추가될 data Array
         */
        addPrevData: function (addends) {
            this.setIndex(addends.length + this.index);
            this.data = addends.concat(this.data);
        },

        hasNext: function(callback) {
            this.hasDataByOffset(1, callback);
        },
        hasPrev: function(callback) {
            this.hasDataByOffset(-1, callback);
        },
        hasDataByOffset: function(offset, callback) {
            var index = this.getIndexByOffset(offset);
            this.queryData(index, function _hasData(data) {
                callback(!!data);
            });
        },

        queryData: function(index, callback) {
            if(typeof callback !== 'function') {
                callback = EMPTY_FUNC;
            }

            if (index > (this.data.length-1)) { // reaches end
                return this.willQueryEndOfDataDelegate(callback, index);

            } else if (index < 0) { // reaches at first
                return this.willQueryFirstOfDataDelegate(callback, index);
            }

            callback(this.data[index]);
        },

        queryDataList: function(index, n, callback) {
            var self = this;
            var dataset = [];
            var counter = 0;

            if(typeof callback !== 'function') {
                callback = EMPTY_FUNC;
            }

            if(n <= 0) {
                return callback(dataset);
            }

            // 다음 delegate가 실행되어야 새로운 데이터를 받으므로,
            // Serialization가 필요없다.
            this.queryData(index, function _insert(data) {
                dataset.push(data);
                counter+=1;
                if(counter < n) {
                    self.queryData(index+counter, _insert);

                } else {
                    callback(dataset);
                }
            });
        },

        /**
         * 해당 클래스의 인스턴스 삭제시 할당된 오브젝트들을 destroy 시킨다.
         *
         * @method destroy
         */
        destroy: function () {
            delete this.data;
        }
    });
})(window.slide = (typeof slide === 'undefined') ? {} : slide);


/*global Class: true, slide: true */
(function (exports) {
    "use strict";

    /**
     * slide 를 위한 데이터소스 delegate.
     * 무한 루프 형태의 DataSource 예시
     *
     * @class InfiniteDataSource
     * @extend DataSource
     * @constructor
     * @param data {Array}
     */
    exports.InfiniteDataSource = exports.DataSource.extend({
        /**
         * 현재 데이터 시작에 도달하였을 때 호출될 기본 delegate.
         * callback에 맨 마지막 데이터를 넘겨 호출하여 준다.
         *
         * @method willQueryFirstOfDataDelegate
         * @param callback {Function}
         */
        willQueryFirstOfDataDelegate: function (callback, index) {
            var _index = this.convertRegularIndex(index || (this.data.length-1));
            callback(this.data[_index]);
        },
        /**
         * 현재 데이터 끝에 도달하였을 때 호출될 기본 delegate.
         * callback에 맨처음 데이터를 넘겨 호출하여 준다.
         *
         * @method willQueryEndOfDataDelegate
         * @param callback {Function}
         */
        willQueryEndOfDataDelegate: function (callback, index) {
            var _index = this.convertRegularIndex(index || 0);
            callback(this.data[_index]);
        },
        convertRegularIndex: function(index) {
            var length = this.data.length;
            while(index < 0) {
                index += length;
            }
            return index % length;
        },
        getIndexByOffset: function(offset) {
            return this.convertRegularIndex(this.index + offset);
        }
    });

})(window.slide = (typeof slide === 'undefined') ? {} : slide);


/* jshint browser: true */
/* global slide:true, Class: true, gesture: true */
(function (exports) {
    'use strict';

    /**
     * @class Element
     * @constructor Panel
     * @extends Class
     * @param slide {Object} slide Class
     * @param option {Object} option values
     */
    exports.Element = Class.extend({
        init: function() {
            this.el = null;
        },
        destroy: function () {
            this.el = null;
        },

        setStyle: function (key, value) {
            this.el.style[key] = value;
        },
        setTransitionDuration: function (duration) {
            this.setStyle(exports.TRANSITION_DURATION, duration);
        },
        setTransform: function (transform) {
            this.setStyle(exports.TRANSFORM, transform);
        },
        setLeft: function (left) {
            this.setStyle('left', left);
        },

        clear: function() {
            this.el.innerHTML = '';
        },

        show: function() {
            this.setStyle('display', 'inline-block');
        },
        hide: function() {
            this.setStyle('display', 'none');
        }
    });
})(window.slide = (typeof slide === 'undefined') ? {} : slide);
/* jshint browser: true */
/* global slide:true, Class: true, gesture: true */
(function (exports) {
    'use strict';

    /**
     * 새로운 Panel을 생성/초기화 한다.
     *
     * @class Panel
     * @constructor Panel
     * @extends Class
     * @param slide {Object} slide Class
     * @param option {Object} option values
     */
    var Panel = exports.Panel = exports.Element.extend({
        init: function (slide, option) {
            this.slide = slide;
            this.el = this.createPanel(option || {});
        },
        /**
         * panel Element를 생성/초기화 한다.
         *
         * @method createPanel
         * @param width {Number}
         */
        createPanel: function (option) {
            var panel = document.createElement(option.tagName || "div");
            panel.className = option.className || "panel";
            panel.style.cssText = 'position:absolute;top:0;left:0;' +
                'width:100%;height:100%;overflow:hidden;display:inline-block;' +
                exports.config.hardwareAccelStyle;
            return panel;
        },
        /**
         * panel Element에 data를 넣는다.
         *
         * @method setData        
         * @param data {HTMLElement}
         */
        render: function (data) {
            this.el.innerHTML = !!data ? data.toHTML(this, this.slide) : '&nbsp;';
        },
        /**
         * 웹접근성을 위한 코드.
         * 스크린 리더에서 데이터를 읽을지 말지 결정한다.
         *
         * @method setAccessibility
         * @param flag {Boolean} true면 스트린리더에서 데이터를 읽지 않는다.
         */
        setAccessibility: function (flag) {
            this.el.setAttribute("aria-hidden", flag);
        }
    });
})(window.slide = (typeof slide === 'undefined') ? {} : slide);
/*jshint browser: true
*/
/*global slide:true, Class, gesture, clay*/
(function (exports) {
    'use strict';

    var slideInstanceNum = 0;

    /**
     * #### 새로운 Container를 생성/초기화 한다.
     *
     * @class Container
     * @extends Class
     * @constructor Container
     * @param slide {Object} slide Class
     * @param option {Object} option values
     */
    var Container = exports.Container = exports.Element.extend({
        init: function (slide, option) {
            this.slide = slide;
            this.config = [];
            this.panels = [];

            var _option = option || {};
            this.option = _option.container || {};
            this.panelOption = _option.panel || {};
            this.panelClass = _option.panelClass || exports.Panel;

            this.createElement();
        },
        createElement: function () {
            var container = this.el = document.createElement("div");
            container.className = this.option.className || "slide";
            container.style.cssText = this.setContainerStyle();
            if (this.option.id) {
                container.id = this.option.id;

            } else {
                slideInstanceNum += 1;
                container.id = "slide-" + slideInstanceNum;
            }

            var frameEl = this.slide.frameEl;
            frameEl.innerHTML = '';
            frameEl.appendChild(container);
        },
        /**
         * 새로운 Container를 생성/초기화 한다.
         *
         * @method createContainer
         * @param width {String | Number} Slide Frame의 width 값
         * @return container {HTMLElement} container element
         */
        setContainerStyle: function () {
            return "position:absolute;top:0;left:0;" +
                "width:100%;height:100%;" + exports.config.hardwareAccelStyle;
        },
        /**
         * 컨테이너에서 조절할 패널을 설정한다.
         *
         * @method setPanel
         * @param panelOption {Object} panel을 설정할때 필요한 panel 옵션 값
         */
        createPanels: function (config) {
            this.panels = [];
            this.config = config;

            this.hide();
            this.clear();
            for (var i=0, len=config.length; i<len; i+=1) {
                this.panels.push(this.initPanel());
            }
            this.setAccessibility();
            this.show();
        },
        /**
         * 하나의 패널을 생성/초기화 한다.
         *
         * @method initPanel
         * @param panelOption {Object} panel을 설정할때 필요한 panel 옵션 값
         * @return panel {PanelClass} 생성/초기화한 PanelClass Instance
         */
        initPanel: function () {
            var PanelClass = this.panelClass;
            var panel = new PanelClass(this.slide, this.panelOption);

            this.el.appendChild(panel.el);

            return panel;
        },
        /**
         * 웹접근성을 위한 코드.
         * 현재 패널만 스크린 리더에서 읽도록 한다.
         * 이전 패널과 이후 패널의 데이터를 스크린 리더에서 읽지 못하도록 막는다.
         *
         * @method setAriaHiddenPanels
         */
        setAccessibility: function () {
            var panels = this.panels;
            var config = this.config;
            for (var i=0, len=panels.length; i<len; i+=1) {
                panels[i].setAccessibility(config[i].accessibility || false);
            }
        },
        updateAll: function (dataSet) {
            var panels = this.panels;
            for (var i=0, len=panels.length; i<len; i+=1) {
                panels[i].render(dataSet[i]);
            }
        },
        /**
         * 해당 클래스의 인스턴스 삭제시 할당된 오브젝트들을 destroy 시킨다.
         *
         * @method destroy
         */
        destroy: function () {
            this.el = null;

            var panels = this.panels;
            for(var i=0, l=panels.length; i<l; i+=1){
                panels[i].destroy();
            }
            delete this.panels;
        },

        getPanel: function(index) {
            if(typeof index !== 'number') {
                return;
            }

            return this.panels[index];
        },
        extractPanel: function(index) {
            if(typeof index !== 'number' || index < 0) {
                return;
            }

            return this.panels.splice(index, 1)[0];
        },

        updatePanel: function(index, data) {
            var panel = this.getPanel(index);
            panel.render(data);
        },
        arrangePanel: function(targetIndex, beforeIndex) {
            var beforePanel = this.getPanel(beforeIndex);
            var targetPanel = this.extractPanel(targetIndex);

            if(beforePanel) {
                var panels = this.panels;
                this.panels = panels.splice(0, beforeIndex).concat(targetPanel, panels);
                this.el.insertBefore(targetPanel.el, panels[beforeIndex].el);

            } else {
                this.panels.push(targetPanel);
                this.el.appendChild(targetPanel.el);
            }

            this.setAccessibility();
        },

        setPanelStyle: function(name, style) {
            var panels = this.panels;
            for(var i=0,len=panels.length;i<len;i+=1) {
                panels[i].setStyle(name, style);
            }
        }
    });
})(window.slide = (typeof slide === 'undefined') ? {} : slide);

(function(exports) {

    var SLIDE_THRESHOLD = 50;
    var DURATION = 200;
    var GESTURE_RATIO = 0.5;
    var PANELS_TO_SLIDE = 1;
    var PANELS_TO_SHOW = 1;
    var PANEL_WIDTH = 300;

    exports.BasicController = Class.extend({
        init: function(slide, datasource, option) {
            this.slide = slide;
            this.datasource = datasource;
            this.container = null;
            this.animator = null;
            this.updater = null;

            this.callback = null;

            this.frameWidth = slide.screen.width;
            this.frameHeight = slide.screen.height;

            this._setOption(option);
            this._createContainer(slide, option);
            this._createAnimator(slide, option);
            this._createUpdater(slide, option);
            this._setDelegate(option);
        },
        _setDelegate: function(option) {
            if(!option.delegate) {
                return;
            }

            var DelegateClass = exports.BasicDelegate.extend(option.delegate);
            var delegate = new DelegateClass();

            for(var name in DelegateClass.prototype) {
                this._setDelegateMethod(name, delegate, this);
                this._setDelegateMethod(name, delegate, this.animator);
                this._setDelegateMethod(name, delegate, this.updater);
            }
        },
        _setDelegateMethod: function(name, delegate, scope) {
            if(scope[name]) {
                scope[name] = exports.util.createDelegate(delegate[name], scope);
            }
        },
        _setOption: function(option) {
            var util = exports.util;

            this.panelType = option.panelType || exports.DIVIDED;
            this.isCenterAligned = option.isCenterAligned || false;
            this.isAutoAligned = !this.isCenterAligned && (this.panelType === exports.FIXED);

            this.threshold = util.toNumber(option.threshold, SLIDE_THRESHOLD);
            this.gestureRatio = util.toNumber(option.gestureRatio, GESTURE_RATIO);
            this.panelsToSlide = util.toNumber(option.panelsToSlide, PANELS_TO_SLIDE);

            if(this.panelType === exports.DIVIDED) {
                var panelsToShow = util.toNumber(option.panelsToShow, PANELS_TO_SHOW);
                this._setDividedPanelWidth(panelsToShow);

            } else {
                var panelWidth = util.toNumber(option.panelWidth, PANEL_WIDTH);
                this._setFixedPanelWidth(panelWidth);
            }
        },
        _setDividedPanelWidth: function(panelsToShow) {
            this.panelsToShow = panelsToShow;
            this.panelWidth = this.frameWidth/panelsToShow;
        },
        _setFixedPanelWidth: function(panelWidth) {
            this.panelsToShow = Math.ceil(this.frameWidth / panelWidth);
            this.panelWidth = panelWidth;
        },
        _createContainer: function (slide, option) {
            this.container = new exports.Container(slide, option);
        },
        _createAnimator: function (slide, option) {
            var duration = exports.util.toNumber(option.duration, DURATION);
            this.animator = new exports.Animator(slide, this, duration);
        },
        _createUpdater: function(slide, option) {
            this.updater = new exports.Updater(slide, this);
        },

        _getSparePanelsCount: function() {
            var leastSparePanels = Math.ceil(this.panelsToShow * this.gestureRatio);
            return Math.max(leastSparePanels, this.panelsToSlide);
        },
        _getPanelsLength: function(sparePanelCount) {
            var panelsLength = this.panelsToShow + (sparePanelCount * 2);
            var isUnbalanced = (this.isCenterAligned && !(panelsLength%2));
            return panelsLength + (isUnbalanced ? 1 : 0);
        },
        createPanelsConfig: function() {
            var sparePanelCount = this._getSparePanelsCount();
            var panelsLength = this._getPanelsLength(sparePanelCount);

            this.basePanelIndex = this.isCenterAligned ?
                Math.floor(panelsLength/2) : sparePanelCount;

            var panelsConfig = [];
            for(var i=0;i<panelsLength;i+=1) {
                panelsConfig.push({
                    accessibility: i<sparePanelCount || i>=(panelsLength-sparePanelCount)
                });
            }

            return panelsConfig;
        },
        createPanels: function() {
            var panelsConfig = this.createPanelsConfig();
            this.container.createPanels(panelsConfig);
        },
        resizePanels: function() {
            this.container.setPanelStyle('width', this.panelWidth + 'px');
            this.animator.setDefaultSlidePosition();
        },
        refresh: function() {
            this.resizePanels();
            this.updater.updateAll();
        },
        resetPanels: function() {
            this.createPanels();
            this.refresh();
        },

        resize: function(width, height) {
            if(this.panelType === exports.FIXED) {
                this._resizeFixedPanels(width, height);

            } else {
                this._resizeDividedPanels(width, height);
            }
        },
        _resizeDividedPanels: function(width, height) {
            this.panelWidth = width/this.panelsToShow;
            this.resizePanels();
        },
        _resizeFixedPanels: function(width, height) {
            var panelsToShow = Math.ceil(width / this.panelWidth);
            if(this.panelsToShow !== panelsToShow) {
                this._adjustDataIndexToPanelsToShow(panelsToShow);

                this.panelsToShow = panelsToShow;
                this.resetPanels();

            } else {
                this.resizePanels();
            }
        },
        _adjustDataIndexToPanelsToShow: function(panelsToShow) {
            if(!this.isAutoAligned) {
                return;
            }

            var ds = this.datasource;
            var index = ds.getIndexByOffset(panelsToShow);
            if(index > ds.data.length ) {
                ds.setIndexByOffset(this.panelsToShow - panelsToShow);
            }
        },

        getMovedCountByGesture: function(deltaX, deltaY) {
            if(!this.isOverThreshold(deltaX, deltaY)) {
                return 0;
            }

            return this.animator.getMovedCountByGesture(deltaX, deltaY);
        },

        getNextPanelStartOffset: function() {
            return this.isCenterAligned ? 1 : this.panelsToShow;
        },
        getPrevPanelStartOffset: function(movedCount) {
            return -movedCount;
        },
        getChangedDataStartIndex: function(type, movedCount) {
            var changedPanelStartOffset = type === exports.NEXT ?
                this.getNextPanelStartOffset() : this.getPrevPanelStartOffset(movedCount);
            return this.datasource.getIndexByOffset(changedPanelStartOffset);
        },
        createAnimationStatus: function(type, datalist) {
            var movedCount = 0;
            for(var i=0,len=datalist.length;i<len;i+=1) {
                if(datalist[i] !== exports.EMPTY) {
                    movedCount += 1;
                }
            }

            var isNext = (type === exports.NEXT);
            return {
                type: (movedCount > 0) ? type : exports.CANCEL,
                movedOffset: (isNext ? 1 : -1) * movedCount,
                isLastData: isNext && (movedCount === 0)
            };
        },
        getAnimationStatus: function(type, movedCount, callback) {
            var self = this;
            var ds = this.datasource;

            if(type === exports.CANCEL) {
                var cancelStatus = this.createAnimationStatus(type, []);
                return callback(cancelStatus);
            }

            var changedLength = movedCount || this.panelsToSlide;
            //var checkingLastDataFlag = 1;
            var changedStartIndex = this.getChangedDataStartIndex(type, changedLength);
            //var changedLength = _movedCount + checkingLastDataFlag;

            ds.queryDataList(changedStartIndex, changedLength, function _getChanged(datalist) {
                var status = self.createAnimationStatus(type, datalist);
                callback(status);
            });
        },

        onInitialize: function() {
            this.resetPanels();
        },
        onMoveSlide: function(deltaX, deltaY) {
            var position = this.animator.getPositionByGesture(deltaX, deltaY);
            this.animator.moveSlidePosition(position);
        },
        onAnimateSlide: function(type, movedCount, option) {
            var self = this;
            var _option = option || {};
            this.getAnimationStatus(type, movedCount, function(status) {
                if(typeof _option.onStart === 'function') {
                    _option.onStart(status.type);
                }

                if(self.isAutoAligned) {
                    var alignedType = status.isLastData ? exports.RIGHT : exports.LEFT;
                    self.animator.setAlignedType(alignedType);
                }

                self.animator.animateSlideByOffset(status.movedOffset, function _animateComplete() {
                    self.onAnimateComplete(status, _option);
                });
            });
        },
        onAnimateComplete: function(status, option) {
            this.arrangePanels(status.movedOffset);
            this.updater.updatePanelsByOffset(status.movedOffset, function _updateComplete() {
                if(typeof option.onComplete === 'function') {
                    option.onComplete(status.type);
                }
            });
        },

        arrangePanels: function(movedOffset) {
            var container = this.container;
            var isNext = movedOffset > 0;
            var targetIndex = isNext ? 0 : container.panels.length - 1;
            var beforeIndex = isNext ? exports.EMPTY : 0;

            this.animator.arrangePanelPosition(movedOffset);
            for(var i=0,len=Math.abs(movedOffset);i<len;i+=1) {
                container.arrangePanel(targetIndex, beforeIndex);
            }
        },

        isOverThreshold: function(deltaX, deltaY) {
            return this.threshold < Math.abs(deltaX);
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));

(function(exports) {
    exports.SimpleController = exports.BasicController.extend({
        createPanelsConfig: function() {
            var panelsLength = this.panelsToShow;
            this.basePanelIndex = this.isCenterAligned ?
                Math.floor(panelsLength/2) : 0;

            var panelsConfig = [];
            for(var i=0;i<panelsLength;i+=1) {
                panelsConfig.push({
                    accessibility: false
                });
            }

            return panelsConfig;
        },
        onMoveSlide: function(x, y) {

        },
        onAnimateSlide: function(type, movedCount, option) {
            var self = this;
            var _option = option || {};
            this.getAnimationStatus(type, movedCount, function(status) {
                if(typeof _option.onStart === 'function') {
                    _option.onStart(status.type);
                }

                self.onAnimateComplete(status, _option);
            });
        },
        onAnimateComplete: function(status, option) {
            var ds = this.datasource;
            ds.setIndexByOffset(status.movedOffset);
            this.updater.updateAll();

            if(typeof option.onComplete === 'function') {
                option.onComplete(status.type);
            }
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));

(function(exports) {
    exports.BasicUpdater = Class.extend({
        init: function(slide, controller) {
            this.slide = slide;
            this.controller = controller;
            this.datasource = controller.datasource;
            this.container = controller.container;
        },

        updateAll: function(callback) {
            var ds = this.datasource;
            var controller = this.controller;
            var container = this.container;
            var firstDataIndex = ds.index - controller.basePanelIndex;

            ds.queryDataList(firstDataIndex, container.panels.length, function(datalist) {
                container.updateAll(datalist);
                if(typeof callback === 'function') {
                    callback(datalist);
                }
            });
        },
        updatePanelsByOffset: function(movedOffset, callback) {
            var self = this;
            var ds = this.datasource;

            ds.setIndexByOffset(movedOffset);

            var firstPanelIndex = (movedOffset < 0) ?
                0 : (this.container.panels.length - movedOffset);
            var firstPanelOffset = firstPanelIndex - this.controller.basePanelIndex;
            var firstDataIndex = ds.getIndexByOffset(firstPanelOffset);
            ds.queryDataList(firstDataIndex, Math.abs(movedOffset), function(datalist) {
                self.updatePanels(firstPanelIndex, datalist);
                if(typeof callback === 'function') {
                    callback(datalist);
                }
            });
        },
        updatePanels: function(startIndex, datalist) {
            for(var i=0,len=datalist.length;i<len;i+=1) {
                this.container.updatePanel(startIndex + i, datalist[i]);
            }
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));
(function(exports) {
    var MESSAGE = 'require is not defined: ';
    exports.BasicDelegate = Class.extend({
        getPositionByOffset: function(movedOffset) {
            throw MESSAGE + 'getPositionByOffset';
        },
        getPositionByGesture: function(deltaX, deltaY) {
            throw MESSAGE + 'getPositionByGesture';
        },
        movePanelPosition: function (panelIndex, position) {
            throw MESSAGE + 'movePanelPosition';
        },
        moveSlidePosition: function (position) {
            throw MESSAGE + 'moveSlidePosition';
        },
        updateBasePosition: function(movedOffset) {
            throw MESSAGE + 'updateBasePosition';
        }
    });

}(window.slide = (typeof slide === 'undefined') ? {} : slide));
(function(exports) {
    'use strict';

    exports.BasicAnimator = Class.extend({
        init: function(slide, controller, duration) {
            this.slide = slide;
            this.controller = controller;
            this.container = controller.container;

            this.basePosition = {};

            this.duration = duration;
            this.aligned = 0;
            this.timeId = 0;
            this.slideTimeId = 0;

            this.bindTransitionEvent();
        },
        bindTransitionEvent: function () {
            var self = this;
            exports.util.on(this.container.el, 'webkitTransitionEnd', function() {
                self.timeId = window.setTimeout(function _forceComplete(){
                    self.animateComplete(self.slideTimeId);
                }, 50);
            });
        },
        setTransitionDuration: function(duration) {
            this.container.setTransitionDuration(duration + 'ms');
        },
        setDefaultSlidePosition: function() {
            var controller = this.controller;
            var panelsLength = this.container.panels.length;
            var basePanelIndex = controller.basePanelIndex;
            var alignedType = controller.isCenterAligned ? exports.CENTER : exports.LEFT;

            this.basePosition = this.getPositionByGesture(0, 0);
            this.setAlignedType(alignedType);

            for(var i=0,len=panelsLength; i<len; i++) {
                this.movePanelByOffset(i, i-basePanelIndex);
            }

            var position = this.getPositionByGesture(0, 0);
            this.moveSlidePosition(position);
        },
        setAlignedType: function(type) {
            var ct = this.controller;
            switch(type) {
                case exports.CENTER:
                    this.aligned =  (ct.frameWidth - ct.panelWidth)/2;
                    break;

                case exports.RIGHT:
                    this.aligned = ct.frameWidth - (ct.panelWidth * ct.panelsToShow);
                    break;

                case exports.LEFT:
                default:
                    this.aligned = 0;
            }
        },

        getPositionByOffset: function(movedOffset) {
            return {
                x: movedOffset * this.controller.panelWidth,
                y: 0
            };
        },
        getPositionByGesture: function(deltaX, deltaY) {
            var gestureRatio = this.controller.gestureRatio;
            return {
                x: deltaX * gestureRatio,
                y: 0
            };
        },
        getMovedCountByGesture: function(deltaX, deltaY) {
            var position = this.getPositionByGesture(deltaX, deltaY);
            return position.x ?
                Math.ceil(Math.abs(position.x)/this.controller.panelWidth) : 1;
        },
        arrangePanelPosition: function(movedOffset) {
            var isNext = movedOffset > 0;
            var panelsLength = this.container.panels.length;
            var basePanelIndex = this.controller.basePanelIndex;
            var targetIndex = isNext ? 0 : (panelsLength + movedOffset);
            var targetOffset = (isNext ? (panelsLength - movedOffset) : 0) - basePanelIndex;

            this.updateBasePosition(movedOffset);
            for(var i=0,len=Math.abs(movedOffset);i<len;i+=1) {
                this.movePanelByOffset(targetIndex + i, targetOffset + i);
            }
        },
        updateBasePosition: function(movedOffset) {
            var position = this.getPositionByOffset(movedOffset);
            this.basePosition.x -= position.x;
        },
        movePanelPosition: function  (panelIndex, position) {
            var panel = this.container.getPanel(panelIndex);
            var _x = position.x - this.basePosition.x;
            panel.setLeft(_x + 'px');
        },
        moveSlidePosition: function (position) {
            var _x = position.x + this.basePosition.x + this.aligned;
            this.container.setLeft(_x + 'px');
        },
        movePanelByOffset: function (panelIndex, offset) {
            var pos = this.getPositionByOffset(offset);
            this.movePanelPosition(panelIndex, pos);
        },
        animateSlideByOffset: function(movedOffset, callback) {
            var self = this;
            var position = this.getPositionByOffset(-movedOffset);
            this.animateSlidePosition(position, function _animateComplete() {
                if(typeof callback === 'function') {
                    callback();
                }
            });
        },
        animateSlidePosition: function(position, callback) {
            this.callback = callback;
            this.setTransitionDuration(this.duration);
            this.moveSlidePosition(position);

            var self = this;
            this.slideTimeId = window.setTimeout(function _transitionEnd (){
                self.animateComplete(self.timeId);
            }, this.duration + 30);
        },
        animateComplete: function(clearTimeId) {
            window.clearTimeout(clearTimeId);
            var _callback = this.callback;
            this.callback = null;

            this.setTransitionDuration(0);
            if(typeof _callback === 'function') {
                _callback();
            }
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));
(function(exports) {
    'use strict';

    var intervalDelay = 1000/60;

    exports.JSAnimator = exports.BasicAnimator.extend({
        bindTransitionEvent: function () {
        },
        setTransitionDuration: function(duration) {
        },
        moveSlidePosition: function(position) {
            this.prevPosition = position;
            this._super(position);
        },
        animateSlidePosition: function(position, callback) {
            this.startPoint = this.prevPosition.x;
            this.endPoint = position.x;
            this.distance = this.endPoint - this.startPoint;
            this.startTime = new Date().getTime();
            this.endTime = this.startTime + this.duration;
            this.callback = callback;

            var self = this;
            this.timeId = window.setInterval(function () {
                self._step();
            }, intervalDelay);
        },
        _step: function(){
            var currentTime = new Date().getTime();

            if (currentTime < this.endTime) {
                this.moveSlidePosition({
                    x: this._getCurrentPoint(currentTime - this.startTime)
                });

            } else {
                this.moveSlidePosition({
                    x: this.endPoint
                });
                this.animateComplete(this.timeId);
            }
        },
        _getCurrentPoint: function (elapsedTime) {
            var movePoint = this._cosInOut(this.distance, elapsedTime, this.duration);
            return this.startPoint + movePoint;
        },
        /**********************************************
         *
         * 삼각함수를 이용한 cubiq bezier (ease) 함수 흉내 [ y = (-cosX + 1) / 2 ]
         *  y = (-cos(X) + 1) * distance / 2
         *  X = PI * elapsedTime / duration
         *
         **********************************************/
        _cosInOut: function (distance, elapsedTime, duration) {
            var X = Math.PI * elapsedTime / duration;
            var movePoint = (-Math.cos(X) + 1) * distance/2;

            return movePoint;
        },
        /**********************************************
         *
         * 삼각함수를 이용한 cubiq bezier (ease) 함수 흉내 [ y = (sin(X - pi/2) + 1)/2 ]
         *  y = (sin(X - pi/2) + 1) * diatance/2
         *  X = PI * elapsedTime / duration
         *
         **********************************************/
        _sinInOut: function (distance, elapsedTime, duration) {
            var X = Math.PI * elapsedTime / duration;
            var movePoint = (Math.sin(X - Math.PI/2) + 1) * distance/2;

            return movePoint;
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));
(function(exports) {
    'use strict';

    exports.TransformAnimator = exports.BasicAnimator.extend({
        movePanelPosition: function (panelIndex, position) {
            var panel = this.container.getPanel(panelIndex);
            var _x = position.x - this.basePosition.x;

            panel.setTransform('translate3d(' + _x + 'px, 0, 0)');
        },
        moveSlidePosition: function (position) {
            var _x = position.x + this.basePosition.x + this.aligned;
            this.container.setTransform('translate3d(' + _x + 'px, 0, 0)');
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));
(function(exports) {
    'use strict';

    var SLIDE_RESIZE_DELAY_TIME = 200; //200ms

    exports.Screen = Class.extend({
        init: function(el) {
            this.el = el;

            this.width = el.clientWidth;
            this.height = el.clientHeight;

            this.bindEvents();
        },
        bindEvents: function () {
            this.bindResize();

            /**
             * ios webapp : 다른 탭에서 orientation 발생시 제대로 사이즈 체크 안되는 버그가 존재.
             *              현재 탭으로 복귀시 발생하는 visivlityChange 이벤트 발생(ios7 이상)시 강제로 리사이즈 체크.
             */
            if (exports.config.isBindingVisibilityChange) {
                this.bindVisibilityChange();
            }
        },
        bindResize: function() {
            var self = this;
            this.resizeTimeId = null;
            exports.util.on(window, 'resize', function () {
                window.clearTimeout(self.resizeTimeId);
                self.resizeTimeId = window.setTimeout(function () {
                    self.checkAndResizeSlideFrame();
                }, SLIDE_RESIZE_DELAY_TIME);
            });
        },
        /**
         * slide 에 visibilitychange event를 bind 시킨다.
         *
         * @method onVisibilityChange
         */
        bindVisibilityChange: function () {
            var hidden, visibilityChange;
            if (typeof document.hidden !== "undefined") {
                hidden = "hidden";
                visibilityChange = "visibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
            }

            var self = this;
            exports.util.on(document, visibilityChange, function handleVisibilityChange() {
                if (!document[hidden]) {
                    self.checkAndResizeSlideFrame();
                }
            });
        },
        /**
         * slide Frame 의 사이즈를 확인해서 변경시에는 리사이즈 시킨다.
         *
         * @method checkAndResizeSlideFrame
         */
        checkAndResizeSlideFrame: function () {
            var width = this.el.clientWidth;
            var height = this.el.clientHeight;
            if(this.isChangedSize(width, height)) {
                this.resize(width, height);
            }
        },
        /**
         * slide Frame 의 사이즈가 변경되었는지 확인한다.
         *
         * @method isChangedSize
         * @return {Boolean} 사이즈 변경시 true, 사이즈 미변경시 false.
         */
        isChangedSize: function (width, height) {
            return !(this.width === width && this.height === height);
        },
        /**
         * 변경된 wrapper, slide, panels의 size 와 offset을 다시 설정한다.
         *
         * @method resize
         * @param width {Number} frame element의 실제 width 크기
         * @param height {Number} frame element의 height 실제크기
         */
        resize: function (width, height) {
            var pageWidth = width || this.el.clientWidth;
            var pageHeight = height || this.el.clientHeight;

            this.setWrapperSize(pageWidth, pageHeight);
            this.onResizeDelegate(pageWidth, pageHeight);

        },
        setWrapperSize: function (width, height) {
            this.width = width;
            this.height = height;
        },
        onResizeDelegate: function (width, height) {
        },
        onResize: function (delegate) {
            this.onResizeDelegate = delegate;
        }
    });
}(window.slide = (typeof slide === 'undefined') ? {} : slide));
/*jshint browser: true
*/
/*global slide:true, Class: true, gesture: true*/
(function (exports) {
    'use strict';

    var GESTURE_THRESHOLD = 10;
    var toNumber = exports.util.toNumber;

    exports.Slide = exports.Observable.extend({
        init: function (frameEl, dataSource, option) {
            this.screen = null;
            this.controller = null;

            this._createScreen(frameEl);

            var _option = option || {};

            this.frameEl = frameEl;
            this.isInTransition = false;
            if (!_option.disableOverflow) {
                this.setOverflowHidden();
            }

            this._createController(dataSource, _option);
            this._bindResizeEvent(_option);
            this._bindGestureEvent(_option);

            this._start();
        },
        _createScreen: function(frameEl) {
            this.screen = new exports.Screen(frameEl);
        },
        _createController: function(datasource, option) {
            this.controller = new exports.Controller(this, datasource, option);
        },
        _bindResizeEvent: function (option) {
            var self = this;
            var controller = this.controller;
            this.screen.onResize(function (width, height) {
                controller.frameWidth = width;
                controller.frameHeight = height;
                controller.resize(width, height);
                self.emit('resize', width, height);
            });
        },
        _bindGestureEvent: function (option) {
            var threshold = toNumber(option.gestureThreshold, GESTURE_THRESHOLD);
            var listener = this.listener = new gesture.Listener(this.frameEl, {
                threshold: threshold
            });

            var self = this;
            listener.on('start', function(session) {
                self.emit('startDrag', session);
            });
            listener.on('swipe', function(session) {
                exports.util.preventDefault(session.targetEvent);
                self.onSwipe(session);
                self.emit('drag', session);
            });
            listener.on('left', function(session) {
                self.onLeft(session);
            });
            listener.on('right', function(session) {
                self.onRight(session);
            });
            listener.on('end', function(session) {
                self.emit('endDrag', session);
            });
            listener.on('tab', function(session) {
                self.emit('click', session);
            });
        },
        _start: function() {
            this.controller.onInitialize();
        },
        _slide: function(type, movedCount) {
            var self = this;
            this.controller.onAnimateSlide(type, movedCount, {
                onStart: function(type) {
                    self._onBeforeSlide(type);
                },
                onComplete: function(type) {
                    self._onAfterSlide(type);
                }
            });
        },
        _onBeforeSlide: function (type) {
            this.isInTransition = true;
            this.listener.stop();
            this.emit(['slide:before', type + ':before'], type);
        },
        _onAfterSlide: function (type) {
            this.isInTransition = false;
            this.listener.start();
            this.emit(['slide:after', type], type);
        },
        _getTypeByMovedOffset: function(movedOffset) {
            if(movedOffset > 0) { return exports.NEXT; }
            else if(movedOffset < 0) { return exports.PREV; }
            return exports.CANCEL;
        },

        onSwipe: function(session) {
            var delta = session.delta;
            this.controller.onMoveSlide(delta.x, delta.y);
        },
        onLeft: function(session) {
            var delta = session.delta;
            var movedCount = this.controller.getMovedCountByGesture(delta.x, delta.y);
            var type = (movedCount > 0) ? exports.NEXT : exports.CANCEL;
            this._slide(type, movedCount);
        },
        onRight: function(session) {
            var delta = session.delta;
            var movedCount = this.controller.getMovedCountByGesture(delta.x, delta.y);
            var type = (movedCount > 0) ? exports.PREV : exports.CANCEL;
            this._slide(type, movedCount);
        },

        next: function (movedCount) {
            this._slide(exports.NEXT, movedCount);
        },
        prev: function (movedCount) {
            this._slide(exports.PREV, movedCount);
        },
        cancel: function () {
            this._slide(exports.CANCEL);
        },
        refresh: function  () {
            this.controller.refresh();
        },
        setOverflowHidden: function () {
            this.frameEl.style.overflow = 'hidden';
        },
        destroy: function () {
            this.frameEl.innerHTML = '';
            this.frameEl = null;
        },
        getDataSource: function() {
            return this.controller.datasource;
        },
        setDataSource: function(datasource) {
            this.controller.datasource = datasource;
            this.refresh();
        }
    });
})(window.slide = (typeof slide === 'undefined') ? {} : slide);

/*jshint browser: true
*/
/*global slide:true, Class, gesture, clay, util, dongtl*/

(function(exports){
    'use strict';

    var config = exports.config;
    exports.Controller = (function() {
        if (config.mode === exports.MODE_SIMPLE) {
            return exports.SimpleController;
        }

        return exports.BasicController;
    }());

    exports.Animator = (function() {
        if (config.mode === exports.MODE_SIMPLE) {
            return exports.BasicAnimator;

        } else if (config.mode === exports.MODE_INTERVAL) {
            return exports.JSAnimator;
        }

        return exports.TransformAnimator;
    }());

    exports.Updater = exports.BasicUpdater;
}(window.slide = (typeof slide === 'undefined') ? {} : slide));