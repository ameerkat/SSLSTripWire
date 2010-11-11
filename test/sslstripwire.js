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

/**
 * Main Program
 */
 
sslstripwire.settings.debug = true;

/* 1. On a page request check if page is stored before and get statistics
 * 		a. Add Navigation Handler to fire on request
 *		b. Search local database for the site domain
 *		c. Load statistics
 */
sslstripwire.handlers.onWebRequest = function(details){
	var url = details.url;
	
	
}

// 2. Post statistics to the popup plugin

// 3. If > 50% is HTTPS and this request is HTTP, then change icon and 
// send alert

// 4. Do Secure Search Engine Query, if in DB then force SSL if we want

// 5. Insert this instance into database

/**
 * Event Handlers
 */
chrome.experimental.webRequest.onBeforeRequest.addListener(
	sslstripwire.handlers.onWebRequest);

/**
 * Init
 */
sslstripwire.webdb.open();
sslstripwire.webdb.createTable();
