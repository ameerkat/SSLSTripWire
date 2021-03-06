/**
 * SSL Strip Wire is an attempt to create a browser extension to help augment
 * the fact that we are human when it comes to noticing encryption security
 * on websites. The objective is to create a plugin that will recognize when
 * something out of the ordinary is occuring with regards to encryption on
 * websites you have visited in the past.
 * @author Ameer Ayoub <ameer.ayoub@gmail.com>
 * @package SSLSTripWire
 * @version 1.0.4
 * @modified 2010-11-17
 */

// Main extension namespace
var sslstripwire = {};

/**
 * ============================================================================
 * Settings
 * ============================================================================
 */
sslstripwire.settings = {};

// Whether or not to print debug info (not enforced strictly in the program)
sslstripwire.settings.debug = true;
sslstripwire.settings.sse_enabled = true;
// URL to the SSE service
sslstripwire.settings.sse_url = "https://www.wreferral.com/SSEService/query.do";
// SSE cache timeout
sslstripwire.settings.sse_cache = 1000*60*60*24*7; // one week
// Display access pattern graph
sslstripwire.settings.display_graph = true;

/**
 * Loads all the settings from local storage settable in the options page
 */
sslstripwire.settings.load = function(){
	// TODO rewrite this as a loop
	if(!localStorage.settings){
		localStorage.settings = JSON.stringify(sslstripwire.settings);
	}
	var settings = JSON.parse(localStorage.settings);
	if(typeof(settings.debug) != "undefined" && settings.debug != null)
	var settings = JSON.parse(localStorage.settings);
	if(typeof(settings.sse_enabled) != "undefined" && settings.sse_enabled != null)
		sslstripwire.settings.sse_enabled = settings.sse_enabled;
	if(typeof(settings.sse_url) != "undefined" && settings.sse_url != null)
		sslstripwire.settings.sse_url = settings.sse_url;
	if(typeof(settings.sse_cache) != "undefined" && settings.sse_cache != null)
		sslstripwire.settings.sse_cache = settings.sse_cache;
	if(typeof(settings.display_graph) != "undefined" && settings.display_graph != null)
		sslstripwire.settings.display_graph = settings.display_graph;
}

/**
 * ============================================================================
 * Helper Functions
 * ============================================================================
 */
sslstripwire.helpers = {};

/**
 * Convenience function to parse the domain out of a URL (via regex).
 * @param string url URL of the site to get the domain of
 * @return string domain of the url or null if the site is not http/https
 * 		(e.g. file, chrome-extensions, etc.)
 */
sslstripwire.helpers.getDomain = function(url) {
	var regex = /^https?:\/\/(.*?\.?.*?\..*?)\//;
	var match = regex.exec(url);
	if(match !== null){
		return match[1];
	} else {
		return null;
	}
}

/**
 * Convenience function to get the method of the HTTP transfer
 * (being either HTTP or HTTPS)
 * @param string url URL of the site
 * @return string 'http' or 'https'
 */
sslstripwire.helpers.getMethod = function(url) {
	if(url.substring(0, 5) == "https"){
		return "https";
	} else {
		return "http";
	}
}

/**
 * Returns the url rewritten to https
 * @param string url the string of the url to rewrie
 * @return the url rewritten to https
 */
sslstripwire.helpers.rewrite = function(url) {
	if(sslstripwire.helpers.getMethod(url) == "https")
		return url;
	return "https"+url.substring(4);
}

/**
 * Returns the url without any get variables or anchor references
 * @param string url the string of the url to remove the parameters from
 * @return string the string with the parameters removed, returns null if the
 *		url is invalid.
 */
