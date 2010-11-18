/**
 * SSLSTripWire Test Suite
 * SSE Integration is not included because it requires cross site requesting.
 * @author Ameer Ayoub <ameer.ayoub@gmail.com>
 */

// Switch to dev database
// Doesn't work, for now testing will erase database
/*sslstripwire.webdb.switchTo("site_db_dev");
sslstripwire.webdb.createTable();*/

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

test("Check url parameter removing", function() {
	equals(sslstripwire.helpers.removeParams("http://www.google.com/search?sourceid=chrome&ie=UTF-8&q=search+for+this#hl=en&expIds=17259,17311,18167,23756,24692,24878,24879,25659,25754,25854,26339,26788,27400,27606,27630&sugexp=ldymls&xhr=t&q=search+for+this+asdf&cp=20&qe=c2VhcmNoIGZvciB0aGlzIGFzZGY&qesig=mEYiziMTs8a0cIo-KRpKuQ&pkc=AFgZ2tkTlLYMRv5Jzok8MnowUfkx1Zt-baO4tS768wjWt-IITTLjqSPlieCskkM3Cjw-W7JWRJLlqrNLTzw2Zs-lVMJy3jspGQ&pf=p&sclient=psy&aq=f&aqi=&aql=&oq=search+for+this+asdf&gs_rfai=&pbx=1&fp=c3a0e6be9650fe91"), 
		"http://www.google.com/search", "Parameter and link combined");
	equals(sslstripwire.helpers.removeParams("http://www.google.com/search?sourceid=chrome&ie=UTF-8&q=search+for+this"), 
		"http://www.google.com/search", "Just parameters");
	equals(sslstripwire.helpers.removeParams("http://www.google.com/search#hl=en&expIds=17259,17311,18167,23756,24692,24878,24879,25659,25754,25854,26339,26788,27400,27606,27630&sugexp=ldymls&xhr=t&q=search+for+this+asdf&cp=20&qe=c2VhcmNoIGZvciB0aGlzIGFzZGY&qesig=mEYiziMTs8a0cIo-KRpKuQ&pkc=AFgZ2tkTlLYMRv5Jzok8MnowUfkx1Zt-baO4tS768wjWt-IITTLjqSPlieCskkM3Cjw-W7JWRJLlqrNLTzw2Zs-lVMJy3jspGQ&pf=p&sclient=psy&aq=f&aqi=&aql=&oq=search+for+this+asdf&gs_rfai=&pbx=1&fp=c3a0e6be9650fe91"), 
		"http://www.google.com/search", "Just link anchor");
	equals(sslstripwire.helpers.removeParams("http://www.google.com/search"), 
		"http://www.google.com/search", "Straight through");
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

test("Clear database with content", function() {
	stop(1000);
	sslstripwire.webdb.cleardb();
	sslstripwire.webdb.count("domain_overview", function(tx, result){
		equals(result.rows.item(0).count, 0, "Assert the database is empty");
		start();
	});
});

// Switch back to production
//sslstripwire.webdb.open();
