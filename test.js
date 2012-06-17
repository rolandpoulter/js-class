module.exports = require('spc').describe('class', function () {
	var clss = require('./class');

	before(function () {
		should();
	});

	describe('#create', function () {
		beforeEach(function () {
			var that = this;

			this.initMethod = sinon.spy();

			this.block = sinon.spy(function (def, proto) {
				def.init = that.initMethod;
			});

			this.subject = clss('TestClass', this.block);
		});

		it('should call the block', function () {
			this.block.called.should.be.ok;
		});
	});
});

require('spc/reporter/dot')(module.exports);