/**
 * kondensator.utilities.js
 *
 * Class for logging in into sync server, sync sending and retrieval
 * @author Dennis Schneider
 * @modified Fredrik Andersson
 */

/**
 * Trim string
 *
 * @author ? From the internet
 * @modified Fredrik Andersson
 */
function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}
 
/**
 * Left trim string
 *
 * @author ? From the internet
 * @modified Fredrik Andersson
 */
function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
/**
 * Right trim string
 *
 * @author ? From the internet
 * @modified Fredrik Andersson
 */
function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

function once(func, time) {	
	this.invoke = function() {
		if(this.timer != null) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(function() {
			func();
		}, time);
	}
}
