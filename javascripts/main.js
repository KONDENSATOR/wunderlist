var main = { };

main.login_dialog = function() {
	return true;
}

$(document).ready(function(){
	header.init();
	todo_list.init();
	footer.init();
	sync.init();
	wunderlist.init();
	wunderlist.getTasks();
	sync.perform_syncronization();
});