sslstripwire.helpers.removeParams = function(url) {
	var regex = /(.*?)(\?|#)/;
	var match = regex.exec(url);
	if(match){
		return match[1];
	} else {
		return url;
	}
}

/**
* Given a string of the points to plot, generates the graph image html to
* display the graph with the given point using the google graph api
* @param string points a string of the points to graph
* @return string a string containing the html of the points
*/
sslstripwire.helpers.generateGraph = function(points) {
	return "<img src=\"http://chart.apis.google.com/chart?chf=c,s,FFFFFF" + 
	"&chxr=0,0,10|1,0,2&chxs=1,FFFFFF,8,0,l,FFFFFF&chxt=x,y&chs=200x40&cht=ls" +
	"&chco=969696&chd=s:ffffffffff&chls=1,-1,-1&chm="+points+"\" />";
}

/**
 * ============================================================================
 * SSE Integration
 * DB Schema:
 * sse_cache(ID INTEGER PRIMARY KEY ASC, domain_url TEXT, https_support INT,
 * phishing_site INT, expires DATETIME)
 * ============================================================================
 */
sslstripwire.sse = {};

/**
 * directQuery does a query against the secure search engine (wreferral) via
 * ajax. Call query if you want to just do a query, as that does caching of
 * the results, based on the user settable expiration time.
 * @param string url URL of the domain to query
 * @param function callback callback function on success
 */
sslstripwire.sse.directQuery = function(url, callback){
	$.ajax({
		type: 'POST',
		url: sslstripwire.settings.sse_url,
		data: {'name' : sslstripwire.helpers.getDomain(url) },
		success: callback
	});
}

/**
 * Queries for a domain in the SSE, either directly or searches through the
 * cache if available. 0 value for caching indicates that the request will be
 * new each time. The cache length is set directly through the 
 * sslstripwire.settings.sse_cache variable, and is made available to the user
 * through the options page.
 * @param string url URL of the domain to query
 * @param function callback function to callback to with the result
 */
sslstripwire.sse.query = function(url, callback){
	if(sslstripwire.helpers.getDomain(url) === null){
		callback(null, null);
		return;
	}
	var now = new Date();
	var expires_update = new Date(now.getTime() + sslstripwire.settings.sse_cache);
	sslstripwire.webdb.db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM sse_cache WHERE domain_url = ? LIMIT 1',
		[sslstripwire.helpers.getDomain(url)],
		function(tx, result){
			if(result.rows.length > 0){
				var expires = new Date(result.rows.item(0).expires);
				// If not expired just return result
				if(now.getTime() < expires.getTime()){
					callback(tx, result);
				} else {
				if(sslstripwire.settings.debug){
					console.log("UPDATING record for domain ("+url+") " 
						+ sslstripwire.helpers.getDomain(url));
				}
				// If expired then perform update and return result
					sslstripwire.sse.directQuery(url, function(data){
						sslstripwire.webdb.db.transaction(function(tx) {
							tx.executeSql('UPDATE sse_cache SET https_support = ?, phishing_site = ?, expires = ? WHERE ID = ?', 
							[data.split(" ")[0], data.split(" ")[1], expires_update, result.rows.item(0).ID],
							function(){
								sslstripwire.webdb.db.transaction(function(tx) {
									tx.executeSql('SELECT * FROM sse_cache WHERE domain_url = ? LIMIT 1',
									[sslstripwire.helpers.getDomain(url)],
									callback,
									sslstripwire.webdb.onError);
								});
							},
							sslstripwire.webdb.onError);
						});
					});
				}
			} else {
				// Do direct query and insert into database and return record
				sslstripwire.sse.directQuery(url, function(data){
					sslstripwire.webdb.db.transaction(function(tx) {
						if(sslstripwire.settings.debug){
							console.log("CREATING record for domain ("+url+") "+ sslstripwire.helpers.getDomain(url));
						}
						tx.executeSql('INSERT INTO sse_cache(domain_url, https_support, phishing_site, expires) VALUES (?, ?, ?, ?)', 
						[sslstripwire.helpers.getDomain(url), data.split(" ")[0], data.split(" ")[1], expires_update],
						function(){
							sslstripwire.webdb.db.transaction(function(tx) {
								tx.executeSql('SELECT * FROM sse_cache WHERE domain_url = ? LIMIT 1',
								[sslstripwire.helpers.getDomain(url)],
								callback,
								sslstripwire.webdb.onError);
							});
						},
						sslstripwire.webdb.onError);
					});
				});
			}
		}, sslstripwire.webdb.onError);
	});
}

