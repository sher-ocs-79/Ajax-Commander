<?php

$arrResponse = array();

$requested_commands = isset($_REQUEST['commands']) ? $_REQUEST['commands'] : array();  // POST/GET request

foreach($requested_commands as $command) {
	
	$function = $command['command'];
	$data = $command['data'];
	
	$return_data = $function($data);  // invoke a user defined function with a data parameter
	
	$callback_name = composeCallbackName($command);
	
	// return the 3 required parameters
	$arrResponse[] = array('cdata' => $return_data, 'command' => $callback_name, 'ctime' => $command['delay']);
}

$return = array('success' => !empty($arrResponse) ? TRUE : FALSE, 'response' => $arrResponse);

function getMessages($data) {

	// create your code to return the list of messages
	
	$content = '<ul>
					<li>Bob message</li>
					<li>Alice message</li>	
				</ul>';
	
	return array('html' => $content);  // return an array of any parameters you would like
}

function editProfile($data) {

	// create your code to update the profile data
	
	$content = '<p>Profile updated!<p>';
	
	return array('html' => $content);  // return an array of any parameters you would like
}

function composeCallbackName($command) {

	return $command['name'].'.'.$command['command'];  // callback name will be triggered by the javascript
}

header('Content-Type: application/json');  // required header content type by the jQuery ajax client
echo json_encode($return);

?>