Ajax-Commander
==============

Is a javascript library used for invoking/removing single or heavy iterative AJAX request to the server in a much more handy and elegant way. The beauty of this library is to control the overhead Ajax by packing up different independent request into one and sends it to the server for processing. For instance when getting notifications (messages, friend request, etc...) plus getting the list of friends, list of messages, etc... you definitely ends up of having different Ajax timely request to each. It would be much complicated when you support to turn on/off each of them as desired by the user, callbacks will be injected everywhere and there resulting hard to manage isn't it? Now the Commander will makes our life easier by dealing the complexity to manage heavy iterative Ajax request.

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
	
<pre>removeCommand(name)</pre>
Description: Is use to halt an active routine command in order to stop requesting data in the server.

Parameters:
* name String - Format: identifier.command
	
<b>Execute a Command</b>
<br />
Use Case: Fetching new messages every 5 seconds.
<pre>$.AjaxCommander.addCommand('Message', {command:'showMessages', persistent:true, delay:5, data:{limit:10}});</pre>

Use Case: Adding a new messsage in the list.
<pre>$.AjaxCommander.addCommand('Message', {command:'addMessage', data:{message: $('input#message').val()}});</pre>

Use Case: Stop fetching or receiving new messages.
<pre>$.AjaxCommander.removeCommand('Message.showMessages');</pre>
