<?php

class AjaxRequest_Processor
{
    const COMMANDER = 'commander';
    const SERVICE_PREFIX = 'AjaxRequest_Service_';
	
    private $_request;

    public function __construct($request)
    {
        $this->_request = $request;
    }

    public function process()
    {
		require_once('Base.php');
	
        $commands = $this->_request[self::COMMANDER];

        try
        {
            if (empty($commands) || !is_array($commands)) {
                throw new Exception('No commands provided or invalid request type');
            }

            if (!isset($commands[0])) {
                $commands = array($commands);
            }

            $arrResponse = array();
			
            foreach($commands as $command) {

                $commandName = isset($command['name']) ? $command['name'] : '';
                $commandTime = isset($command['delay']) ? $command['delay'] : '';

				require_once('service/'.$commandName.'.php');
				
                $classCommandRequest = self::SERVICE_PREFIX.$commandName;
                if (!class_exists($classCommandRequest)) {
                    continue;
                }
                /**
                 * @var $objComReq Et_AjaxRequest_Base
                 */
                $objComReq = new $classCommandRequest($command);
                $arrResponse[] = array('command' => $objComReq->getCommand(), 'ctime' => $commandTime, 'cdata' => $objComReq->returnData());
            }

            $return = array('success' => TRUE, 'response' => $arrResponse);
        }
        catch (Exception $err)
        {
            $return = array('success' => FALSE, 'message' => $err->getMessage());
        }

        return json_encode($return);
    }
}