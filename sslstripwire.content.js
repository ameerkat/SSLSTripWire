var backup_overflow_style;
var warning_control = false;

console.log("Content included");

function emitWarning(request){
	console.log("Warning emitted");
	document.body.innerHTML += "<div id=\"sslstripwire-warning-container\"><div id=\"sslstripwire-warning-message\"></div></div>";
	backup_overflow_style = document.body.style.overflow;
	document.body.style.overflow = "hidden";
	warning = document.getElementById('sslstripwire-warning-message');
	warning.innerHTML = "<span style=\"color: #ff0000; font-weight: bold;\">Warning</span> data is being submitted over an unencrypted channel.<br />";
	if(request && request.reason == "sse"){
		warning.innerHTML += "<div style=\"font-size: 10pt;\">SSE queries indicate that this site supports https. Rewriting your requests to HTTPS is strongly recommended to maintain maximum security. Be careful when submitting sensitive or personal information to this host.</div><br />"
	} else if(request && request.reason == "previous") {
		warning.innerHTML += "<div style=\"font-size: 10pt;\">Previous site access and access patterns indicate that this site supports https. Rewriting your requests to HTTPS is strongly recommended to maintain maximum security. Be careful when submitting sensitive or personal information to this host.</div><br />"
	} else {
		warning.innerHTML += "<div style=\"font-size: 10pt;\">SSE queries <i>and</i> previous site access and access patterns indicate that this site supports https. Rewriting your requests to HTTPS is strongly recommended to maintain maximum security. Be careful when submitting sensitive or personal information to this host.</div><br />"
	}
	warning.innerHTML += "<div style=\"text-align: center;\"><a href=\""+request.rewriteUrl+"\">Rewrite request to HTTPS</a></div>";	
	warning.innerHTML += "<div style=\"text-align: right; font-size: 12pt;\"><a href=\"#\" onClick=\"javascript:console.log('Warning close');document.body.style.overflow = '"+backup_overflow_style+"';document.getElementById('sslstripwire-warning-container').style.display = 'none';\" style=\"cursor: pointer;\">Ignore</a></div>";
	
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
		if(request.mode == "warning" && !warning_control){
			console.log(request.reason);
			emitWarning(request);
			warning_control = true;
		}
	sendResponse({});
});
