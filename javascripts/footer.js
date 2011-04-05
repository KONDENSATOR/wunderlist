var footer = {};


footer.lists_updated = function() {
	var data = wunderlist.lists;
	
	$('.cloud').remove();

	for(var keyword in data) {
		var cloud_data = {
			tag:data[keyword].name,
			id:data[keyword].id
		};
		
		var cloud = ich.footer_cloud_template(cloud_data);
				
		$('#footer').append(cloud);	
	}

	$(".cloud").each(function(index,object){
		$(object).callout({
		    msg:footer.callout_contents_for_object(object),
			todo_id:footer.clean($(object).attr('id'))
		});
		
		$(object).bind('click',function(e){
			if (window.isCommand) {
				footer.showcallout(object);
			}
		});
	});
}

footer.clean = function (string) {
	return string.replace('cloud_','');
}

footer.showcallout = function (object) {
	var id = footer.clean($(object).attr('id'));
	var callout_div_id = '#callout_'+id;
	$('.callout_main').not(callout_div_id).animate({opacity:0.0}, 300, function(){
		$('.callout_main').not(callout_div_id).css('display','none');
	});
	
	if ($(callout_div_id).css('opacity') == 0.0) {
		var top = $('#todo_list').position().top + $('#todo_list').height() - $(callout_div_id).height() + 30;
		$(callout_div_id).css('top',top);
		$(callout_div_id).css('display','block');
		$(callout_div_id).animate({opacity:1.0}, 300, function(){});
	} else {
		$(callout_div_id).animate({opacity:0.0}, 300, function(){
			$(callout_div_id).css('display','none');
		});
	}
}

footer.add_user_to_group = function (group) {
	alert('Add ' + $('#member_input_'+group).val() + ' to ' + group);
}

footer.remove_user_from_group = function (user,group) {
	alert('Remove ' + user + ' from ' + group);
}

footer.callout_contents_for_object = function(object) {
	var group = footer.clean($(object).attr('id'));
	
	var callout_contents = '<input class="add_group_member_input" id="member_input_'+group+'"><div class="add_member_button" onclick="footer.add_user_to_group(\''+group+'\');">+</div><br />';
	
	callout_contents += '<div id="callout_emails_'+$(object).text()+'"></div>';
	
	var users = ['robin@kondensator.se','frdrik@kondensator.se','victor@kondensator.se','andreas@kondensator.se','oscar@kondensator.se'];
	
	wunderlist.getSharedEmails($(object).text(),function(emails){
		alert($(object).text() + ': ' + emails.length);
		for (var i=0; i < emails.length; i++) {
			$('#callout_emails_'+$(object).text()).append('<div class="group_member">'+emails[i]+'<div class="remove_member_button" onclick="footer.remove_user_from_group(\''+emails[i]+'\',\''+group+'\');">–</div></div>');
		}
	});
	
	return callout_contents;
}

footer.init = function(){
	
	wunderlist.bindto_lists_updated(footer.lists_updated);
	
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
