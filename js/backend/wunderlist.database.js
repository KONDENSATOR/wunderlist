var wunderlist = wunderlist || {
	meta_tags:null,
	bound_keywords_updated:[],
	
	todo_items:null,
	bound_todo_items_updated:[]
};

var p = Titanium.API.debug;

function print(obj){
	var ostring = Titanium.JSON.stringify(obj);
	
	Titanium.API.debug(ostring);
}

var meta = {
	types:{
		/**
		 * Meta definitions
		 *
		 * @author Fredrik Andersson
		 */
		defs: {
			times: 	{ 	keyword:false, regex:['(§\[[^\\]]+\\])'] },
			tags: 	{ 	keyword:true, regex:['(#\[[^\\]]+\\])','(#[^\\s]+)'] },
			users: 	{ 	keyword:true, regex:['(@[^\\s]+)'] },
			emails: { 	keyword:true, regex:['((\\w+[\\-\\.])*\\w+@(\\w+\\.)+[A-Za-z]+)'] },
			authors:{	keyword:true, regex:['(\\>[^\\s]+)'] }
		},
		
		/**
		 * Fetcn value for definition named
		 *
		 * @author Fredrik Andersson
		 */
		named:function(name){
			return this.defs[name];
		},
		/**
		 * Iterate through all key, values
		 *
		 * @author Fredrik Andersson
		 */
		each:function(f) {
			for(var key in this.defs) {
				f(key, this.defs[key]);
			}
		},
		
		/**
		 * Iterate through all keys
		 *
		 * @author Fredrik Andersson
		 */
		each_key:function(f) {
			for(var key in this.defs) {
				f(key);
			}
		},
		
		/**
		 * Iterate through all and return array
		 *
		 * @author Fredrik Andersson
		 */
		to_array:function(f) {
			var result = [];
			this.each(function(key, val) {
				result.push(f(key,val));
			});
			return result;
		}
	},

	/**
	 * Create regex object for type pattern.
	 *
	 * @author Fredrik Andersson
	 */
	regexfor:function(type) {		
		var regex_string = "(^|\\s)(" + this.meta.types.named(type).regex.join('|') + ")";
		
		return new RegExp(regex_string);
	},
	
	/**
	 * Create one large regex from all regexes.
	 *
	 * @author Fredrik Andersson
	 */
	regex:function(){
		if(this.regex_obj == null) {
			var regex_str = "(^|\\s)(" + this.types.to_array(function(name, value) { 
					return value.regex.join('|');
				}).join('|') + ")";
			this.regex_obj = new RegExp(regex_str);
		}
		return this.regex_obj;
	},
	
	/**
	 * Extracts meta from textstring. All metas are returned in
	 * lowercase.
	 *
	 * @author Fredrik Andersson
	 */
	meta_from_string:function(str){
		
		var regex = meta.regex();
		var text = str;
		var match = regex.exec(text);
		var matches = [];
		
		// Collect metas
		while(match != null){
			// Titanium.API.debug("got match");
			var result = trim(match[0],"\\s\\.,");

			matches.push(result);

			text = text.replace(result, "");
			match = regex.exec(text);
		}

		var result = { };
		
		this.types.each_key(function(key){ result[key] = []; });
		
		var on_regex = this.regexfor;
		
		var on_each = function(key) {
			if(itm.match(on_regex(key))){
				result[key].push(itm);
			}
		};
		
		for(var m in matches) {
			var itm = matches[m].toLowerCase();
			
			this.types.each_key(on_each);
		}
				
		return result;
	}
};

$(function() {
	wunderlist.initAppTitle();
	wunderlist.initDatabase();
	
	// Start the neccessary updates
	updater.init();
	
	language.init();
	account.init();
	timer.init();
	// Menu.initializeTrayIcon();
	sharing.init();
	notifications.init();
	// share.init();
});

function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}
 
function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

wunderlist.poke_keywords_updated_subscribers = function() {
	for(var i in this.bound_keywords_updated) {
		bound_keywords_updated[i]();
	}
}

wunderlist.bindto_keywords_updated = function(func) {
	this.bound_keywords_updated.push(func);
	
	if(this.meta_tags != null){
		func();
	}
}

wunderlist.poke_bindto_todo_items_subscribers = function() {
	for(var i in this.bound_todo_items_updated) {
		this.bound_todo_items_updated[i]();
	}
}

wunderlist.bindto_todo_items_updated = function(func) {
	this.bound_todo_items_updated.push(func);
	
	if(this.todo_items != null){
		func();
	}
}

/**
 * Returns all valid keywords
 *
 * @author Fredrik Andersson
 */
wunderlist.keywords = function() {
	var data = wunderlist.meta_tags;
	var result = [];
	
	for(var key in data.tags){ result.push(key); }
	for(var key in data.users){ result.push(key); }
	for(var key in data.emails){ result.push(key); }
	
	return result;
}

/**
 * Add tags to this.users, this.tags, this.emails
 *
 * @author Fredrik Andersson
 */
