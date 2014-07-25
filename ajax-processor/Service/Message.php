<?php

class AjaxRequest_Service_Message extends AjaxRequest_Base
{
	private $_messages_list = array();
	
	public function __construct($command) 
	{	
		parent::__construct($command);
	
		$messages_list = array('Hey Bob!','How are you Alice?','What the Foo!','Nice to meet you Bar.');
		
		session_start();
		
		if (!isset($_SESSION['messages']) || empty($_SESSION['messages'])) {
			$_SESSION['messages'] = $messages_list;
		}
		
		$this->_messages_list = $_SESSION['messages'];		
	}
	
    public function returnData()
    {
        $return = array();
            
		if (!is_null($this->getData('action', NULL))) {
            switch($this->data['action']) {
				case 'show-messages' :
					$return = $this->_showMessages();
					break;
				case 'add-message' :
					$return = $this->_addMessage();
					break;
				case 'search-message' :
					$return = $this->_searchMessage();
					break;
			}
		}
		
        return $return;
    }
	
	private function _showMessages() 
	{			
		$data = $this->data;
		
		$limit = isset($data['limit']) ? $data['limit'] : 0;
		
		$content = '<ul>';
		foreach($this->_messages_list as $message) {
			$content .= "<li>{$message}</li>";
		}
		$content .= '</ul>';	
		
		return array('html' => $content);  // return an array of any parameters you would like
	}

	private function _addMessage() 
	{
		$data = $this->data;
		
		if (isset($data['message']) && !empty($data['message'])) {
		
			array_push($this->_messages_list, $data['message']);
			$_SESSION['messages'] = $this->_messages_list;
		}
		
		$content = '<p>Message Added!<p>';
		
		return array('html' => $content);  // return an array of any parameters you would like
	}
	
	private function _searchMessage()
	{
		$data = $this->data;
		$searched_messages = array();
		$query = $this->getData('query', '');
		
		if (!empty($query)) {
			foreach($this->_messages_list as $message) {
				if(stristr($message, $data['query']) !== FALSE) {
					array_push($searched_messages, $message);
				}
			}
		}
		
		$content = '<ul>';
		foreach($searched_messages as $message) {
			$content .= "<li>{$message}</li>";
		}
		$content .= '</ul>';	
		
		return array('html' => $content);  // return an array of any parameters you would like
	}
}