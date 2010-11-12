displayStats = function(domain, https_count, http_count){
	document.body.innerHTML =
	"<div id=\"display-stats-878157e0-ee1c-11df-98cf-0800200c9a66\" " + 
	"style=\"max-width: 150px; height: 50px; background-color: #000000; color: #ffffff; opacity: .7; padding: 15px; border-radius: 10px; position: absolute; top: 10px; right: 10px; font-family: courier; font-size: 8pt; text-align: left;\">" +
	"<span id=\"site-name-128829e0-ee1d-11df-98cf-0800200c9a66\">" + domain + "</span><br />" +
	"<span id=\"https-count-1bc03d90-ee1d-11df-98cf-0800200c9a66\" style=\"color: #0E9E3C;\">HTTPS: " + https_count + "</span><br />" +
	"<span id=\"https-count-3471f4f0-ee1d-11df-98cf-0800200c9a66\" style=\"color: #D80000;\">HTTP: " + http_count + "</span></div>" + document.body.innerHTML;
	console.log("Finished inserting info");
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
		console.log(request);
		if(request !== null){	
			displayStats(request.domain, request.https_count, request.http_count);
		}
		sendResponse({});
	});

console.log("Finished loading content script.");
