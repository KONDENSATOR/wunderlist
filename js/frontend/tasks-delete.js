var deleteTaskDialog;

/**
 * Delete a task from the list
 *
 * @author Dennis Schneider
 */
function deleteTask(deleteElement)
{
	var liElement = deleteElement.parent();
	var ulElement = liElement.parent();
	var taskId    = liElement.attr('id');
	var listId    = liElement.attr('rel');

	if (ulElement.children('li').length == 1 && liElement.find('.checked').length == 1)
	{
		var hElement = ulElement.prev();

		if (hElement.is('h3'))
			hElement.remove();

		ulElement.remove();
	}

	liElement.remove();

	wunderlist.deleteTaskById(taskId, listId);

	$('div#note a#cancel-note').click();

	filters.updateBadges();
}

/**
 * Open a prompt asking for the deletion of a task
 *
 * @author Dennis Schneider
 */
function openTaskDeletePrompt(deleteElement)
{
	var buttonsDeleteTask = {};
	buttonsDeleteTask[language.data.delete_task_no]  = function() {$(this).dialog('close')};
	buttonsDeleteTask[language.data.delete_task_yes] = function() {

		deleteTask(deleteElement);

		dialogs.closeDialog(deleteTaskDialog);
	};

	deleteTaskDialog = $('<div></div>')
		.dialog({
			autoOpen: false,
			draggable: false,
			modal: true,
			dialogClass: 'dialog-delete-task',
			title: language.data.delete_task_question,
			buttons: buttonsDeleteTask,
			open: function(event, ui) {
				$('.ui-dialog-buttonset button:last').focus();
			}
	});

	dialogs.openDialog(deleteTaskDialog);
}

$(function() {

	// Delete Button Mouse Over
	$(".mainlist li, .donelist li").live('mouseover', function () {

		description  = $(this).find("span.description");
		deletebutton = $(this).find('.delete');

		if(description.length == 1) {
			deletebutton.show();
		}
		else {
			deletebutton.hide();
		}

	});

	$(".mainlist li, .donelist li").live('mouseout', function () {
		$(this).find('.delete').hide();
	});

	// Delete function for the clicked task
    $("li span.delete").live('click', function() {
		var deleteElement = $(this);

        if (deleteTaskDialog == undefined || deleteTaskDialog.dialog('isOpen') == false)
        {
			var show_delete_task_prompt = parseInt(Titanium.App.Properties.getString('task_delete', '1'));

			if (show_delete_task_prompt === 1)
			{
				openTaskDeletePrompt(deleteElement);
			}
			else
			{
				deleteTask(deleteElement);
			}
        }
	});

});
