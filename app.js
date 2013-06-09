
/**
 * Module dependencies.
 */

var express = require('express'),
	fs = require('fs'),
	http = require('http'),
	jsdom = require('jsdom'),
	mu2 = require('mu2'),
	util = require('util')
;

	getStatic = function(path) {
		var contentType = 'text/plain',
			fourPath = path.substring(path.length - 4);

		if (fourPath === 'html') {
			contentType = 'text/html'
		} else if (fourPath === 'json') {
			contentType = 'application/json'
		} else if (path.substring(path.length - 2) === 'js') {
			contentType = 'application/javascript';
		} else if (path.substring(path.length - 3) === 'css') {
			contentType = 'text/css';
		}

		return function(req, res) {
			fs.readFile(path, {encoding:'utf8'}, function(err, data) {
				// TODO: handle error state
				res.setHeader('Content-Type', contentType);
				res.setHeader('Content-Length', data.length);
				res.end(data);
			})
		}
	},

	// NOTE: third party access -- right now we fetch stock information from
	// the Yahoo! Finance API.
	getStockInformation = function(symbol, callback) {
		var url = 'http://finance.yahoo.com/q?s=' + symbol;

		jsdom.env({
			html:url,
			scripts:['http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js'],
			done:function(err, window) {
				var $ = window.$,
					lower = symbol.toLowerCase(),
					price, deltaPrice, deltaPercent, deltaDirection, volume, avgVolume, time, yearHigh, yearLow, fullName
				;

				// try to get the price
				price = $('#yfs_l84_' + lower).html() || $('#yfs_l10_' + lower).html();
				deltaPrice = $('#yfs_c63_' + lower).first().text() || $('#yfs_c10_' + lower).first().text();
				deltaPercent = $('#yfs_p43_' + lower).first().html() || $('#yfs_p20_' + lower).first().html();
				deltaDirection = $('#yfs_c63_' + lower + ' img').attr('alt') || $('#yfs_c10_' + lower + ' img').attr('alt') || '',
				volume = $('#yfs_v53_' + lower).first().html() || 'N/A';
				avgVolume = $('#table2 tr:nth-child(4) > td').first().html() || 0;
				time = $('#yfs_t53_' + lower).first().html() || $('#yfs_t10_' + lower + ' span').first().html();
				yearHigh = $('#table2 tr:nth-child(2) span:nth-child(2)').html() || 'N/A';
				yearLow = $('#table2 tr:nth-child(2) span:nth-child(1)').html() || 'N/A';
				fullName = $('.title>h2').first().html();

				callback({
					symbol:symbol.toUpperCase(),
					price:price,
					deltaPrice:deltaPrice.trim(),
					deltaPercent:deltaPercent.trim(),
					deltaDirection:deltaDirection.toLowerCase(),
					volume:volume,
					avgVolume:avgVolume,
					time:time,
					yearHigh:yearHigh,
					yearLow:yearLow,
					fullName:fullName,
					spread:'implement this'
				});
			}
		});
	},

	app = express();

// all environments
app.set('port', process.env.PORT || 3000);

app.get('/', getStatic('test.html'));

app.get('/view/:symbol', function(req, res) {
	getStockInformation(req.params.symbol, function(quote) {
		var markup = '', volume = +quote.volume, avgVolume = +quote.avgVolume;

		if (quote.deltaDirection === 'up') {
			quote.deltaPrice = '+' + quote.deltaPrice;
			quote.deltaPercent = quote.deltaPercent[0] + '+' + quote.deltaPercent.substring(1);
		} else if (quote.deltaDirection === 'down') {
			quote.deltaPrice = '-' + quote.deltaPrice;
			quote.deltaPercent = quote.deltaPercent[0] + '-' + quote.deltaPercent.substring(1);
		}

		// 390 minutes in a trading day, try to figure out the average volume


		mu2.compileAndRender('symbol.tmpl', quote).on('data', function(chunk) {
			markup += chunk;
		}).on('end', function(){
			res.setHeader('Content-Type', 'text/html');
			res.setHeader('Content-Length', markup.length);
			res.end(markup);
		});
	})
});

app.get('/quote/:symbols', function(req, res) {
	var symbols = req.params.symbols.split(','),
		symbolsLength = symbols.length,
		data = [];

	symbols.forEach(function(elem, arr, idx) {
		getStockInformation(elem, function(quote) {
			data.push(quote);

			if (data.length === symbolsLength) {
				var returnString = JSON.stringify(data);
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', returnString.length);
				res.end(returnString);
			}
		});
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
