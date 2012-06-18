/*jslint smarttabs:true*/

function namedFunc (_name, _src) {
	var _exec = eval;

	return _exec('(function ' + _name + '(){' + _src + '})');
}

"use strict";

var slice = Array.prototype.slice;

var util = {
	new_: function (obj) {
		if (Object.create) return Object.create(obj);

		function X () {} X.prototype = obj; return new X();
	},

	isFunc: function (func) {
		return typeof func === 'function';
	},

	isArray: Array.isArray || function (array) {
		return array instanceof Array;
	},

	namedFunc: namedFunc,

	includer: includer,

	newClss: newClss,
	newInit: newInit
};

clss.util = util;

clss.toString = toString;

clss.create = clss.clss = clss;

clss.derived = derived;

module.exports = clss;

function clss (name, main, supr) {
	main = main || name;

	if (!util.isFunc(main)) throw new Error('Invalid class: missing function.');

	if (typeof name !== 'string') {
		if (name && typeof name.name === 'string') name = name.name;

		else throw new Error('Invalid class: missing name.');

	} else name = name.replace(/[^A-Za-z0-9$_\-]/g, '_');

	var that = util.isFunc(this) ? this : null,
	    self = util.newClss(name),
	    initN = 'init' + name,
	    self_,
	    suprP,
	    proto,
	    include;

	supr = supr ? supr : (that !== clss ? that : null);

	if (util.isFunc(supr)) {
		suprP = supr.prototype;
		self.supr = supr;
	}

	self_ = self._ = function () {return this;};

	proto = self.prototype = self_.prototype = suprP ? util.new_(suprP) : {};

	proto.constructor = self.self = self;

	if (suprP) proto.supr = suprP;

	self.derived = function (obj) {
		return obj && proto[initN] && proto[initN] === obj[initN];
	};

	include = function () {
		util.includer(this.prototype, slice.call(arguments, 0));

		return this;
	};

	self.create = function (obj, args_) {
		if (!self.derived(obj)) {
			obj = obj || new self._();

			var initP = proto[initN],
			    args = [obj, proto, name, initN],
			    init;

			if (util.isFunc(supr)) args.splice(1, 0, suprP, supr);

			if (clss.derived(supr) && !supr.derived(obj)) supr.create(obj);

			if (util.isFunc(main)) {
				init = obj.init;

				this.include = function () {
					includer(obj, slice.call(arguments, 0));

					return this;
				};

				args.splice(args.length - 2, 0, init);
				main.apply(this, args);

				this.include = include;

				if (!obj[initN] && obj.init !== init) {
					obj[initN] = obj.init;

					if (init === undefined) delete obj.init;

					else obj.init = init;
				}
			}

			if (initP) obj[initN] = initP;

			else if (!obj[initN]) {
				obj[initN] = newInit(supr && 'init' + supr.name);
			}
		}

		return util.isArray(args_) ? obj[initN].apply(obj, args_) : (
			args_ === true ? obj[initN].call(obj) : obj);
	};

	self.include = include;

	self.clss = clss;

	self.create(proto);

	return self;
}

function toString () {
	return this.name;
}

function derived (klss) {
	return util.isFunc(klss) && klss.clss === clss;
}

function includer (obj, list) {
	list.forEach(function (clss) {
		clss.create(obj);
	});
}

function newClss (name) {
	var clss = namedFunc(name,
		'return this.init' + name + '.apply(this, arguments);');

	if (!clss.name) clss.name = name;

	clss.toString = toString;

	return clss;
}

function newInit (suprN) {
	return suprN ?
		function () {return this[suprN].apply(this, arguments);} :
		function () {return this;};
}