/**
 * ============================================================================
 * Site Log
 * Holds every site request for analysis.
 * DB Schema:
 * log(ID INTEGER PRIMARY KEY ASC, full_url TEXT, domain_url TEXT, mode TEXT,
 *  visited DATETIME)
 * ============================================================================
 */
sslstripwire.log = {};

/**
 * Writes site with given url to the log file.
 * @param string url URL of the site to log
 */
sslstripwire.log.write = function(url){
    if(sslstripwire.helpers.getDomain(url) === null)
		return;
	var now = new Date();
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('INSERT INTO log(full_url, domain_url, mode, visited) VALUES (?, ?, ?, ?)', 
		[url, sslstripwire.helpers.getDomain(url), sslstripwire.helpers.getMethod(url), now],
		sslstripwire.webdb.onSuccess,
		sslstripwire.webdb.onError);
	});
}

/**
 * Gives the result set back to the callback with all the log entries on the
 * provided domain.
 * @param string url the url of the domain to recover log entries for
 * @param function(tx, result) callback function to take the results on 
 *		successful query
 */
sslstripwire.log.get = function(url, callback){
  sslstripwire.webdb.db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM log WHERE domain_url = ? ORDER BY visited DESC',
		[sslstripwire.helpers.getDomain(url)],
		callback, sslstripwire.webdb.onError);
  });
}

/**
 * log.get function with added functionality to limit the number of responses
 * useful for when querying for graph and recent info
 */
sslstripwire.log.getLimited = function(url, limit, callback){
  sslstripwire.webdb.db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM log WHERE domain_url = ? ORDER BY visited DESC LIMIT ?',
		[sslstripwire.helpers.getDomain(url), limit],
		callback, sslstripwire.webdb.onError);
  });
}

/**
 * ============================================================================
 * Site Database
 * Holds the summary view of each domain.
 * ============================================================================
 */

sslstripwire.webdb = {};
sslstripwire.webdb.db = null;

/**
 * Opens the database (should be called on page initialization.)
 */
sslstripwire.webdb.open = function() {
	var dbSize = 32 * 1024 * 1024; // 32MB
	sslstripwire.webdb.db = openDatabase('site_db', '0.1', 
		'SSLStripWire Site Database', dbSize);
}

/**
 * Switches to test db
 * This doesn't work for some reason I speculate it is because we can only
 * have one database open at a time.
 */
sslstripwire.webdb.switchTo = function(db_name){
	var dbSize = 32 * 1024 * 1024; // 32MB
	sslstripwire.webdb.db = openDatabase(db_name, '0.2', 
		'SSLStripWire Site Database (Dev)', dbSize);
}

/**
 * Create all the database tables if they don't exist.
 * Database tables:
 * 		domain_overview (contains general statistics about a given domain, such
 *			as total http/https requests.)
 * 		sse_cache (contains cached versions of the SSE queries)
 *		log (contains all records, similar to browser history, contains some
 *			redundant fields to improve search time performance)
 */
sslstripwire.webdb.createTable = function() {
	sslstripwire.webdb.db.transaction(function(tx) {
		// Main Site Database
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
            'domain_overview(ID INTEGER PRIMARY KEY ASC, domain_url TEXT, https_count INT, http_count INT, last_visited DATETIME)', []);
		// SSE Cache
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
            'sse_cache(ID INTEGER PRIMARY KEY ASC, domain_url TEXT, https_support TEXT, phishing_site TEXT, expires DATETIME)', []);
		// Site History Log (for analysis)
		// Mode : 0 = HTTP, 1 = HTTPS
		// Stored for convenience, we could always calculate it from url
		// same with domain_url (so we can join tables without calculating each time)
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
			'log(ID INTEGER PRIMARY KEY ASC, full_url TEXT, domain_url TEXT, mode TEXT, visited DATETIME)', []);
	});
}

/**
 * Default Callbacks
 */

/**
 * Default success callback, prints out to console a success message.
 */
sslstripwire.webdb.onSuccess = function(tx, r) {
	if(sslstripwire.settings.debug){
		console.log('Database action completed successfully.');
	}
}

