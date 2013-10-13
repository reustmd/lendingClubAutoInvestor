var casper = require('casper').create();
var url = 'https://www.lendingclub.com/account/gotoLogin.action';

var username = '';
var password = '';

//BEGIN login
casper.start(url, function() {
	
	beginStep(this, 'login');

	this.waitUntilVisible('#email', function() {
		this.evaluate(function() {
			document.querySelector('#email').setAttribute('value', username);
			document.querySelector('#password').setAttribute('value', password);
			document.querySelector('form[action="/account/login.action"]').submit();
		});	

		casper.waitUntilVisible('#master_content');
	});
});
//END login

//BEGIN make sure we're starting from scratch
casper.thenOpen('https://www.lendingclub.com/portfolio/confirmStartNewPortfolio.action', function() {
	beginStep(this, "make sure we're starting from scratch");

	this.waitFor(function() {
		return this.evaluate(function() {
			return document.querySelector('#risk-strategy-buttons').style.opacity === "1";
		});
	});
	
});
//END make sure we're starting from scratch

//BEGIN check available cash
casper.then(function() {
	
	beginStep(this, 'check available cash');
	var availableCash = this.evaluate(function() {
		var formattedCashString = document.querySelector('#availableCash').innerHTML;
		var cashString = formattedCashString.replace('$', '').replace(',', '');

		return parseFloat(cashString);
	});

	this.echo('Available cash: ' + availableCash);

	if (availableCash < 25) {
		this.echo('Available cash too low, exiting...');
		this.exit();
	}
});
//END check available cash

//BEGIN open saved filter
casper.then(function() {

	beginStep(this, 'open saved filter');
	this.capture('before savedFiltersButton.png');
	this.click('#savedFiltersButton');

	this.waitFor(function() {
		return this.evaluate(function() {
			return document.querySelector('.savedCriteriaLoad').innerHTML === "Reust Standard";
		});
	}, function() {
		this.click('.savedCriteriaLoad');
		this.waitUntilVisible('.mask');
		this.waitWhileVisible('.mask');
		this.waitFor(function() {
			return this.evaluate(function() {
				return document.querySelector('#risk-strategy-buttons').style.opacity === "1";
			});
		});
	});

});
//END open saved filter

//BEGIN initialize order
casper.then(function() {
	beginStep(this, 'initialize order');
	this.click('#more-aggressive');

	waitUntilVisible(this, '#view-selected-portfolio-notes', function() {
		this.click('#view-selected-portfolio-notes');
	});
});
//END initialize order

//BEGIN if projected return high enough, continue order
casper.then(function() {
	beginStep(this, 'if projected return high enough, continue order');
	
	waitUntilVisible(this, '#finish2', function() {
		var expectedReturn = this.evaluate(function() {
			var formattedExpectedReturn = document.querySelector('#projected-returns').innerHTML;
			var expectedReturn = formattedExpectedReturn.replace('%', '');

				return parseFloat(expectedReturn);
			});

		this.echo('Expected return: ' + expectedReturn);

		if (expectedReturn < 8) {
			this.echo('Cancelling due to low expected return');
			this.exit();
		}

		this.click('#finish2');
	});
});
//END if projected return high enough, continue order

//BEGIN finalize order
casper.then(function() {
	beginStep(this, 'finalize order');
	// this.waitUntilVisible('#place-order-link2', function() {
	// 	this.click('#place-order-link2');
	// });
});
//END finalize order

casper.then(function() {
	this.capture('almostDone.png');
});

casper.run();

function beginStep(casperContext, description) {
	casperContext.echo(description);
	casperContext.capture(description + '.png');
}

function waitUntilVisible(casperContext, selector, callback) {
	casperContext.waitUntilVisible(selector, function() {
		this.echo('BEGIN wait for: ' + selector);
		
		if (callback) {
			callback.apply(this);
		}
		
		this.echo('END wait for: ' + selector);
	}, function() {
		this.echo('TIMEOUT waiting for selector: ' + selector);
		this.capture('timeout.png');
		this.exit();
	}, 10000)
}
