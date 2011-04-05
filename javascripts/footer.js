var footer = {};


footer.keywords_updated = function() {
	var data = wunderlist.keywords();
	
	$('.cloud').remove();

	for(var keyword in data) {
		var cloud_data = {
			tag:data[keyword]
		};
		
		var cloud = ich.footer_cloud_template(cloud_data);
		
		p(cloud_data);
		
		$('#footer').append(cloud);	
	}
}


footer.init = function(){
	wunderlist.bindto_keywords_updated(footer.keywords_updated);
	
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
