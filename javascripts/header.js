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

header.add_todo = function() {
	if ($('#input').val() != '') {
		
		var opacity = $('#day').html() == '' ? 0.25 : 1.0;
		var todo_data = {
			id: 1,
			opacity:opacity,
			day: $('#day').html(),
			month: $('#month').html(),
			message: $('#input').val()
		};
		
		var todo = ich.todo_header_template(todo_data);

		$('.sortable').append(todo);
		
		$('#todo_XXX').slideDown("fast");
		$('.sortable').sortable('cancel');
		
		$('#input').val('');
		$('#day').html('');
		$('#month').html('');
		$('#date').val('');
		$('#date_holder').css('opacity',0.5);
		
		activate_filter();
		setup_sortable();
	}
}

header.init = function() {
	var data = ['#Finansliv','#iPhoneguiden','#MinaSidor','#BytBil','@Robin','@Fredrik','@Victor','@Andreas'];
	$('#input').autocomplete(data,{
			multiple: true,
			multipleSeparator: " "
	});
	
	$("header :date").dateinput({
		value: new Date(),
		firstDay: 1,
		selectors: true,
		format: 'yyyy-mm-dd',
		change: function() {
			$('#day').html(this.getValue('dd'));
			$('#month').html(month_dic[this.getValue('mm')]);
			$('#date_holder').css('opacity',1.0);
			this.toggle_date();
		}
	});
	
	
	
	if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
		$('#add_button').bind('touchend',this.add_todo);
		$('#add_tooltip').css('opacity',0.0);
	} else {
		$('#add_button').bind('click',this.add_todo);
	}
	
	var isCommand = false;$(document).keyup(function (e) {
		if(e.which == 91 || e.which == 93) isCommand=false;
	}).keydown(function (e) {
	    if(e.which == 91) isCommand=true;
	    if(e.which == 93 && isCommand == true) {return false;}
	});
	
	$('#input').keydown(function(event){
		var pressedReturn = (event.keyCode == '13');
		if (isCommand && pressedReturn) { // Command + return
			this.add_todo();
		} else if (pressedReturn) { // Return
			var visible_todos = $('#todo_list .todo').filter(function(){return $(this).css('display') != 'none';});
			if (visible_todos.length > 0) {
				$('#todo_list .todo').keynav('keynav_focusbox','keynav_box');
			}
		} else {
			if ($('#input').val() == '' || window.lastSearchTime != null) {
				var thisTime = new Date();
				if ((thisTime - window.lastSearchTime) > 250) {
					window.lastSearchTime = thisTime;
					activate_filter();
				}
			}else{
				window.lastSearchTime = new Date();
				activate_filter();
			}
		}
	});
};