wunderlist.append_meta_tags = function(tags) {
	var addTags = function(src, dest) {
		for(var i in src) {
			var tag = src[i];

			if(dest[tag] == null){
				dest[tag] = 1;
			} else {
				dest[tag] += 1;
			}
		}
	}
	
	for(var key in tags) {
		if(this.meta_tags[key] == null) {
			this.meta_tags[key] = {};
		}
		addTags(tags[key], this.meta_tags[key]);
	}
	this.poke_keywords_updated_subscribers();
}

/**
 * Fetches all tags from database and count the number of times 
 * each tag is used. Type can be 'tags', 'users' or 'emails'
 *
 * @author Fredrik Andersson
 */
wunderlist.fetch_all_meta_tags = function(type) {
	var sql  = "SELECT " + type + " ";
	    sql += "FROM tasks ";

	var resultSet = this.database.execute(sql);

    var result = {};

    if (resultSet.rowCount() > 0) {
		while(resultSet.isValidRow()) {
			var tags = resultSet.field(0);
			
			var metas = Titanium.JSON.parse(tags);
						
			for(var key in metas) {
				if(result[key] == null){
					result[key] = {};
				}
				
				for(var subkey in metas[key]){
					
					var meta_value = metas[key][subkey];
										
					if(result[key][meta_value] == null){
						result[key][meta_value] = 1;
					} else {
						result[key][meta_value] += 1;
					}
				}
			}
			
	        resultSet.next();
		}
	}
	
	return result;
}

/**
 * Extends application title with current version
 *
 * @author Christian Reber
 */
wunderlist.initAppTitle = function() {
	document.title = 'Awesomelist';
}



/**
 * Creates the database file and all tables
 *
 * @author Dennis Schneider, Daniel Marschner, Christian Reber
 */
wunderlist.initDatabase = function() {
	var filepath = Titanium.Filesystem.getFile(Titanium.Filesystem.getApplicationDataDirectory(), 'wunderlist.db');
	this.database = Titanium.Database.openFile(filepath);

	if(Titanium.App.Properties.hasProperty('prefinal_first_run') == false)
	{
		var sql 	= "DROP TABLE IF EXISTS lists";
		this.database.execute(sql);
		sql 		= "DROP TABLE IF EXISTS tasks";
		this.database.execute(sql);
		Titanium.App.Properties.setString('prefinal_first_run', '1');
	}
	
	this.database.execute("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, online_id INTEGER DEFAULT 0, name TEXT, position INTEGER DEFAULT 0, version INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0, inbox INTEGER DEFAULT 0)");
	this.database.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, online_id INTEGER DEFAULT 0, name TEXT, list_id TEXT, note TEXT DEFAULT '', date INTEGER DEFAULT 0, done_date INTEGER DEFAULT 0, done INTEGER DEFAULT 0, position INTEGER DEFAULT 0, important INTEGER DEFAULT 0, version INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0, 'meta' TEXT DEFAULT '')");

	// Initialize tags lookup
	this.meta_tags = this.fetch_all_meta_tags('meta');
	
	this.poke_keywords_updated_subscribers();	
}

/**
 * Is needed for the new update (shared lists) 17.12.2010
 *
 * @author Daniel Marschner
 */
wunderlist.update_110 = function() {
	try {
		this.database.execute('ALTER TABLE "main"."lists" ADD COLUMN "shared" INTEGER DEFAULT 0');
	}
	catch(err) {}
};

/**
 * Is needed for the new update (shared lists) 24.12.2010
 *
 * @author Daniel Marschner
 */
wunderlist.update_111 = function() {
	try {
		this.database.execute('ALTER TABLE "main"."lists" ADD COLUMN "shared" INTEGER DEFAULT 0');
	}
	catch(err) {}
};

/**
 * Is needed for the new update (push) 17.02.2011
 *
 * @author Dennis Schneider
 */
wunderlist.update_120 = function() {
	try {
		this.database.execute('ALTER TABLE "main"."tasks" ADD COLUMN "push" INTEGER DEFAULT 0');
		this.database.execute('ALTER TABLE "main"."tasks" ADD COLUMN "push_ts" INTEGER DEFAULT 0');		
	}
	catch(err) {}
};

wunderlist.update_120_kondensator = function() {
	try {
		this.database.execute("ALTER TABLE 'main'.'tasks' ADD COLUMN 'meta' TEXT DEFAULT ''");
	}
	catch(err) {}
}

/**
 * Creates the standard database calls
 *
 * @author Daniel Marschner, Christian Reber, Dennis Schneider
 */
