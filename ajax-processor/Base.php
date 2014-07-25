<?php

abstract class AjaxRequest_Base
{
    protected $data;
    protected $command;

    abstract public function returnData();

    public function __construct($command)
    {
        $this->data = $command['data'];

        if (isset($command['command'])) {
            $this->command = $command['name'] . '.' . $command['command'];
        }
    }

    public function getFormData()
    {
        $formData = array();

        if (isset($this->data['formData']) && !empty($this->data['formData'])) {
            $data = urldecode($this->data['formData']);
            parse_str($data, $formData);
        }

        return $formData;
    }

    public function getCommand()
    {
        return $this->command;
    }

    public function getData($index, $default = NULL)
    {
        if (!empty($index)) {
            return isset($this->data[$index]) && !empty($this->data[$index]) ? $this->data[$index] : $default;
        } else {
            return $this->data;
        }
    }
}