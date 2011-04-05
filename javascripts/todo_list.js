var todo_list = {
	just_dragged:false
};

/*
 * Description
 */
todo_list.show_meta = function(meta_data_id) {
	$('#todo_list .meta_data').not(meta_data_id).slideUp("fast");
	if (!this.just_dragged) {
		if ($(meta_data_id).css('display') == 'none') {
			$(meta_data_id).slideDown("fast");
		} else {
			$(meta_data_id).slideUp("fast");
		}
	}
}

todo_list.activate_filter = function(filter_string) {
	if (filter_string == null) {
		filter_string = $('#input').val();
	} else {
		var tag_is_aleady_selected = ($('.cloud:contains('+filter_string+')').css('opacity') == 1.0 && $('.cloud').not(':contains('+filter_string+')').css('opacity') == 0.5)
		if (tag_is_aleady_selected) {
			$('.cloud').animate({opacity:1.0}, 300, function(){});
			filter_string = '';
		} else {
			$('.cloud').not(':contains('+filter_string+')').animate({opacity:0.5}, 300, function(){});
			$('.cloud:contains('+filter_string+')').animate({opacity:1.0}, 300, function(){});
			this.todo_list = filter_string;
		}
	}
	
	if (filter_string == '') {
		$('#todo_list li').slideDown("fast");
	} else {
		$('#todo_list li').not(':contains("'+filter_string+'")').slideUp("fast");
		$('#todo_list li:contains("'+filter_string+'")').slideDown("fast");
	}
}

todo_list.setup_sortable = function() {
		$('.sortable').sortable({
			axis:'y',
			start:function(){
				$('#todo_list .meta_data').slideUp("fast");
			},
			stop:function(){
				todo_list.just_dragged = true;
				setTimeout("todo_list.just_dragged = false;",100);
			},
			update:function(){
				var ids = [];
				$('#todo_list .todo .description_holder').each(function(index,object){
					ids.push($(object).parent().attr('id').replace('todo_',''));
				});

				// Report the new order here.
				todo_list.just_dragged = true;
				
				setTimeout("todo_list.just_dragged = false;",100);
			}
		});
}

todo_list.add_item = function(id, no_date, day, month, message) {
	var todo_data = {
		id: id,
		no_date: no_date,
		day: day == '0' ? '' : day,
		month: month == '0' ? '' : month,
		message: message
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
	
}

todo_list.add_todo = function() {
	if ($('#input').val() != '') {
		
		var id = $('.todo').length;		
		
		var no_date = $('#day').html() == '' ? 'no_date' : '';
		
		todo_list.add_item(id, no_date, $('#day').html(), $('#month').html(), $('#input').html())

		todo_list.activate_filter();
		todo_list.setup_sortable();
	}
}

todo_list.day_from_timestamp = function (date) {
	return '' + date.getDate();
}

todo_list.month_from_timestamp = function (date) {
	return month_dic[''+(date.getMonth()+1)];
}

todo_list.todo_items_updated = function() {
	for(var i in wunderlist.todo_items) {
		var itm = wunderlist.todo_items[i];
		var date_int = parseInt(itm.date*1000);
		var date = new Date(date_int);
		var date_day = date_int == 0 ? '' : todo_list.day_from_timestamp(date);
		var date_month = date_int == 0 ? '' : todo_list.month_from_timestamp(date);
		var no_date = date_int == 0 ? 'no_date' : '';
		
		todo_list.add_item(itm.id, no_date, date_day, date_month, itm.name);
	}
	
	todo_list.activate_filter();
	todo_list.setup_sortable();
}

todo_list.init = function() {
	wunderlist.bindto_todo_items_updated(todo_list.todo_items_updated);
}
