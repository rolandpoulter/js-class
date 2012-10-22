function namedFunction (name, src, args) {
	return (('indirect', eval)('(function ' + (name || '') + ' (' + (args || '') + ') {' + src + '})'));
}

"use strict";

var clss = Clss;

module.exports = clss;


var util = clss.util = (function () {
	var toString = Object.prototype.toString;

	return {
		isFunction: function (obj) {return toString.call(obj) === '[object Function]';},
		isArray: Array.isArray || function (obj) {return toString.call(obj) === '[object Array]';},

		newObject: Object.create || function (obj) {X.prototype = obj; return new X(); function X () {}},

		namedFunction: namedFunction,
		createInstance: createInstance,

		clssDerived: function (obj, inst) {var name;
			return obj && (obj.constructor === (inst || clss) ||
				(inst && inst.prototype[(name = util.initName(inst))] === obj[name]));
		},

		initName: function (inst) {return 'init' + (inst.name || inst);},

		newInit: function (suprN) {
			return suprN ?
				function () {return this[suprN].apply(this, arguments);} :
				function () {return this;};
		},

		assign: function (target, obj) {
			for (var p in obj) if (p !== 'constructor' && obj.hasOwnProperty(p)) target[p] = obj[p];
		}
	};
})();

var slice = Array.prototype.slice;


function Clss (name) {
	name = name && name.name || name;
	if (typeof name !== 'string') throw new Error('clss: Invalid class name.');

	name = name.replace(/[^A-Za-z0-9$_]/g, '_');

	var src = 'return this.' + util.initName(name) + '.apply(this, arguments);',
	    supr = util.isFunction(this) ? this : null,
	    inst = util.namedFunction(name, src);

	if (!inst.name) inst.name = name;

	return clss.construct(inst, supr, slice.call(arguments));
}


((clss.construct = function (inst, supr, defs) {
	if (!util.isFunction(inst)) throw new Error('clss.construct: Invalid instace function.');

	var _ = inst._ = function () {return this;},
	    suprP = supr && supr.prototype,
	    proto = inst.prototype = _.prototype = suprP ? util.newObject(suprP) : {};

	inst.definitions = [].concat(defs);
	proto.constructor = inst;

	if (inst !== clss) {
		inst.constructor = clss;
		util.createInstance(clss, inst, {});
	}

	if (supr) {
		inst.supr = supr;

		if (util.clssDerived(supr)) {
			util.createInstance(supr, inst, {}, supr.supr && supr.supr.prototype);
		}
	}

	util.createInstance(inst, inst, proto, suprP);
	return inst;
})


(clss, Function, [function () {
	this.clss = clss;

	this.derived = function (obj) {
		return util.clssDerived(obj, this);
	}

	this.create = function (obj, args) {
		if (this === clss) return clss.apply(null, arguments);

		if (!obj && this._) obj = new (this._)();

		else {
			obj = obj || {};
			util.createInstance(this, {}, obj, this.supr && this.supr.prototype);
		}

		return args ?
			obj[util.initName(this)].apply(obj, util.isArray(args) ? args : [args]) :
			obj;
	};


	this.include = function () {
		this.definitions.concat(slice.call(arguments));
		return this;
	};


	this.toString = function () {return this.name;};


	this.reconstruct = function () {
		clss.construct(this, this.name, this.supr, this.definitions);
		return this;
	}
}]));


function createInstance (ctor, self, obj, supr) {
	obj = obj || new (ctor._)();

	var proto = ctor.prototype,
	    initN = util.initName(ctor.name),
	    args = [obj, proto, initN],
	    defs = ctor.definitions,
	    init = proto[initN],
	    i;

	if (supr) {
		args.splice(1, 0, supr);

		if (util.clssDerived(ctor.supr) && !ctor.supr.derived(obj)) ctor.supr.create(obj);

		else if (!(obj instanceof ctor.supr)) util.assign(obj, supr);
	}

	if (defs.length) {
		for (i = 0; i < defs.length; i += 1) {
			if (util.isFunction(defs[i])) {
				if (util.clssDerived(defs[i])) {
					if (!util.clssDerived(obj, defs[i])) defs[i].create(obj);

				} else defs[i].apply(self, args);

			} else if (typeof defs[i] === 'object') {
				util.assign(obj, defs[i]);
			}
		}

		if (!obj[initN] && obj.init) {
			obj[initN] = obj.init;
			delete obj.init;
		}
	}

	if (init) obj[initN] = init;

	else if (!obj[initN]) {
		obj[initN] = util.newInit(util.clssDerived(ctor.supr) && 'init' + ctor.supr.name);
	}
}