wunderlist.createDatabaseStandardElements = function(only_tutorials)
{
	var resultSet = this.database.execute("SELECT id FROM lists WHERE id = '1' AND lists.deleted = 0 LIMIT 1");
	if(resultSet.rowCount() == 0 || only_tutorials == true)
	{
		// Only clear database, if complete start
		if (only_tutorials != true)
		{
			// Truncate database and create inbox
			wunderlist.truncateDatabase();
			this.database.execute("INSERT INTO lists (name, id, inbox) VALUES ('" + language.data.inbox + "', '1', '1')");
			save_last_opened_list('2');
		}

		var tutorials_list_id = this.createList(language.data.tutorials);

		// Generate Default Tasks
		this.database.execute("INSERT INTO tasks (name, list_id, position, important) VALUES ('" + language.data.default_task_1 + "', '" + tutorials_list_id + "', '0', '1')");
		
		// Check if var os is set
		if (os == undefined)
			var os = Titanium.Platform.name.toLowerCase();
		
		// Default Tasks for Mac
		if (os == 'darwin')
		{
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_2_mac, tutorials_list_id, '1');
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_5_mac, tutorials_list_id, '4');
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_6_mac, tutorials_list_id, '5');
		}
		// Default Tasks for other operating systems
		else
		{
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_2, tutorials_list_id, '1');
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_5, tutorials_list_id, '4');
			this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_6, tutorials_list_id, '5');
		}

		this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_4, tutorials_list_id, '2');
		this.database.execute("INSERT INTO tasks (name, list_id, position) VALUES (?, ?, ?)", language.data.default_task_8, tutorials_list_id, '3');

		done_date = new Date().getTime() / 1000;
		this.database.execute("INSERT INTO tasks (name, list_id, position, done, done_date) VALUES (?, ?, ?, ?, ?)", language.data.default_task_7, tutorials_list_id, '4', '1', done_date);

		// Load the new list (only if users recreates tutorials)
		if (only_tutorials == true)
		{
			timer.stop().set(15).start();
			return tutorials_list_id;
		}
	}
}

/**
 * Recreate tutorial tasks
 *
 * @author Christian Reber
 */
wunderlist.recreateTutorials = function()
{
	var tutorials_list_id = wunderlist.createDatabaseStandardElements(true);
	save_last_opened_list(tutorials_list_id);
	account.loadInterface();
}

/**
 * Truncates the whole database
 *
 * @author Dennis Schneider
 */
wunderlist.truncateDatabase = function()
{
	this.database.execute("DELETE FROM lists");
	this.database.execute("DELETE FROM tasks");
	this.database.execute("DELETE FROM sqlite_sequence WHERE name = 'lists'");
	this.database.execute("DELETE FROM sqlite_sequence WHERE name = 'tasks'");
}

/**
 * Load all lists from database
 *
 * @author Dennis Schneider
 * @author Daniel Marschner
 */
wunderlist.initLists = function()
{
	var listsResultSet = this.database.execute("SELECT lists.id, lists.name, lists.inbox, (SELECT COUNT(tasks.id) FROM tasks WHERE tasks.list_id = lists.id AND deleted = 0 AND done = 0) as taskCount, shared FROM lists WHERE lists.deleted = 0 ORDER BY lists.inbox DESC, lists.position ASC");

	 $('div#lists').html('');

	while(listsResultSet.isValidRow())
	{
		var list = {
			'id':			listsResultSet.field(0),
			'name':			unescape(listsResultSet.field(1)),
			'inbox':		listsResultSet.field(2),
			'taskCount':	listsResultSet.field(3),
			'shared':       listsResultSet.field(4)
		};

		var html_code = '';

		if(list['inbox'] == 1)
		{
 			html_code = "<a id='" + list['id'] + "' class='list'><span>" + list.taskCount + "</span><div class='editp'></div></div><b class='inbox'>" + list['name'] + "</b></a>";
		}
 		else
		{
			if(list['shared'] == 0)
			{
				html_code = "<a id='" + list['id'] + "' class='list sortablelist'><span>" + list.taskCount + "</span><div class='deletep'></div><div class='editp'></div><div class='savep'></div><b>" + list['name'] + "</b></a>";
			}
			else
			{
				html_code = "<a id='" + list['id'] + "' class='list sortablelist'><span>" + list.taskCount + "</span><div class='deletep'></div><div class='editp'></div><div class='savep'></div><b class='shared'>" + list['name'] + "</b></a>";
			}
		}

		$("#lists").append(html_code);

		if(list['name'].length > 30)
		{
			$('div#sidebar a#' + list['id']).children('b').attr('title', list['name']);
		}

		listsResultSet.next();
    }
}

wunderlist.getTasksByResultSet = function(resultTaskSet){

	var tasks = {};
	var k     = 0;
	while(resultTaskSet.isValidRow())
	{
		tasks[k] = {};
		for(var i = 0; i < resultTaskSet.fieldCount(); i++) {
			var field_name = resultTaskSet.fieldName(i);
			
			if(field_name == meta){
				tasks[k][field_name] = Titanium.JSON.parse(resultTaskSet.field(i));
			} else {
				tasks[k][field_name] = resultTaskSet.field(i);
			}
		}
		resultTaskSet.next();
		k++;
	}

	return tasks;
}

wunderlist.updateTodoListItems = function(items) {
	this.todo_items = items;
	
	this.poke_bindto_todo_items_subscribers();
}

/**
 * Gets the tasks of the specified list
 * 
 * @author Dennis Schneider
 * @modified Fredrik Andersson
 */
wunderlist.getTasksByListId = function(list_id)
{
	var resultTaskSet = this.database.execute("SELECT * FROM tasks WHERE list_id = ? AND deleted = 0 AND done = 0 ORDER BY important DESC, position ASC", list_id);

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultTaskSet));
}