/**
 * Default error callback, prints out error message to console.
 */
sslstripwire.webdb.onError = function(tx, e) {
	if(sslstripwire.settings.debug){
		console.log('Error: ' + e.message );
	}
}

/**
 * DB Functions
 * These are all asynchronous (as is almost everything here)
 */

/**
 * Passes back domain statistics in the form of a database record to the
 * callback function. Row length of result set will be 0 if the site is not
 * in the database.
 * @param string domain_url URL of the domain to get statistics for
 * @param function callback function to callback with results
 */
sslstripwire.webdb.getSiteStats = function(domain_url, callback) {
  sslstripwire.webdb.db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM domain_overview WHERE domain_url = ? LIMIT 1',
		[sslstripwire.helpers.getDomain(domain_url)],
		callback, sslstripwire.webdb.onError);
  });
}

/**
 * Logs site to database and calls back to callback function on success
 * @param string domain_url domain url to log
 * @param function success success callback function
 */
sslstripwire.webdb.logSite = function(domain_url, success) {
    if(sslstripwire.helpers.getDomain(domain_url) === null){
		success();
		return;
	}
	var now = new Date();
	var http_count = 0;
	var https_count = 0;
	if(sslstripwire.helpers.getMethod(domain_url) == "https")
		https_count++;
	else
		http_count++;
	sslstripwire.webdb.getSiteStats(domain_url, function(tx, result) {
		if (result.rows.length > 0)
		{
			var i_result = result;
			sslstripwire.webdb.db.transaction(function(tx) {
				tx.executeSql('UPDATE domain_overview SET https_count = ?, http_count = ?, last_visited = ? WHERE ID = ?', 
				[i_result.rows.item(0).https_count + https_count, i_result.rows.item(0).http_count + http_count, now, i_result.rows.item(0).ID],
				success,
				sslstripwire.webdb.onError);
			});
		} else {
			sslstripwire.webdb.db.transaction(function(tx) {
				tx.executeSql('INSERT INTO domain_overview(domain_url, https_count, http_count, last_visited) VALUES (?,?,?,?)', 
				[sslstripwire.helpers.getDomain(domain_url), https_count, http_count, now],
				success,
				sslstripwire.webdb.onError);
			});
		}
	});
}

/**
 * ============================================================================
 * Generic DB Function
 * ============================================================================
 */

 /**
 * Counts the number of entries in a database table (mostly for statistical
 * purposes). Passes a result set object to the callback function containing
 * a result of the aggregate sql function count on the number of records.
 * @param function callback function to callback with the result set
 */
sslstripwire.webdb.count = function(param_table, callback) {
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT COUNT(*) as count FROM '+param_table,
		[], 
		callback, sslstripwire.webdb.onError);
	});
}

/**
 * Clears the database of all records
 */
sslstripwire.webdb.cleardb = function() {
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM domain_overview', [],
		sslstripwire.webdb.onSuccess, sslstripwire.webdb.onError);
	});
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM log', [],
		sslstripwire.webdb.onSuccess, sslstripwire.webdb.onError);
	});
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM sse_cache', [],
		sslstripwire.webdb.onSuccess, sslstripwire.webdb.onError);
	});
}

/**
 * ============================================================================
 * Main Program
 * ============================================================================
 */
sslstripwire.handlers = {};
 
/**
 * Add a basic hook to evaluate page encryption on form submission
 * @todo this
 */
 
/**
 * @todo write this function header block comment
 */
