function toggle_date () {
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

function add_todo () {
	if ($('#input').val() != '') {
		$('.sortable').append('<li style="display:none;"><article class="todo rounded gray_gradient" id="todo_XXX"><div class="timer"><div class="lamp start"></div><div class="lamp paus"></div><div class="lamp stop"></div></div><div class="date_holder"><div class="day">'+$('#day').html()+'</div><div class="month">'+$('#month').html()+'</div></div><div class="description_holder"><h1>'+$('#input').val()+'</h1></div></article></li>');
		$('#todo_XXX').slideDown("fast");
		$('#input').val('');
		$('.sortable').sortable('cancel');
		$('#input').blur();
		activate_filter();
		setup_sortable();
	}
}

$(document).ready(function(){
	var data = ['#Finansliv','#iPhoneguiden','#MinaSidor','#BytBil','@Robin','@Fredrik','@Victor','@Andreas'];
	$('#input').autocomplete(data,{
			multiple: true,
			multipleSeparator: " "
	});
	
	var currentTime = new Date()
	$('#day').html(currentTime.getDate());
	$('#month').html(month_dic[''+(currentTime.getMonth()+1)]);
	
	$("header :date").dateinput({
		value: new Date(),
		firstDay: 1,
		selectors: true,
		format: 'yyyy-mm-dd',
		change: function() {
			$('#day').html(this.getValue('dd'));
			$('#month').html(month_dic[this.getValue('mm')]);
			toggle_date();
		}
	});
	
	
	
	if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) {
		$('#add_button').bind('touchend',add_todo);
		$('#add_tooltip').css('opacity',0.0);
	} else {
		$('#add_button').bind('click',add_todo);
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
			add_todo();
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
});