/**
 * Gets the tasks of the specified user
 * 
 * @author Fredrik Andersson
 */
wunderlist.getTasksByUser = function(user_name)
{
	var resultTaskSet = this.database.execute("SELECT * FROM tasks WHERE name LIKE '%" +user_name+ "%' AND deleted = 0 AND done = 0 ORDER BY important DESC, position ASC");

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultTaskSet));
}

wunderlist.getTasks = function() {
	var resultTaskSet = this.database.execute("SELECT * FROM tasks WHERE deleted = 0 AND done = 0 ORDER BY important DESC, position ASC");

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultTaskSet));
}


/**
 * Checks for existing list
 *
 * @author Daniel Marschner
 */
wunderlist.listExistsById = function(list_id)
{
	var countSet = this.database.execute("SELECT * FROM lists WHERE id = '" + list_id + "' AND deleted = 0");
	return (countSet.rowCount() > 0) ? true : false;
}


/**
 * Calculates the difference between the current and the given date
 *
 * @author Dennis Schneider
 */
wunderlist.calculateDayDifference = function(done)
{
	var today   = new Date();

	// One day in seconds
	var one_day = 86400;

	var unceiled_days = ((today.getTime() / 1000) - done) / (one_day);

	if(unceiled_days > 1)
		// Calculate difference btw the two dates, and convert to days
		return Math.floor(unceiled_days);
	else
		return 0;
}

/**
 * Live search function
 *
 * @author Dennis Schneider
 */
wunderlist.liveSearch = function(search)
{
    $("#content").html("");

	var resultSet = this.query("SELECT * FROM tasks WHERE (name LIKE '%" + search + "%' OR note LIKE '%" + search + "%') AND tasks.deleted = 0 ORDER BY done ASC, important DESC, date DESC");
	
	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultSet));
}

/**
 * Execute a query in the database
 *
 * @author Dennis Schneider
 */
wunderlist.query = function(query)
{
    return this.database.execute(query);
}


/**
 * Creates a task with the given name, list_id and timestamp
 *
 * @author Dennis Schneider
 * @updated Fredrik Andersson
 */
wunderlist.createTask = function(name, list_id, timestamp)
{
	var alltags = meta.meta_from_string(name);
	
	this.append_meta_tags(alltags);
	
	print(this.meta_tags);
	
	if(timestamp == '') timestamp = 0;

    // Get current position
	var resultSet = this.database.execute("SELECT position FROM tasks WHERE list_id = '" + list_id + "' AND tasks.deleted = 0 ORDER BY position DESC LIMIT 1");
	if(resultSet.isValidRow())
		var position = resultSet.field(0);
	else
		var position = 0;

	if(position > 0)
		var new_position = position + 1;
	else
		var new_position = 0;

 	this.database.execute("INSERT INTO tasks (name, list_id, date, position, version, meta) VALUES ('"
 		+ name + "', '" 
		+ list_id + "', '" 
		+ timestamp + "', '" 
		+ new_position + "', '0','" 
		+ Titanium.JSON.stringify(alltags) + "')");

	wunderlist.updateCount(list_id);

	timer.stop().set(15).start();

	return this.database.lastInsertRowId;
}

/**
 * Returns the last ID of lists
 *
 * @author Christian Reber
 */
wunderlist.getLastIdOfLists = function() {
	var resultSet = this.database.execute("SELECT id FROM lists ORDER BY id DESC LIMIT 1");
	return (resultSet.isValidRow()) ? resultSet.field(0) : 0;
}

/**
 * Returns the highest position of lists
 *
 * @author Dennis Schneider
 */
wunderlist.getLastPositionOfLists = function() {
	var resultSet = this.database.execute("SELECT position FROM lists WHERE deleted = 0 ORDER BY position DESC LIMIT 1");
	return (resultSet.isValidRow()) ? resultSet.field(0) : 0;
}

/**
 * Returns the online_id of a list
 *
 * @author Daniel Marschner
 */
wunderlist.getListOnlineIdById = function(list_id) {
	var resultSet = this.database.execute("SELECT online_id FROM lists WHERE id = ?", list_id);

	if(resultSet.isValidRow())
	{
		online_id = resultSet.field(0);

		if(online_id > 0)
			list_id = online_id;
	}

	return list_id;
}

/*
 * Fetches the online id of a list by the given online id
 *
 * @author Dennis Schneider
 */
wunderlist.getListIdByOnlineId = function(list_id)
{
	var resultSet = this.database.execute("SELECT id FROM lists WHERE online_id = ?", list_id);

	if(resultSet.isValidRow())
		return resultSet.field(0)

	return list_id;
}

/*
 * Fetches the online id of a list by the given list id
 *
 * @author Dennis Schneider
 */
wunderlist.getOnlineIdByListId = function(list_id)
{
	var resultSet = this.database.execute("SELECT online_id FROM lists WHERE id = ?", list_id);

	if(resultSet.isValidRow())
	{
		return resultSet.field(0);
	}

	return 0;
}

/**
 * Check if task or list already exists
 *
 * @author Dennis Schneider
 */
