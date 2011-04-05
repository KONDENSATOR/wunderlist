var header = {};

header.toggle_date = function() {
	if ($('#date_holder').css('width') == '20px') {
		$('#input').animate({left:130}, 300, function(){});
		$('#date_holder').animate({width:115}, 300, function(){
			$('#date_holder').css('overflow','visible');
			$('#calroot').css('opacity',0.0);
			$('#calroot').animate({opacity:1.0},300,function(){});
			$("#date_holder .date").trigger("focus");
		});
	} else {
		$('#input').animate({left:35}, 300, function(){});
		$('#date_holder').animate({width:20}, 300, function(){});
		$('#calroot').animate({opacity:0.0},300,function(){
			$('#date_holder').css('overflow','hidden');
		});
	}
}

header.set_today = function() {
	var api = $(":date").data("dateinput");
	api.today();
	$('#input').blur();
	$('#input').focus();
}

header.remove_date = function() {
	var api = $(":date").data("dateinput");
	api.setValue(null);
	api.hide();
	$('#date').val('');
	$('#day').html('');
	$('#month').html('');
	$('#input').blur();
	$('#input').focus();
}

header.focus_input = function() {
	$('#input').focus();
}

header.add_todo = function() {
	if ($('#input').val() != '') {
		
		var id = $('.todo').length;		
		
		var opacity = $('#day').html() == '' ? 0.25 : 1.0;
		var todo_data = {
			id: id,
			opacity:opacity,
			day: $('#day').html(),
			month: $('#month').html(),
			message: $('#input').val()
		};
		
		var todo = ich.todo_header_template(todo_data);

		$('.sortable').append(todo);
		
		$('#todo_'+id).slideDown("fast");
		$('.sortable').sortable('cancel');
		
		$('#input').val('');
		$('#day').html('');
		$('#month').html('');
		$('#date').val('');
		$('#date_holder').css('opacity',0.5);
		
		todo_list.activate_filter();
		todo_list.setup_sortable();
	}
}

header.hide_help = function () {
	$('#helper_button').css('display','block');
	$('#helper_button').animate({opacity:1.0,marginTop:-10},100,function(){});
	$('#helper').animate({top:-90},300,function(){});
	$('#header').animate({top:0},300,function(){});
	$('#todo_list').animate({top:85},300,function(){});
}

header.show_help = function () {
	$('#helper_button').animate({opacity:0.0,marginTop:-50},100,function(){
		$('#helper_button').css('display','none');
	});
	$('#helper').animate({top:0},300,function(){});
	$('#header').animate({top:90},300,function(){});
	$('#todo_list').animate({top:175},300,function(){});
}

header.keywords_updated = function() {
	var data = wunderlist.keywords();
	
	$('#input').autocomplete(data,{
			multiple: true,
			multipleSeparator: " "
	});
}

header.init = function() {
	//wunderlist.bindto_keywords_updated(header.keywords_updated);
	
	header.should_toggle_date = true;
	$("header :date").dateinput({
		value: new Date(),
		firstDay: 1,
		selectors: true,
		format: 'yyyy-mm-dd',
		change: function() {
			$('#day').html(this.getValue('dd'));
			$('#month').html(month_dic[this.getValue('mm')]);
			$('#date_holder').css('opacity',1.0);
			if (header.should_toggle_date) {
				header.toggle_date();
			}
		}
	});
	
	
	
	if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
		$('#add_button').bind('touchend',header.add_todo);
		$('#add_tooltip').css('opacity',0.0);
	} else {
		$('#add_button').bind('click',header.add_todo);
	}
	
	// Setup command key listener
	var isCommand = false;$(document).keyup(function (e) {
		if(e.which == 91 || e.which == 93) isCommand=false;
	}).keydown(function (e) {
	    if(e.which == 91) isCommand=true;
	    if(e.which == 93 && isCommand == true) {return false;}
		if (isCommand && e.which == 76) {
			header.focus_input();
		}
	});
	
	// Setup shift key listener
	var isShift = false;$(document).keyup(function (e) {
		if(e.which == 16 || e.which == 16) isShift=false;
	}).keydown(function (e) {
	    if(e.which == 16) isShift=true;
	    if(e.which == 16 && isShift == true) {return false;}
	});
	
	$('#input').keydown(function(event) {
		if (isCommand) {
			var pressed_return = (event.keyCode == '13');
			var pressed_d = (event.keyCode == '68');
			var pressed_l = (event.keyCode == '76');
			var pressed_plus = (event.keyCode == '189' || event.keyCode == '107');
			var pressed_minus = (event.keyCode == '191' || event.keyCode == '109');
			
			if (pressed_return) { // Command + return
				header.add_todo();
			} else if (!isShift && pressed_d) { // Command + D
				header.set_today();
			} else if (isShift && pressed_d) { // Command + Shift + D
				header.should_toggle_date = false;
				setTimeout("header.should_toggle_date = true;",100);
				header.remove_date();
			}
			
			
		}
	});
	
	$('#input').keyup(function(event){
		if (event.keyCode == '13') { // Return
			var visible_todos = $('#todo_list .todo').filter(function(){return $(this).css('display') != 'none';});

			// TODO: Key navigation
			// if (visible_todos.length > 0) {
			// 	$('#todo_list .todo').keynav('keynav_focusbox','keynav_box');
			// }
		} else {
			if (window.lastSearchTime != null) {
				var thisTime = new Date();
				if ((thisTime - window.lastSearchTime) > 50) {
					window.lastSearchTime = thisTime;
					todo_list.activate_filter();
				}
			}else{
				window.lastSearchTime = new Date();
				todo_list.activate_filter();
			}
		}
	});
};