/**
 * SSL Strip Wire is an attempt to create a browser extension to help augment
 * the fact that we are human when it comes to noticing encryption security
 * on websites. The objective is to create a plugin that will recognize when
 * something out of the ordinary is occuring with regards to encryption on
 * websites you have visited in the past.
 * @author Ameer Ayoub <ameer.ayoub@gmail.com>
 * @package sslstripwire
 * @modified 2010-11-11
 */

var sslstripwire = {};
sslstripwire.settings = {};
sslstripwire.handlers = {};
sslstripwire.helpers = {};
sslstripwire.sse = {};

/**
 * Settings
 */
sslstripwire.settings.debug = true;

/**
 * Helper Functions
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

sslstripwire.helpers.getMethod = function(url) {
	if(url.substring(0, 5) == "https"){
		return "https";
	} else {
		return "http";
	}
}

/**
 * SSE Integration
 */
sslstripwire.sse.directQuery = function(url, callback){
	
}


/**
 * ============================================================================
 * HTML5 WebDB
 * ============================================================================
 */
sslstripwire.webdb = {};
sslstripwire.webdb.db = null;
sslstripwire.webdb.open = function() {
	var dbSize = 32 * 1024 * 1024; // 32MB
	sslstripwire.webdb.db = openDatabase('site_db', '0.1', 'SSLStripWire Site Database', dbSize);
}

sslstripwire.webdb.createTable = function() {
	sslstripwire.webdb.db.transaction(function(tx) {
		// Main Site Database
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
                  'site_db(ID INTEGER PRIMARY KEY ASC, domain_url TEXT, https_count INT, http_count INT, last_visited DATETIME)', []);
	});
}

/**
 * Callbacks
 */
sslstripwire.webdb.onSuccess = function(tx, r) {
	if(sslstripwire.settings.debug){
		console.log('Database action completed successfully.');
	}
}

sslstripwire.webdb.onError = function(tx, e) {
	if(sslstripwire.settings.debug){
		console.log('Error: ' + e.message );
	}
}

/**
 * DB Functions
 * These are all asynchronous
 */
sslstripwire.webdb.getSiteStats = function(domain_url, callback) {
  sslstripwire.webdb.db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM site_db WHERE domain_url = ? LIMIT 1',
		[sslstripwire.helpers.getDomain(domain_url)],
		callback, sslstripwire.webdb.onError);
  });
}

sslstripwire.webdb.logSite = function(domain_url, success) {
    if(sslstripwire.helpers.getDomain(domain_url) == null){
		success();
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
				tx.executeSql('UPDATE site_db SET https_count = ?, http_count = ?, last_visited = ? WHERE ID = ?', 
				[i_result.rows.item(0).https_count + https_count, i_result.rows.item(0).http_count + http_count, now, i_result.rows.item(0).ID],
				success,
				sslstripwire.webdb.onError);
			});
		} else {
			sslstripwire.webdb.db.transaction(function(tx) {
				tx.executeSql('INSERT INTO site_db(domain_url, https_count, http_count, last_visited) VALUES (?,?,?,?)', 
				[sslstripwire.helpers.getDomain(domain_url), https_count, http_count, now],
				success,
				sslstripwire.webdb.onError);
			});
		}
	});
}

sslstripwire.webdb.cleardb = function() {
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM site_db', [], sslstripwire.webdb.onSuccess, sslstripwire.webdb.onError);
	});
}

sslstripwire.webdb.siteCount = function(callback) {
	sslstripwire.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT COUNT(*) as count FROM site_db', [], 
		callback, sslstripwire.webdb.onError);
	});
}

/**
 * ============================================================================
 * Main Program
 * ============================================================================
 */

/* 1. On a page request check if page is stored before and get statistics
 * 		a. Add Navigation Handler to fire on request
 *		b. Search local database for the site domain
 *		c. Load statistics
 */
sslstripwire.handlers.onWebRequest = function(tabId, changeInfo, tab){
	// document.body.innerHTML = "<pre>Location: " + tab.url + "</pre>";
	// document.write("<pre>Location: " + tab.url + "</pre>");
	
	var url = tab.url;
	var http_count = 0;
	var https_count = 0;
	
	sslstripwire.webdb.getSiteStats(url, function(tx, result){
		if(result.rows.length > 0){
			https_count = result.rows.item(0).https_count;
			http_count = result.rows.item(0).http_count;
			// Do Something Statistical Here
		}
		sslstripwire.webdb.logSite(url, null);
	});
}

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

// 2. Post statistics to the popup plugin

// 3. If > 50% is HTTPS and this request is HTTP, then change icon and 
// send alert

// 4. Do Secure Search Engine Query, if in DB then force SSL if we want

// 5. Insert this instance into database

/**
 * ============================================================================
 * Init
 * ============================================================================
 */
function init(){
	sslstripwire.webdb.open();
	sslstripwire.webdb.createTable();
	// If it's an extension
	console.log("Determinig context of execution");
	if(document.URL.length > 18 && document.URL.substring(0, 19) == "chrome-extension://"){
		console.log("Running as extension");
		chrome.tabs.onUpdated.addListener(sslstripwire.handlers.onWebRequest);
		chrome.browserAction.onClicked.addListener(sslstripwire.handlers.onClick);
	} else {
		console.log("Running as standalone page");
	}
}