wunderlist.elementExists = function(online_id, type)
{
	var resultSet = this.database.execute("SELECT id FROM '" + type + "' WHERE online_id = ?", online_id);

	if(resultSet.rowCount() > 0)
		return true;
	else
		return false;
}

/**
 * Check if task or list is deleted (hidden)
 *
 * @author Dennis Schneider
 */
wunderlist.elementIsDeleted = function(online_id, type)
{
	var resultSet = this.database.execute("SELECT deleted FROM '" + type + "' WHERE online_id = ? AND deleted = 1", online_id);

	if(resultSet.rowCount() > 0)
		return true;
	else
		return false;
}

/**
 * Delete elements, which are never synced but set to deleted
 *
 * @author Dennis Schneider
 */
wunderlist.deleteNotSyncedElements = function()
{
	this.database.execute("DELETE FROM tasks WHERE deleted = 1 AND online_id = 0");
	this.database.execute("DELETE FROM lists WHERE deleted = 1 AND online_id = 0");
	filters.updateBadges();
}

/**
 * Deletes a task or list really
 *
 * @author Dennis Schneider
 */
wunderlist.deleteElementForever = function(online_id, type)
{
	this.database.execute("DELETE FROM '" + type + "' WHERE online_id = ?", online_id);
}

/**
 * Update a task name
 *
 * @author Dennis Schneider
 */
wunderlist.updateTask = function(task_id, name, date)
{
	var alltags = meta.meta_from_string(name);
	
	this.append_meta_tags(alltags);
	
	if(date == '') date = 0;
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET name = ?, date = ?, version = version + 1, meta = ? WHERE id = ?", 
		name, 
		date, 
		Titanium.JSON.stringify(alltags), 
		task_id);
}

/**
 * Update a task by given online id
 *
 * @author Dennis Schneider
 */
wunderlist.updateTaskByOnlineId = function(online_id, name, date, done, list_id, position, important, done_date, deleted, version, note)
{
	var alltags = meta.meta_from_string(name);
	
	this.append_meta_tags(alltags);

	if(date == '') date = 0;
	this.database.execute("UPDATE tasks SET name = ?, date = ?, done = ?, list_id = ?, position = ?, important = ?, done_date = ?, deleted = ?, version = ?, note = ?, meta = ? WHERE online_id = ?", 
		name, 
		date, 
		done, 
		list_id, 
		position, 
		important, 
		done_date, 
		deleted, 
		version, 
		note,
		Titanium.JSON.stringify(alltags),
		online_id);
}

/**
 * Update a task by given online id
 *
 * @author Dennis Schneider
 */
wunderlist.createTaskByOnlineId = function(online_id, name, date, done, list_id, position, important, done_date, deleted, version, note)
{
	var alltags = meta.meta_from_string(name);
	
	this.append_meta_tags(alltags);

	if(date == '') date = 0;
	this.database.execute("INSERT INTO tasks (online_id, name, date, done, list_id, position, important, done_date, deleted, version, note, meta) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
		online_id, 
		name, 
		date, 
		done, 
		list_id, 
		position, 
		important, 
		done_date, 
		deleted, 
		version, 
		note,
		Titanium.JSON.stringify(alltags)
		);
}

/**
 * Update a task position
 *
 * @author Dennis Schneider
 */
wunderlist.updateTaskPosition = function(task_id, position)
{
    this.database.execute("UPDATE tasks SET position = ?, version = version + 1 WHERE id = ?", position, task_id);
    timer.stop().set(15).start();
}

/**
 * Update a task id
 *
 * @author Dennis Schneider
 */
wunderlist.updateTaskId = function(id, online_id)
{
	this.database.execute("UPDATE tasks SET online_id = ? WHERE id = ?", online_id, id);
	if(wunderlist.elementIsDeleted(id, 'tasks'))
		wunderlist.deleteElementForever(id, 'tasks');
}

/**
 * Update a task list id
 *
 * @author Dennis Schneider
 */
wunderlist.updateTaskListId = function(id, online_id)
{
	this.database.execute("UPDATE tasks SET list_id = ? WHERE list_id = ?", online_id, id);
}

/**
 * Get the note for the specified task
 * 
 * @author Dennis Schneider
 */
wunderlist.getNoteForTask = function(task_id)
{
	var resultSet = this.database.execute("SELECT note FROM tasks WHERE id = ?", task_id);

	if(resultSet.isValidRow())
	{
		return resultSet.field(0);
	}

	return '';
}

/**
 * Save the note for the specified task
 *
 * @author Dennis Schneider
 */
wunderlist.saveNoteForTask = function(note_text, task_id)
{
	this.database.execute("UPDATE tasks SET note = ?, version = version + 1 WHERE id = ?", note_text, task_id);

	timer.stop().set(15).start();
}

/**
 * Check if the list is already shared
 *
 * @author Dennis Schneider
 */
wunderlist.listIsAlreadyShared = function(list_id)
{
	var resultSet = this.database.execute("SELECT shared FROM lists WHERE id = ? AND shared = 1", list_id);

	if(resultSet.isValidRow() && resultSet.rowCount() > 0)
	{
		return true;
	}

	return false;
}

/**
 * Checks if the list has an online id
 *
 * @author Dennis Schneider
 */
