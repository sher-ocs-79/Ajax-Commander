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

<b>Commander Methods<b>
<pre>addCommand(identifier, configs)</pre>
Description: Is use to set a command to be executed on a timely routine or single call.
Parameters: <br />
* identifier String
* configs Object
	* command String - A command name that is used to trigger a callback method.
	* persistent Boolean - TRUE if an iterative ajax request, FALSE if not (just a single request), default is FALSE.
	* delay Integer - If iterative, the delay determines every time (in second) it executes a request.
	* data Object - A user defined parameters for the server to process the data sent.
	
<pre>removeCommand(identifier)</pre>
Description: Is use to halt an active routine command in order to stop requesting data in the server.
Parameters: <br />
* identifier String
	
<b>Execute a Command</b>
<br />
Use Case: Fetching new messages every 5 seconds.
<pre>$.AjaxCommander.addCommand('Message', {command:'showMessages', persistent:true, delay:5, data:{limit:10}});</pre>

Use Case: Adding new messsage
<pre>$.AjaxCommander.addCommand('Message', {command:'addMessage', data:{message: $('input#message').val()}});</pre>

Use Case: Stop fetching messages
<pre>$.AjaxCommander.removeCommand('Message.showMessages');</pre>
