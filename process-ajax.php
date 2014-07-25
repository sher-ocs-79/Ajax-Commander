<?php

include_once('ajax-processor/Processor.php');

$objReqProcessor = new AjaxRequest_Processor($_REQUEST);

header('Content-Type: application/json');  // required header content type by the jQuery ajax client
echo $objReqProcessor->process();

?>