wunderlist.isAlreadySynced = function(list_id)
{
	var resultSet = this.database.execute("SELECT online_id FROM lists WHERE online_id != 0 AND id = ?", list_id);

	if(resultSet.isValidRow())
	{
		return true;
	}

	return false;
}

/**
 * Set the list to shared
 *
 * @author Dennis Schneider
 */
wunderlist.setListToShared = function(list_id)
{
	var resultSet = this.database.execute("UPDATE lists SET shared = 1, version = version + 1 WHERE id = ?", list_id);
	return true;
}

/**
 * Set the list to unshared
 *
 * @author Dennis Schneider
 */
wunderlist.setListToUnShared = function(list_id)
{
	var resultSet = this.database.execute("UPDATE lists SET shared = 0, version = version + 1 WHERE id = ?", list_id);

	if(resultSet.isValidRow())
	{
		return true;
	}

	return false;
}

/**
 * Set a task to done
 *
 * @author Dennis Schneider
 */
wunderlist.taskDone = function(task_id, list_id, isFilter)
{
	if(isFilter == undefined)
	{
		isFilter = false;
	}
	
	done_date = Math.round(new Date().getTime() / 1000);
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET done = 1, done_date = ?, version = version + 1 WHERE id = ?", done_date, task_id);
	
	// If it is not a filter site, just update the done state of the task
	if(isFilter == false)
	{
		this.updateCount(list_id);
	}
	// If it is a filter / search site, update all tasks
	else
	{
		var resultSet = this.database.execute("SELECT id FROM lists");
		var listIDs   = [];
		
		while(resultSet.isValidRow())
		{	
			listIDs.push(resultSet.field(0));
			resultSet.next();
		}
		
		for(id in listIDs)
		{
			this.updateCount(listIDs[id]);
		}
	}
}

/**
 * Set a task to undone
 *
 * @author Dennis Schneider
 */
wunderlist.taskUndone = function(task_id, list_id, isFilter)
{
	if(isFilter == undefined)
	{
		isFilter = false;
	}	
	
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET done = 0, done_date = 0, version = version + 1 WHERE id = ?", task_id);

	// If it is not a filter site, just update the done state of the task
	if(isFilter == false)
	{
		this.updateCount(list_id);
	}
	// If it is a filter / search site, update all tasks
	else
	{
		var resultSet = this.database.execute("SELECT id FROM lists");
		var listIDs   = [];
		
		while(resultSet.isValidRow())
		{	
			listIDs.push(resultSet.field(0));
			resultSet.next();
		}
		
		for(id in listIDs)
		{
			this.updateCount(listIDs[id]);
		}
	}
}

/**
 * Set a task to important
 *
 * @author Dennis Schneider
 */
wunderlist.setImportant = function(task_id)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET important = 1, position = 0, version = version + 1 WHERE id = ?", task_id);
}

/**
 * Set a task to unimportant
 *
 * @author Dennis Schneider
 */
wunderlist.setUnimportant = function(task_id)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET important = 0, version = version + 1 WHERE id = ?", task_id);
}

/**
 * Create a new list in the database
 *
 * @author Dennis Schneider
 */
wunderlist.createList = function(name)
{
	var new_position = this.getLastPositionOfLists() + 1;
	this.database.execute("INSERT INTO lists (name, version, position) VALUES (?, ?, ?)", name, '0', new_position);
	timer.stop().set(15).start();
	return this.database.lastInsertRowId;
}

/**
 * Update a list name
 *
 * @author Dennis Schneider
 */
wunderlist.updateList = function(list_id, list_name)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE lists SET name = ?, version = version + 1 WHERE id = ?", list_name, parseInt(list_id));
}

/**
 * Update a list id
 *
 * @author Dennis Schneider
 */
wunderlist.updateListId = function(id, online_id)
{
	this.database.execute("UPDATE lists SET online_id = ? WHERE id = ?", online_id, id);
}

/**
 * Update a list position
 *
 * @author Dennis Schneider
 */
wunderlist.updateListPosition = function(list_id, position)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE lists SET position = ?, version = version + 1 WHERE id = ?", position, list_id);
}

/**
 * Update a list by given id
 *
 * @author Dennis Schneider
 */
wunderlist.updateListByOnlineId = function(id, name, deleted, position, version, inbox, shared)
{
	this.database.execute("UPDATE lists SET name = ?, deleted = ?, position = ?, version = ?, inbox = ?, shared = ? WHERE online_id = ?", name, deleted, position, version, inbox, shared, id);
}

/**
 * Update a list by given token
 *
 * @author Dennis Schneider
 */
wunderlist.createListByOnlineId = function(id, name, deleted, position, version, inbox, shared)
{
	this.database.execute("INSERT INTO lists (online_id, name, deleted, position, version, inbox, shared) VALUES(?, ?, ?, ?, ?, ?, ?) ", id, name, deleted, position, version, inbox, shared);
}

/**
 * Delete a list by the given id
 *
 * @author Dennis Schneider
 */
