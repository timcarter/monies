/***
 *	monies.js -- for looking at baby monies
 ***/

$(function() {

	var Monies = $.Monies = {};

	Monies.Quote = Backbone.Model.extend({
/*		defaults: function() {
			return {
				symbol:'TIM',
				fullName:'Timco. Inc.',
				price:'1,000,000',
				deltaPrice:'1.00',
				deltaPercent:'100',
				deltaDirection:'up',
				volume:'1,000,000',
				avgVolume:'10,000,000',
				time:'Jun 9, 5:00PM EDT',
				yearHigh:'2,000,000',
				yearLow:'0.00',
				spread:'0.01',
				url:'http://finance.yahoo.com?q=tim'
			}
		},*/

		sync: function() {
			var model = this;
			$.ajax({
				url:'/quote/' + model.get('symbol')
			}).done(function(result) {
				model.set(result[0]);
			}).fail(function() {
				console.log('there was an error')
			});
		}
	});

	Monies.QuotesList = Backbone.Collection.extend({
		model: Monies.Quote
	});

	// a view consisting of three frames
	Monies.QuoteScreen = Backbone.View.extend({
		el:$('#quoteScreen'),

		template:Mustache.compile($('#screenTemplate').html()),

		initialize:function() {

			this.currIndex = 0;
			this.playing = true;
			this.duration = 5000;
			this.syncDuration = 10000;
			this.currDirection;
		},

		render:function() {
			var thisView = this;

			if (this.playing) {
				var currModel = this.collection.at(this.currIndex),
					currModelDirection = currModel.get('deltaDirection'),
					directionToUse = this.currDirection || currModelDirection;

				this.$el.parent().css('backgroundColor', directionToUse === 'up' ? '#27ae60' : directionToUse === 'down' ? '#e74c3c' : '#2c3e50');
				this.currDirection = currModelDirection;

				this.$el.fadeOut(400, function() {
					thisView.$el.html(thisView.template(currModel.attributes));
					thisView.$el.fadeIn();
				});

				this.currIndex = (this.currIndex + 1) % this.collection.length;
			}

			setTimeout(function() {thisView.render()}, this.duration);
//			setTimeout(function() {
//				thisView.collection.forEach(function(elem) {elem.sync()})
//			}, this.syncDuration);

			return this;
		},

		togglePlaying : function() {
			this.playing = !this.playing
		}
	});

	// the list of quotes
	Monies.QuoteListing = Backbone.View.extend({

	});

});
