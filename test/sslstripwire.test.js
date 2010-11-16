/**
 * SSLSTripWire Test Suite
 * SSE Integration is not included because it requires cross site requesting.
 * @author Ameer Ayoub <ameer.ayoub@gmail.com>
 */

/**
 * Helpers
 */
module("SSLSTripWire Helpers");

test("Check domain parsing", function() {
	expect(2);
	equals(sslstripwire.helpers.getDomain("http://www.google.com/"), 
		"www.google.com", "http://www.google.com/");
	equals(sslstripwire.helpers.getDomain("https://mail.google.com/mail/?shva=1#inbox"), 
		"mail.google.com", "https://mail.google.com/mail/?shva=1#inbox");
});

test("Check url rewriting", function() {
	expect(2);
	equals(sslstripwire.helpers.rewrite("http://www.google.com/"), 
		"https://www.google.com/", "http://www.google.com/");
	equals(sslstripwire.helpers.rewrite("https://mail.google.com/mail/?shva=1#inbox"), 
		"https://mail.google.com/mail/?shva=1#inbox", "https://mail.google.com/mail/?shva=1#inbox");
});

test("Check domain parsing of local file URLs", function() {
	equals(sslstripwire.helpers.getDomain("file:///C:/Projects/SSLSTripWire/options.html"), 
		null, "file:///C:/Projects/SSLSTripWire/options.html");
});

test("Check domain parsing of chrome extension URLs", function() {
	equals(sslstripwire.helpers.getDomain("chrome-extensions://macgcabblngjoaldglhabgpjclljoig/options.html"), 
		null, "chrome-extensions://macgcabblngjoaldglhabgpjclljoig/options.html");
});

test("Check request method parsing", function() {
	expect(2);
	equals(sslstripwire.helpers.getMethod("http://www.google.com/"), 
		"http", "http://www.google.com/");
	equals(sslstripwire.helpers.getMethod("https://mail.google.com/mail/?shva=1#inbox"), 
		"https", "https://mail.google.com/mail/?shva=1#inbox");
});

/**
 * HTML5 Database
 */
module("SSLSTripWire WebDB");
// Asynchronous Tests

test("Clear database", function() {
	stop(1000);
	sslstripwire.webdb.cleardb();
	sslstripwire.webdb.count("domain_overview", function(tx, result){
		equals(result.rows.item(0).count, 0, "Assert the database is empty");
		start();
	});
});

test("Assert unvisited site doesn't error", function() {
	stop(1000);
	var site_url = "https://mail.google.com/";
	sslstripwire.webdb.getSiteStats(site_url, function(tx, result) {
		ok(true, "Callback executes");
		equals(result.rows.length, 0, "Result is result set of length 0.")
		start();
	});
});


test("Database insert new", function() {
	var site_url = "http://www.google.com/";
	stop(1000);
	sslstripwire.webdb.logSite(site_url, function(){
		sslstripwire.webdb.count("domain_overview", function(tx, result){
			equals(result.rows.item(0).count, 1, "Assert the database is not empty");
			sslstripwire.webdb.getSiteStats(site_url, function(tx, result) {
				equals(result.rows.item(0).http_count, 1, "Assert HTTP count is 1");
			equals(result.rows.item(0).https_count, 0, "Assert HTTPS count is 0");
				start();
			});
		});
	});
});

test("Database update old", function() {
	stop(1000);
	var site_url = "http://www.google.com/";
	sslstripwire.webdb.logSite(site_url, function(){
	sslstripwire.webdb.count("domain_overview", function(tx, result){
			equals(result.rows.item(0).count, 1, "Assert the database contains a single entry");
			sslstripwire.webdb.getSiteStats(site_url, function(tx, result) {
				equals(result.rows.item(0).http_count, 2, "Assert HTTP count is 2");
			equals(result.rows.item(0).https_count, 0, "Assert HTTPS count is 0");
				start();
			});
		});
	});
});

test("Database update old https", function() {
	stop(1000);
	var site_url = "https://www.google.com/";
	sslstripwire.webdb.logSite(site_url, function(){
		sslstripwire.webdb.count("domain_overview", function(tx, result){
			equals(result.rows.item(0).count, 1, "Assert the database contains a single entry");
			sslstripwire.webdb.getSiteStats(site_url, function(tx, result) {
				equals(result.rows.item(0).http_count, 2, "Assert HTTP count is 2");
				equals(result.rows.item(0).https_count, 1, "Assert HTTPS count is 1");
			start();
			});
		});
	});
});

test("Database insert second new https", function() {
	stop(1000);
	var site_url = "https://mail.google.com/";
	sslstripwire.webdb.logSite(site_url, function(){
		sslstripwire.webdb.count("domain_overview", function(tx, result){
			equals(result.rows.item(0).count, 2, "Assert the database contains a both entries");
			sslstripwire.webdb.getSiteStats(site_url, function(tx, result) {
				equals(result.rows.item(0).http_count, 0, "Assert HTTP count is 0");
				equals(result.rows.item(0).https_count, 1, "Assert HTTPS count is 1");
				start();
			});
		});
	});
});
