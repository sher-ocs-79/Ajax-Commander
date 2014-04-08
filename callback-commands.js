/**
 * A commander object evaluated by the AjaxCommander to render/manipulate ajax returned data
 * @name Command_Message
 * @types {{showMessages: Function}, {addMessage: Function}}
 */
var Command_Message = {
	showMessages: function(data) {
		
		$('div#messages_list').html(data.html).show();
	},
	addMessage: function(data){
	
		$('p#notification').html(data.html);
	}
};