sslstripwire.handlers.onWebRequest = function(tabId, changeInfo, tab){
	var url = tab.url;
	sslstripwire.log.write(url);
	sslstripwire.webdb.getSiteStats(url, function(tx, stat_result){
		if(stat_result.rows.length > 0){
			var https_count = stat_result.rows.item(0).https_count;
			var http_count = stat_result.rows.item(0).http_count;		
			sslstripwire.sse.query(url, function(tx, result){
				if(result 
				&& ((result.rows.length > 0 
				&& sslstripwire.settings.sse_enabled 
				&& result.rows.item(0).https_support == "yes")
				|| https_count > 0) 
				&& sslstripwire.helpers.getMethod(url) != "https"){
					console.log("Previous HTTPS Requests: "+https_count);
					console.log("SSE Says: "+ result.rows.item(0).https_support);
					// Display warning error with warning based on previous HTTPS or SSE support
					var this_reason = "";
					if(result.rows.length > 0 
					&& sslstripwire.settings.sse_enabled 
					&& result.rows.item(0).https_support == "yes")
						this_reason += "sse";
					if(https_count > 0){
						if(this_reason == ""){
							this_reason += "previous";
						} else {
							this_reason += " previous";
						}
					}
					chrome.browserAction.setIcon({path: "images/lock_break.png"});
					chrome.tabs.sendRequest(tab.id, {mode: "warning",
						reason: this_reason,
						rewriteUrl: sslstripwire.helpers.rewrite(url)},
						function(response){
						console.log("Warning emitted for Mixed, reason: "+this_reason);
						});
				} else {
					// Everything is fine :)
					chrome.browserAction.setIcon({path: "images/lock.png"});
				}
			});
		} else {
			sslstripwire.sse.query(url, function(tx, result){
				if(result
				&& (result.rows.length > 0 
				&& sslstripwire.settings.sse_enabled 
				&& result.rows.item(0).https_support == "yes") 
				&& sslstripwire.helpers.getMethod(url) != "https"){
					// Display warning error with reason based solely on SSE
					chrome.browserAction.setIcon({path: "images/lock_break.png"});
					chrome.tabs.sendRequest(tab.id, {mode: "warning", 
						reason: "sse", 
						rewriteUrl: sslstripwire.helpers.rewrite(url)},
						function(response){
						console.log("Warning emitted for SSE");
						});
				} else {
					// Everything is fine :)
					chrome.browserAction.setIcon({path: "images/lock.png"});
				}
			});
		}
		sslstripwire.webdb.logSite(url, function(){});
	});
}

/**
 * Does some message passing to the content script to display the statistics
 * inline in the page. This is no longer being used as of 1.0.3 and later.
 * @deprecated
 * @param Tab tab the tab of the requestor to send the message to
 */
sslstripwire.handlers.onClick = function(tab) {
	sslstripwire.webdb.getSiteStats(tab.url, function(tx, result){
		var https_count = 0;
		var http_count = 0;
		var domain = sslstripwire.helpers.getDomain(tab.url);
		if(result.rows.length > 0){
			https_count = result.rows.item(0).https_count;
			http_count = result.rows.item(0).http_count;
			domain = result.rows.item(0).domain_url;
		}
		chrome.tabs.sendRequest(tab.id, 
			{ https_count: https_count,
			http_count: http_count,
			domain: domain},
			function(response){console.log(response);});
	});
}

/**
 * ============================================================================
 * Init
 * ============================================================================
 */
/**
 * Called on page load, opens database and creates tables and attaches some
 * callbacks for events.
 */
function init(){
	sslstripwire.webdb.open();
	sslstripwire.webdb.createTable();
	sslstripwire.settings.load();
	
	// If it's an extension
	console.log("Determining context of execution");
	if(document.URL.length > 18 
	&& document.URL.substring(0, 19) == "chrome-extension://"){
		console.log("Running as extension.");
		chrome.tabs.onUpdated.addListener(sslstripwire.handlers.onWebRequest);
		/*
		 * In plugin testing
		 *
		// Test out direct query for debugging purposes
		// Doesn't run in test script because of XSS prevention but runs in
		// our background script.
		sslstripwire.sse.directQuery("http://www.google.com/", function(data){
			console.log(data);
		});
		// Test out SSE caching
		sslstripwire.sse.query("http://www.google.com/", function(tx, result){
			console.log("HTTP SUPPORT: "+result.rows.item(0).https_support);
		});
		// Second Query
		sslstripwire.sse.query("http://www.google.com/", function(tx, result){
			console.log("HTTP SUPPORT: "+result.rows.item(0).https_support);
		});
		*/
	} else {
		console.log("Running as standalone page.");
	}
}