wunderlist.deleteListById = function(list_id)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE lists SET deleted = 1, version = version + 1 WHERE id = ?", list_id);
	this.database.execute("UPDATE tasks SET deleted = 1, version = version + 1 WHERE list_id = ?", list_id);
	filters.updateBadges();
}

/**
 * Update the count of the list
 *
 * @author Dennis Schneider
 */
wunderlist.updateCount = function(list_id)
{
	this.database.execute("SELECT id FROM tasks WHERE list_id = '" + list_id + "' AND done = 0 AND deleted = 0");
	$('div#lists a#' + list_id + ' span').html(this.database.rowsAffected);
}

/**
 * Update the list id of a task
 *
 * @author Dennis Schneider
 */
wunderlist.updateTaskList = function(task_id, list_id)
{
	timer.stop().set(15).start();
	var resultSet = this.database.execute("SELECT position FROM tasks WHERE list_id = '" + list_id + "' AND tasks.deleted = 0 ORDER BY position DESC LIMIT 1");
	var position = 0;
	if(resultSet.isValidRow())
		position = resultSet.field(0) + 1;

	this.database.execute("UPDATE tasks SET list_id = ?, position = ?, version = version + 1 WHERE id = ?", parseInt(list_id), parseInt(position), parseInt(task_id));
	this.updateCount(list_id);
}

/**
 * Sets a task to deleted
 *
 * @author Dennis Schneider
 */
wunderlist.deleteTaskById = function(task_id, list_id)
{
	timer.stop().set(15).start();
	this.database.execute("UPDATE tasks SET deleted = 1, version = version + 1 WHERE id = '" + task_id + "'");
	this.updateCount(list_id);
}

/**
 * Get the task number for today or overdue
 *
 * @author Dennis Schneider
 */
wunderlist.getBadgeCount = function(filter_name)
{
	var sql = "SELECT id AS count FROM tasks WHERE ";

	var current_date  = html.getWorldWideDate();

	switch(filter_name)
	{
		case 'today':
			sql += "tasks.date = " + current_date + " AND tasks.date != 0 AND tasks.done = 0 AND tasks.deleted = 0";
			break;
			
		case 'overdue':
			sql += "tasks.done = 0 AND tasks.date < " + current_date + " AND tasks.date != 0 AND tasks.deleted = 0";
			break;
			
		default:
			break;
	}
  	var resultSet = this.query(sql);
  	return resultSet.rowCount();
}

/**
 * Gets a list by a given id (offline_id)
 *
 * @author Dennis Schneider
 * @author Daniel Marschner
 * @modified Fredrik Andersson
 */
wunderlist.getListById = function(list_id)
{
	var resultListSet = wunderlist.query("SELECT id, name FROM lists WHERE id = '" + list_id + "' AND lists.deleted = 0");

	var list = {
		'id':   resultListSet.field(0),
		'name': resultListSet.field(1)
	};

	// Select the list tasks
	var sql  = "SELECT * ";
	    sql += "FROM tasks ";
	    sql += "WHERE tasks.list_id = '" + list['id'] + "' AND tasks.done = 0 AND tasks.deleted = 0 ";
	    sql += "ORDER BY tasks.important DESC, tasks.position ASC";

	var resultTaskSet = wunderlist.database.execute(sql);

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultTaskSet));
}

/**
 * Gets a list by given task id
 *
 * @author Daniel Marschner
 */
wunderlist.getListIdsByTaskId = function(task_id)
{
	var list = {};

	var resultTaskSet = this.database.execute("SELECT list_id FROM tasks WHERE id = ?", task_id);

	if(resultTaskSet.isValidRow())
	{
		var resultListSet = this.database.execute("SELECT id, online_id FROM lists WHERE lists.id = ?", resultTaskSet.field(0));

		if(resultListSet.isValidRow())
		{
			list['id'] 		  = resultListSet.field(0);
			list['online_id'] = resultListSet.field(1);
		}
	}

	return list;
}

/**
 * Gets a list name by given list id
 *
 * @author Daniel Marschner
 */
wunderlist.getListNameById = function(list_id)
{
	var sql  = "SELECT lists.name ";
		sql += "FROM lists ";
		sql += "WHERE lists.id = '" + list_id + "'";

	var resultSet = this.database.execute(sql);

	if(resultSet.isValidRow())
		return resultSet.field(0);
	else
		return undefined;
}

/*
 * Filters tasks by a given type
 *
 * @author Dennis Schneider
 * @modified Fredrik Andersson
 */
