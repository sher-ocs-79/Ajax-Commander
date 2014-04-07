Ajax-Commander
==============

Ajax handler for a single or iterative request to the server

<b>Initialize our Commander</b>
<pre>$.AjaxCommander.init({url:'process-ajax.php'});</pre>

<b>Deal the Commander Callback</b><br />
Every single command must have a global scope javascript object where callback methods can be evaluated by the AjaxCommander.
In this example we have "Command_Message" object declared in callback-commands.js
Take note the variable 'Message' as our command identifier prefixed with 'Command_' accordingly.

<pre>
var Command_Message = {

    	showMessages: function(data) {
    		
    		$('div#messages_list').html(data.html).show();
    	},
    	addMessage: function(data){
    	
    		$('p#notification').html(data.html);
    	}
};
</pre>
	
