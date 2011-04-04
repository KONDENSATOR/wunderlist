var footer = {};

footer.init = function(){
	var function_expand = function(){
		$('#footer').animate({
			height: 140
		}, 300, function(){
			$('#footer').css('overflow','auto');
			$('#show_more').html('⬇');
			$('#show_more').unbind('click');
			$('#show_more').click(function_contract);
		});
		$('#todo_list').animate({
			bottom: 140
		}, 300, function(){});
	};
	
	var function_contract = function(){
		$('#footer').animate({
			height: 40
		}, 300, function(){
			$('#footer').css('overflow','hidden');
			$('#show_more').html('⬆');
			$('#show_more').unbind('click');
			$('#show_more').click(function_expand);
		});
		$('#todo_list').animate({
			bottom: 40
		}, 300, function(){});
	};
	
	$('#show_more').click(function_expand);
};