wunderlist.getFilteredTasks = function(type, date_type) {

	var sql  = "SELECT * ";
		sql += "FROM tasks ";

	current_date = html.getWorldWideDate();

	switch(type)
	{
		case 'starred':
			sql 	 += "WHERE tasks.important = 1 AND tasks.done = 0 AND tasks.deleted = 0 ";
			break;

		case 'today':
			sql 	 += "WHERE tasks.date = " + current_date + " AND tasks.date != 0 AND tasks.done = 0 AND tasks.deleted = 0 ";
			break;

		case 'tomorrow':
			sql 	 += "WHERE tasks.date = " + (current_date + 86400) + " AND tasks.done = 0 AND tasks.deleted = 0 AND tasks.deleted = 0 ";
			break;

		case 'thisweek':
			sql 	 += "WHERE tasks.date BETWEEN " + current_date + " AND " + (current_date + (86400 * 7)) + " AND tasks.done = 0 AND tasks.date != 0 AND tasks.deleted = 0 ";
			break;

		case 'done':
			sql 	 += "WHERE tasks.done = 1 AND tasks.deleted = 0 ";
			break;

		case 'all':
			sql 	 += "WHERE tasks.done = 0 AND tasks.deleted = 0 ";
			break;

		case 'overdue':
			sql 	 += "WHERE tasks.done = 0 AND tasks.date < " + current_date + " AND tasks.date != 0 AND tasks.deleted = 0 ";
			break;

		case 'date':
			var temp_date_type = date_type;
			if (date_type == 'nodate') {
				date      = 0;
				date_type = '=';
			} else {
				date = (current_date + 86400);
				date_type = '>';
			}
			sql += "WHERE tasks.date " + date_type + " " + date + " AND tasks.done = 0 AND tasks.deleted = 0 ";
			break;
	}

	sql += "ORDER BY tasks.important DESC, tasks.date DESC";

	var resultSet = this.database.execute(sql);

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultSet));
}

/**
 * Get filtered tasks for printing
 *
 * @author Dennis Schneider
 */
wunderlist.getFilteredTasksForPrinting = function(type, date_type)
{
	var resultSet = wunderlist.getFilteredTasks(type, date_type, true);

	var tasks = {};
	var k     = 0;
	
	while(resultSet.isValidRow())
	{
		tasks[k] = {};
		for(var i = 0; i < resultSet.fieldCount(); i++)
		{

			tasks[k][resultSet.fieldName(i)] = resultSet.field(i);
		}
		resultSet.next();
		k++;
	}

	return tasks;
}

/**
 * Creates a user in the properties
 *
 * @author Dennis Schneider
 */
wunderlist.createUser = function(email, password)
{
	Titanium.App.Properties.setString('logged_in', 'true');
	Titanium.App.Properties.setString('email', email.toString());
	Titanium.App.Properties.setString('password', password.toString());
}

/**
 * Sets the user to logout
 *
 * @author Dennis Schneider
 */
wunderlist.logUserOut = function()
{
	Titanium.App.Properties.setString('logged_in', 'false');
	wunderlist.deleteUserCredentials();
}

/**
 * Checks if the user is logged in
 *
 * @author Dennis Schneider
 */
wunderlist.isUserLoggedIn = function()
{
	logged_in = Titanium.App.Properties.getString('logged_in', 'false');
	if (logged_in == 'true')
		return true;
	else
		return false;
}

/**
 * Gets the user credentials
 *
 * @author Dennis Schneider
 */
wunderlist.getUserCredentials = function()
{
	values = {
		'email': Titanium.App.Properties.getString('email', ''),
		'password': Titanium.App.Properties.getString('password', '') // encrypted !
	};

 	return values;
}


/**
 * Removes the user credentials
 *
 * @author Dennis Schneider
 */
wunderlist.deleteUserCredentials = function()
{
	Titanium.App.Properties.setString('email', '');
	Titanium.App.Properties.setString('password', '');
}

/**
 * Gets all data for the sync process
 *
 * @author Dennis Schneider
 * @modified Fredrik Andersson
 */
wunderlist.getDataForSync = function(type, fields, where, return_object)
{
	if(type == undefined)
  		type = 'lists';

	if(return_object == undefined)
		return_object = true;
	
	if(fields == undefined)
		fields = '*'

	if(type == 'tasks' & fields == "*")
		fields = 'id, online_id, name, list_id, note, date, done_date, done, position, important, version, deleted'

    var sql  = "SELECT " + fields + " FROM " + type;

	if(where != undefined)
		sql += ' WHERE ' + where;

    var resultSet = wunderlist.query(sql);

	values = {};
	i = 0;

    while(resultSet.isValidRow())
    {
    	if(return_object)
			values[i] = {};

		if(return_object)
			for(var y = 0, max = resultSet.fieldCount(); y < max; y++)
				values[i][resultSet.fieldName(y)] = resultSet.field(y);

		if(!return_object)
			for(var y = 0, max = resultSet.fieldCount(); y < max; y++)
				values[resultSet.fieldName(y)] = resultSet.field(y);

		i++;
		resultSet.next();
	}

	return values;
}

/**
 * Gets the last done tasks
 *
 * @todo Shorten the method, it's too long
 * @author Dennis Schneider
 * @modified Fredrik Andersson
 */
wunderlist.getLastDoneTasks = function(list_id)
{
	var sql  = "SELECT * ";
	    sql += "FROM tasks ";
	    sql += "WHERE tasks.done = 1 AND list_id = '" + list_id + "' AND tasks.deleted = 0 ";
	    sql += "ORDER BY tasks.done_date DESC";

	var resultSet = this.database.execute(sql);

	wunderlist.updateTodoListItems(this.getTasksByResultSet(resultSet));
}

wunderlist.isArray = function(value)
{
	if (typeof value === 'object' && value && value instanceof Array)
		return true;

	return false;
}
