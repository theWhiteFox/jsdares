/*jshint node:true jquery:true*/
"use strict";

module.exports = function(dares) {
	dares.ConsoleMatchDare = function() { return this.init.apply(this, arguments); };

	dares.ConsoleMatchDare.prototype = dares.addCommonDareMethods({
		init: function(options, ui) {
			this.loadOptions(options, ui);
			this.outputs = ['console'];
			this.original = options.original;
			this.previewAnim = null;
			this.animation = null;
		},

		setPreview: function($preview) {
			this.removePreviewAnim();

			var $console = $('<div class="dares-consolematch-console"></div>');
			var $container = $('<div class="dares-table-preview-console-container"></div>');
			$container.append($console);
			$preview.html($container);
			$preview.append(this.description);
			$preview.append('<div class="dares-table-preview-points-container"><span class="dares-table-preview-points">var points = numMatchingChars - ' + this.linePenalty + '*numLines;</span></div>');

			$preview.append(this.makePreviewButton());

			this.previewAnim = new dares.AnimatedConsole($console);
			this.original(this.previewAnim);
			this.previewAnim.run(this.speed);
		},

		removePreviewAnim: function() {
			if (this.previewAnim !== null) {
				this.previewAnim.remove();
			}
		},

		makeActive: function($div, ui) {
			this.loadEditor(ui);

			this.$div = $div;
			$div.addClass('consolematchdare');
			this.console = this.ui.addConsole();

			this.$description = $('<div class="dare-description"></div>');
			this.$div.append(this.$description);

			this.$originalConsoleContainer = $('<div class="consolematchdare-original-container"><div class="consolematchdare-original-refresh"><i class="icon-repeat icon-white"></i></div></div>');
			this.$originalConsoleContainer.on('click', $.proxy(this.animateConsole, this));
			this.$description.append(this.$originalConsoleContainer);
			this.$originalConsole = $('<div class="consolematchdare-original-console"></div>');
			this.$originalConsoleContainer.append(this.$originalConsole);

			this.$description.append('<h2>' + this.name + '</h2><div class="dare-text">' + this.description + '</div>');

			this.$submit = $('<div class="btn btn-success">Submit</div>');
			this.$submit.on('click', $.proxy(this.submit, this));
			this.$description.append(this.$submit);

			this.originalAnim = new dares.AnimatedConsole(this.$originalConsole);
			this.original(this.originalAnim);

			var $points = $('<div></div>');
			this.$div.append($points);
			this.animatedPoints = new dares.AnimatedPoints($points);
			this.animatedPoints.addFactor('numMatchingChars', 1);
			this.animatedPoints.addFactor('numLines', -this.linePenalty);
			this.animatedPoints.setThreshold(this.threshold);
			this.animatedPoints.finish();

			this.$score = $('<div class="dare-score"></div>');
			this.$div.append(this.$score);
			this.drawScore();

			this.animateConsole();
		},

		remove: function() {
			this.animationFinish();
			this.$submit.remove();
			this.$originalConsoleContainer.remove();
			this.$div.html('');
			this.$div.removeClass('consolematchdare');
		},

		animateConsole: function() {
			this.animationFinish();
			this.drawConsole(this.speed);
		},

		drawConsole: function(speed) {
			this.originalAnim.run(speed);
		},

		submit: function() {
			this.animationFinish();
			this.animatedPoints.show();

			var userImageData = this.canvas.getImageData();
			var resultImageData = this.resultContext.createImageData(this.size, this.size);
			this.pointsPerLine = [];

			var i=0, points = 0;
			for (var y=0; y<this.size; y++) {
				var linePoints = 0;
				for (var x=0; x<this.size; x++) {
					var dr = userImageData.data[i] - this.imageData.data[i++];
					var dg = userImageData.data[i] - this.imageData.data[i++];
					var db = userImageData.data[i] - this.imageData.data[i++];
					var da = userImageData.data[i] - this.imageData.data[i++];
					var distance = dr*dr + dg*dg + db*db + da*da;

					resultImageData.data[i-1] = 140; // alpha
					if (distance < 20) {
						points++;
						linePoints++;
						resultImageData.data[i-3] = 255; // green
					} else {
						resultImageData.data[i-4] = 255; // red
					}
				}
				this.pointsPerLine.push(linePoints);
			}

			this.resultContext.clearRect(0, 0, this.size, this.size);
			this.resultContext.putImageData(resultImageData, 0, 0);

			this.animation = new dares.SegmentedAnimation();
			this.animation.addSegment(this.size/10, 50, $.proxy(this.animationMatchingCallback, this));
			this.animationMatchingNumber = 0;
			this.updateScoreAndAnimationWithLines(points);
			this.animation.addSegment(1, 50, $.proxy(this.animationFinish, this));
			this.animation.run();
		},

		animationMatchingCallback: function(y) {
			y *= 10;
			if (y === 0) {
				this.drawImage(0);
				this.animatedPoints.setChanging('numMatchingPixels');
			}
			for (var i=0; i<10; i++) {
				this.animationMatchingNumber += this.pointsPerLine[y+i];
			}
			this.animatedPoints.setValue('numMatchingPixels', this.animationMatchingNumber);
			this.originalContext.drawImage(this.$resultCanvas[0], 0, y, this.size, 10, 0, y, this.size, 10);
		}
	});
};