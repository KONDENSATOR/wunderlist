var todo_list = {
	last_cloud_tag:'',
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
			this.last_cloud_tag = '';
		} else {
			$('.cloud').not(':contains('+filter_string+')').animate({opacity:0.5}, 300, function(){});
			$('.cloud:contains('+filter_string+')').animate({opacity:1.0}, 300, function(){});
			this.last_cloud_tag = filter_string;
		}
	}
	
	if (filter_string == '') {
		$('#todo_list li').slideDown("fast");
	} else {
		$('#todo_list li').not(':contains('+filter_string+')').slideUp("fast");
		$('#todo_list li:contains('+filter_string+')').slideDown("fast");
	}
}

todo_list.setup_sortable = function() {
		$('.sortable').sortable({
			axis:'y',
			start:function(){
				$('#todo_list .meta_data').slideUp("fast");
			},
			stop:function(){
				this.just_dragged = true;
				setTimeout("this.just_dragged = false;",100);
			},
			update:function(){
				var ids = [];
				$('#todo_list .todo .description_holder').each(function(index,object){
					ids.push($(object).parent().attr('id').replace('todo_',''));
				});

				// Report the new order here.

				this.just_dragged = true;
				setTimeout("this.just_dragged = false;",100);
			}
		});
}

todo_list.init = function() {
	this.setup_sortable();
}
