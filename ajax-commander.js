/**
 * AjaxCommander
 * @author SherOcs <sher_ocs@yahoo.com>
 * @link https://github.com/sher-ocs-79/Ajax-Commander
 * @copyright 2014
 * @license BSD
 * @version 1.1.2
 */
(function(root, factory) {

    root.AjaxCommander = factory(root, root.jQuery);

}(this, function(root, $) {

    var AjaxCommander = function()
    {
        var com_config = {
            url: '/',  // request url
            delay_default: 1,                    // 1 second default command execution
            delay_timeout: 1000,                 // execute commander every 1 milliseconds (1sec)
            maximum_delay: 60,                   // allow only less than 60secs
            debug: true,                         // display debug messages
            beforeSend: '__init'                 // a method being called before an ajax command executed
        };

        var commands_heap;
        var commands_que;

        com_clock = 0;  // time delay clock

        var __initCommands = function(type) {
            if (type == 'heap') {
                commands_heap = {};
            } else if (type == 'que') {
                commands_que = {};
            }
        };

        var __isCommandExist = function(name, command, delay) {

            exist = 0;
            if (typeof name == 'object') {
                name = name.name;
                command = name.command;
                delay = name.delay;
            }
            if (commands_heap && commands_heap[delay]) {
                var c_heap = commands_heap[delay];
                oCount = com_object_count(c_heap);
                for(var i=0; i<oCount; i++) {
                    if ((name == c_heap[i].name) && (command == c_heap[i].command)) {
                        exist = 1; break;
                    }
                }
            }
            return exist;
        };

        var __moveQueToHeap = function() {

            if (!com_object_count(commands_que)) return;

            if (!com_object_count(commands_heap)) {

                __console.log('ALL QUE COMMANDS MOVED TO HEAP');
                commands_heap = commands_que;

                __initCommands('que');  // emptying the que since it had already transferred to heap

            } else {

                for(var c in commands_que) {
                    var c_que = commands_que[c];
                    for(var i=0; i<c_que.length; i++) {
                        var objCommand = c_que[i];
                        if (!__isCommandExist(objCommand)) {

                            __console.log('QUE COMMAND MOVED TO HEAP: ' + objCommand.name+'.'+objCommand.command);
                            if (commands_heap[objCommand.delay]) {
                                commands_heap[objCommand.delay].push(objCommand);
                            } else {
                                commands_heap[objCommand.delay] = [objCommand];
                            }

                            c_que.splice(i, 1);
                            __moveQueToHeap();
                            break;
                        }
                    }
                    commands_que[c] = c_que;
                }
            }
        };

        var __addToQue = function(objCommand) {

            if (!commands_que) return;

            exist = 0;

            if (com_object_count(commands_que[objCommand.delay])) {
                var c_que = commands_que[objCommand.delay];
                for(var i=0; i<c_que.length; i++) {
                    if ((objCommand.name == c_que[i].name) && (objCommand.command == c_que[i].command)) {
                        exist = 1; break;
                    }
                }
                if (!exist) { // command does not exist, let's add a new one
                    commands_que[objCommand.delay].push(objCommand);
                } else {  // command exist, so just overwrite with the new data property
                    c_que[i].data = objCommand.data;
                    commands_que[objCommand.delay] = c_que;
                }
            } else {
                commands_que[objCommand.delay] = [objCommand];
            }

            __console.log('COMMAND ADDED IN QUE: '+objCommand.name+'.'+objCommand.command);
        };

        var __getCommandsToProcess = function() {

            __moveQueToHeap();

            var process_commands = [];

            if (com_object_count(commands_heap)) {

                __console.log('WAITING SCHEDULED COMMANDS TO PROCESS...');

                for (var c in commands_heap) {
                    sc = com_clock % c ? 0 : 1;  // scheduled command
                    if (sc) {
                        var c_heap = commands_heap[c];
                        for(var i=0; i<c_heap.length; i++) {
                            var objCommand = c_heap[i];
                            if (!objCommand.locked) {

                                process_commands.push(objCommand);

                                __console.log('SET LOCK COMMAND: '+objCommand.name+'.'+objCommand.command);
                                c_heap[i].locked = 1;
                            }
                        }
                        commands_heap[c] = c_heap;
                    }
                }
            }
            return process_commands;
        };

        var __postProcessCommand = function(command, delay) {

            if (typeof command == 'object') {
                delay = command.delay;
                name = command.name;
                command = command.command;
            } else {
                var c = command.split('.');
                name = c[0];
                command = c[1];
            }

            if (!commands_heap[delay]) return;

            var c_heap = commands_heap[delay];
            for(var i=0; i<c_heap.length; i++) {
                var objCommand = c_heap[i];
                if (objCommand.name == name && objCommand.command == command) {

                    if (!objCommand.persistent) {

                        __console.log('REMOVED COMMAND: ' + objCommand.name+'.'+objCommand.command);
                        c_heap.splice(i, 1);

                    } else {

                        __console.log('RELEASED LOCK COMMAND: '+objCommand.name+'.'+objCommand.command);
                        c_heap[i].locked = 0;
                    }

                    break;
                }
            }
            commands_heap[delay] = c_heap;
        };

        var __preProcessCommand = function(command) { // A user defined pre-process before ajax executed
            for(var i=0; i<command.length; i++) {

                var o = eval("Command_" + command[i].name);
                var p = com_config.beforeSend;

                if (typeof o == 'object' && o.hasOwnProperty(p)) {
                    eval("o."+p+"(command[i].command, command[i].data)");
                    __console.log('PRE-PROCESS COMMAND EVALUATED: Command_'+command[i].name+'.'+p);
                }
            }
        };

        var __evaluateCommand = function(com_response_data) {

            cdata = com_response_data.cdata;
            if (com_response_data.command) {
                try {
                    eval('Command_' + com_response_data.command + '(cdata);');
                } catch(e) {
                    __console.log(e);
                }
                __console.log('COMMAND EVALUATED: '+com_response_data.command);
            }
            __postProcessCommand(com_response_data.command, com_response_data.ctime);
        };

        var __execCommands = function() {

            com_clock++;

            try
            {
                var process_commands = __getCommandsToProcess();
                if (process_commands.length) {

                    __console.log('TOTAL COMMANDS TO PROCESS: '+process_commands.length);

                    __preProcessCommand(process_commands);

                    var _data = {commands:process_commands};
                    var _params = {url:com_config.url, data:_data, type:'post', dataType:'json'};
                    var _success = function(data) {
                        if (data.success) {

                            __console.log('EVALUATING COMMANDS');
                            for(var i=0; i<data.response.length; i++) {
                                __evaluateCommand(data.response[i])
                            }
                        } else {
                            __console.log('FATAL ERROR: ' + data.message);
                        }
                    };
                    $.ajax(_params).done(_success).fail(function(data) {

                        __console.log('EXECUTING FAILOVER POST PROCESS COMMANDS');
                        for(var i=0; i<process_commands.length; i++) {
                            __postProcessCommand(process_commands[i]);
                        }
                    })
                }
            }
            catch(e)
            {
                __console.log(e);
            }

            window.setTimeout(__execCommands, com_config.delay_timeout);
        };

        var __console = {
            log: function(msg) {
                if (com_config.debug) {
                    console.log(msg);
                }
            }
        };

        /** PUBLIC METHODS  **/

        this.init = function(config) {

            com_config = $.extend(com_config, config || {});

            __initCommands('heap');
            __initCommands('que');
            __execCommands();
        };

        this.addCommand = function(name, param) {

            name = name || '';
            command = (param && param.command) || '';

            persistent = (typeof param.persistent == 'undefined') ? false : param.persistent;
            c_delay = (typeof param.delay == 'undefined') ? com_config.delay_default : param.delay;

            if (c_delay > com_config.maximum_delay) return;  // temporarily allow only less than 60 seconds delay

            if (!__isCommandExist(name, command, c_delay)) {

                __addToQue({
                    name: name,
                    command: command,
                    persistent: persistent,
                    delay: c_delay,
                    locked: 0,
                    data: (param && param.data) || ''
                });
            }
        };

        this.removeCommand = function(commandName) {

            var c = commandName.split('.');
            name = c[0];
            command = c[1];

            for(var x in commands_heap) {
                var c_heap = commands_heap[x];
                for(var i=0; i<c_heap.length; i++) {
                    if (c_heap[i].name == name && c_heap[i].command == command) {

                        __console.log('COMMAND REMOVED IN HEAP: ' + c_heap[i].name+'.'+c_heap[i].command);

                        c_heap.splice(i, 1); break;
                    }
                }
                commands_heap[x] = c_heap;
            }
        };

        this.getHeapCommands = function() {
            return commands_heap;
        };

        this.setConfig = function(config) {
            com_config = $.extend(com_config, config || {});
        }
    };

    function com_object_count(o)
    {
        var count = 0;

        if (typeof o == 'object') {
            if (Object.keys) {
                count = Object.keys(o).length;
            } else {
                for (var i in o) {
                    if (o.hasOwnProperty(i)) {
                        count++;
                    }
                }
            }
        } else if (o) {
            count = o.length;
        }

        return count;
    }

    var ajaxcommander = new AjaxCommander();

    if (typeof $ !== "undefined") {
        // binding object to jQuery
        $.AjaxCommander = ajaxcommander;
    }

    return ajaxcommander;

}));