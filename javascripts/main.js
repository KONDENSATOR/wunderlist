$(document).ready(function(){
	header.init();
	todo_list.init();
	footer.init();
	
	wunderlist.getTasksByUser("@fredrik");
});
