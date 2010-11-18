var backup_overflow_style;
var warning_control = false;

console.log("Content included");

function emitWarning(){
	console.log("Warning emitted");
	document.body.innerHTML += "<div id=\"sslstripwire-warning-container\"><div id=\"sslstripwire-warning-message\"></div></div>";
	backup_overflow_style = document.body.style.overflow;
	document.body.style.overflow = "hidden";
	warning = document.getElementById('sslstripwire-warning-message');
	warning.innerHTML = "Warning data is being submitted over an unencrypted channel! <span onClick=\"javascript:console.log('Warning close');document.body.style.overflow = '"+backup_overflow_style+"';document.getElementById('sslstripwire-warning-container').style.display = 'none';\" style=\"cursor: pointer;\">Dismiss this warning</span>";
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
		if(request.mode == "warning" && !warning_control){
			console.log(request.reason);
			emitWarning();
			warning_control = true;
		}
	sendResponse({});
});
