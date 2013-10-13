var casper = require('casper').create();
var url = 'https://www.lendingclub.com/account/gotoLogin.action';

var email = casper.cli.get('email');
var password = casper.cli.get('password');
var minAvailableCash = casper.cli.get('minCash');
var minExpectedReturn = casper.cli.get('minReturn');
var globalTimeout = casper.cli.get('timeout');

if (!email || !password || !minAvailableCash || !minExpectedReturn) { 
	casper.echo('ERROR missing parameter(s)');
	casper.exit();
}

casper.myBeginStep = function(description) {
	this.echo(description);
	this.capture(description + '.png');
}

casper.myWaitUntilVisible = function(selector, then) {
	this.waitUntilVisible(selector, then, function timeout() {
		this.echo('ERROR timeout waitUntilVisible: ' + selector);
		this.capture(selector + '.png');
		this.exit();
	}, globalTimeout);
}

casper.myWaitFor = function(predicate, then) {
	this.waitFor(predicate, then, function timeout() {
		this.echo('ERROR waitFor');
		this.capture('waitFor.png');
		this.exit();
	}, globalTimeout);
}

//BEGIN login
casper.start(url, function() {
	
	this.myBeginStep('login');

	this.myWaitUntilVisible('#email', function() {

		this.evaluate(function(email, password) {
			document.querySelector('#email').setAttribute('value', email);
			document.querySelector('#password').setAttribute('value', password);
			document.querySelector('form[action="/account/login.action"]').submit();
		}, email, password);	

		this.myWaitUntilVisible('#narL');
	});
});
//END login

//BEGIN make sure we're starting from scratch
casper.thenOpen('https://www.lendingclub.com/portfolio/confirmStartNewPortfolio.action', function() {
	this.myBeginStep("make sure we're starting from scratch");

	this.myWaitFor(function() {
		return this.evaluate(function() {
			var readyToInvest = document.querySelector('#risk-strategy-buttons').style.opacity === "1";
			var askingForFunds = document.querySelector('a[href="/account/addFunds.action"]');

			return readyToInvest || askingForFunds;
		});
	});;
	
});
//END make sure we're starting from scratch

//BEGIN check available cash
casper.then(function() {
	
	this.myBeginStep('check available cash');
	var availableCash = this.evaluate(function() {
		var formattedCashString = document.querySelector('#availableCash').innerHTML;
		var cashString = formattedCashString.replace('$', '').replace(',', '');

		return parseFloat(cashString);
	});

	this.echo('Available cash: ' + availableCash);

	if (availableCash < minAvailableCash) {
		this.echo('Available cash too low, exiting...');
		this.exit();
	}
});
//END check available cash

//BEGIN open saved filter
casper.then(function() {

	this.myBeginStep('open saved filter');
	this.capture('before savedFiltersButton.png');
	this.click('#savedFiltersButton');

	this.myWaitFor(function() {
		return this.evaluate(function() {
			return document.querySelector('.savedCriteriaLoad').innerHTML === "Reust Standard";
		});
	}, function() {
		this.click('.savedCriteriaLoad');
		this.myWaitUntilVisible('.mask');
		this.waitWhileVisible('.mask');
		this.myWaitFor(function() {
			return this.evaluate(function() {
				return document.querySelector('#risk-strategy-buttons').style.opacity === "1";
			});
		});
	});

});
//END open saved filter

//BEGIN initialize order
casper.then(function() {
	this.myBeginStep('initialize order');
	this.click('#more-aggressive');

	this.myWaitUntilVisible('#view-selected-portfolio-notes', function() {
		this.click('#view-selected-portfolio-notes');
	});
});
//END initialize order

//BEGIN if projected return high enough, continue order
casper.then(function() {
	this.myBeginStep('if projected return high enough, continue order');
	
	this.myWaitUntilVisible('#finish2', function() {
		var expectedReturn = this.evaluate(function() {
			var formattedExpectedReturn = document.querySelector('#projected-returns').innerHTML;
			var expectedReturn = formattedExpectedReturn.replace('%', '');

				return parseFloat(expectedReturn);
			});

		this.echo('Expected return: ' + expectedReturn);

		if (expectedReturn < minExpectedReturn) {
			this.echo('Cancelling due to low expected return');
			this.exit();
		}

		this.click('#finish2');
	});
});
//END if projected return high enough, continue order

//BEGIN finalize order
casper.then(function() {
	this.myBeginStep('finalize order');
	this.myWaitUntilVisible('#place-order-link2', function() {
		this.click('#place-order-link2');
		this.wait(globalTimeout);
		this.echo('SUCCESS order finalized');
	});
});
//END finalize order

casper.run();
