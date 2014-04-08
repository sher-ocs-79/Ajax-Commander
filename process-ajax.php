<?php

$arrResponse = array();

$requested_commands = isset($_REQUEST['commands']) ? $_REQUEST['commands'] : array();  // POST/GET request

foreach($requested_commands as $command) {

	$return_data = array();
	
	$callback_name = composeCallbackName($command);
	
	$className = $command['name'];
	$function = $command['command'];
	$data = $command['data'];
	
	$model = new $className();
	if ($model instanceof Message) {
		$return_data = $model->$function($data);  // invoke a user defined function with a data parameter
	}
	
	// return the 3 required parameters
	$arrResponse[] = array('cdata' => $return_data, 'command' => $callback_name, 'ctime' => $command['delay']);
}

$return = array('success' => !empty($arrResponse) ? TRUE : FALSE, 'response' => $arrResponse);

// ---------- BELOW IS JUST A SAMPLE IMPLEMENTATION TO SEND RESPONSE DATA -------------//

class Message
{
	private $messages_list;
	
	public function __construct() 
	{	
		$messages_list = array('Hey Bob!','How are you Alice?','What the Foo!','Nice to meet you Bar.');
		
		session_start();
		
		if (!isset($_SESSION['messages']) || empty($_SESSION['messages'])) {
			$_SESSION['messages'] = $messages_list;
		}
		
		$this->messages_list = $_SESSION['messages'];
	}

	public function showMessages($data) 
	{		
		// create your own code here to return the list of messages
				
		$limit = isset($data['limit']) ? $data['limit'] : 0;
		
		$content = '<ul>';
		foreach($this->messages_list as $message) {
			$content .= "<li>{$message}</li>";
		}
		$content .= '</ul>';	
		
		return array('html' => $content);  // return an array of any parameters you would like
	}

	public function addMessage($data) 
	{
		// create your own code here to return the list of messages
		
		if (isset($data['message']) && !empty($data['message'])) {
		
			array_push($this->messages_list, $data['message']);
			$_SESSION['messages'] = $this->messages_list;
		}
		
		$content = '<p>Message Added!<p>';
		
		return array('html' => $content);  // return an array of any parameters you would like
	}
}

function composeCallbackName($command) {

	return $command['name'].'.'.$command['command'];  // callback name will be triggered by the javascript
}

header('Content-Type: application/json');  // required header content type by the jQuery ajax client
echo json_encode($return);

?>