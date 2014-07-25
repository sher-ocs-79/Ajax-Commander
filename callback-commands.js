/**
 * A commander object evaluated by the AjaxCommander to render/manipulate ajax returned data
 * @name Commander_Message
 * @types {{showMessages: Function}, {addMessage: Function}}
 */
var Commander_Message = {
	__init: function(command, data) {
	
	},
	showMessages: function(data) {
		
		$('div#messages_list').html(data.html).show();
	},
	addMessage: function(data){
	
		$('p#notification').html(data.html);
	},
	searchMessage: function(data) {
		
		$('div#searched_messages_list').html(data.html).show();
	}
};