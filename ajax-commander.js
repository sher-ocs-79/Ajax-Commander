/**
 * AjaxCommander
 * @author SherOcs <sher_ocs@yahoo.com>
 * @link https://github.com/sher-ocs-79/Ajax-Commander
 * @copyright 2014
 * @license BSD
 * @version 1.2.1
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
            debug: false,                        // display debug messages if true
            beforeSend: '__init',                // a method being called before an ajax command executed
            event_prefix: 'commander_',          // prefix for user triggered event
			commander_prefix: 'Commander_'		 // prefix for the commander callback
        };

        var commands_heap;
        var commands_que;
        var commands_events;     // user triggered events

        var commands_state_callback = {};   // user events state callback

        com_clock = 0;  // time delay clock

        var __initCommands = function(type) {
            if (type == 'heap') {
                commands_heap = {};
            } else if (type == 'que') {
                commands_que = {};
            } else if (type == 'events') {
                commands_events = {};
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

        var __moveEventToQue = function() {
            if (!com_object_count(commands_events)) return;

            for(var e in commands_events) {  // each event will be pushed to que directly

                if (!commands_events[e]) { continue; }

                if (com_object_count(commands_que[commands_events[e].delay])) {
                    commands_que[commands_events[e].delay].push(commands_events[e]);
                } else {
                    commands_que[commands_events[e].delay] = [commands_events[e]];
                }

                __executeEventState('que', e);
            }

            __initCommands('events');  // emptying the events since it had already transferred to que
        };

        var __addToEvent = function(event_id, objEvent, objEventData) {

            if (!com_object_count(objEvent)) return;

            objEvent.persistent = false;
            objEvent.delay = com_config.delay_default;
            objEvent.locked = 0;
            objEvent.data = objEventData;
            objEvent.event_id = event_id;

            if (commands_events[event_id]) {
                commands_events[event_id] = false;    // note: it overwrites previous same event
            }
            commands_events[event_id] = objEvent;
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

                                if (objCommand.event_id) {
                                    __executeEventState('process', objCommand.event_id);
                                }
                            }
                        }
                        commands_heap[c] = c_heap;
                    }
                }
            }
            return process_commands;
        };

        var __postProcessCommand = function(command_obj, response_data) {

            if (command_obj.name) {
                name = command_obj.name;
                command = command_obj.command;
                delay = command_obj.delay
            } else {
                var _c = command_obj.command.split('.');
                name = _c[0];
                command = _c[1];
                delay = command_obj.ctime;
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

                    if (objCommand.event_id) {
                        __executeEventState('complete', objCommand.event_id, response_data);
                    }

                    break;
                }
            }
            commands_heap[delay] = c_heap;
        };

        var __preProcessCommand = function(command) { // A user defined pre-process before ajax executed
            for(var i=0; i<command.length; i++) {

                var o = eval(com_config.commander_prefix + command[i].name);
                var p = com_config.beforeSend;

                if (typeof o == 'object' && o.hasOwnProperty(p)) {
                    eval("o."+p+"(command[i].command, command[i].data)");
                    __console.log('PRE-PROCESS COMMAND EVALUATED: '+com_config.commander_prefix+command[i].name+'.'+p);
                }
            }
        };

        var __evaluateCommand = function(com_response_data) {

            cdata = com_response_data.cdata;
            if (com_response_data.command) {
                try {
                    eval(com_config.commander_prefix + com_response_data.command + '(cdata);');
                    __postProcessCommand(com_response_data, cdata);
                } catch(e) {
                    __console.log(e);
                }
                __console.log('COMMAND EVALUATED: '+com_response_data.command);
            }
        };

        var __execCommands = function() {

            com_clock++;

            __moveEventToQue();

            try
            {
                var process_commands = __getCommandsToProcess();
                if (process_commands.length) {

                    __console.log('TOTAL COMMANDS TO PROCESS: '+process_commands.length);

                    __preProcessCommand(process_commands);

                    var _data = {commander:process_commands};
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
                            __postProcessCommand(process_commands[i], data);
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

        var __executeEventState = function(state, event_id, response_data) {

            __console.log('ON '+state+' STATE : '+event_id);

            try
            {
                var state_callback = commands_state_callback[event_id] || {};
                if (state_callback.hasOwnProperty(state)) {
                    response_data = response_data || {};
                    eval('state_callback.'+state+'(response_data);');
                }
            }
            catch(e)
            {
                console.log(e);
            }
        };

        var __extractEventData = function(e_data, e_obj, e_obj_data) {

            // extracting commander data (data-commander_*) or plain data (data-*)

            var e_prefix = com_config.event_prefix;
            var e_keys = ['name', 'command'];
            var str_keys = e_keys.join(' ');

            for (var i in e_data) {
                if (eval("i.search(/"+ e_prefix +"/gi) >= 0")) {  // commander data
                    var f_key = eval("str_keys.match(/"+ i.substr(e_prefix.length) +"/i)");
                    if (f_key) {
                        e_obj[f_key] = e_data[i];
                    }
                } else {  // plain data
                    e_obj_data[i] = e_data[i];
                }
            }
        };

        var __extractElementData = function(element, e_data) {

            // extracting form element data

            for(i=0; i<element.length; i++) {
                var e = element[i];
                if (typeof e.name != 'undefined') {     // not div element
                    if (e.nodeName != 'FORM') {         // not form element
                        if (e.name == "") { continue }
                        if (e.type && (e.type == 'radio')) {   // input:radio element
                            if (e.checked) {
                                e_data[e.name] = e.value;
                            }
                        } else if (e.type && (e.type == 'checkbox')) {   // input:checkbox element
                            if (e.checked) {
                                if (typeof e_data[e.name] == 'undefined') {
                                    e_data[e.name] = [e.value];
                                } else {
                                    e_data[e.name].push(e.value);
                                }
                            }
                        } else {   // input:text element
                            e_data[e.name] = e.value;
                        }
                    } else {
                        __extractElementData(e.elements, e_data);   // if form element loop through its element
                    }
                }
            }
        };

        /** PUBLIC METHODS  **/

        this.init = function(config) {

            com_config = $.extend(com_config, config || {});

            __initCommands('heap');
            __initCommands('que');
            __initCommands('events');
            __execCommands();
        };

        this.executeEvent = function(element, state_callback) {
            if (typeof element == 'object') {

                var e_prefix = com_config.event_prefix;

                var e_obj = {};
                var e_obj_data = {};

                try
                {
                    if (typeof element.jquery != 'undefined') {
                        e_data = element.get(0).dataset;  // jquery function .get()
                    } else {
                        e_data = element;
                    }

                    e_id = e_data.hasOwnProperty(e_prefix+"id") ? eval("e_data."+e_prefix+"id") : Math.random().toString(36).substring(2);

                    if (state_callback && typeof state_callback == 'object') {
                        commands_state_callback[e_id] = state_callback;
                    }
                    __executeEventState('ready', e_id);

                    __extractEventData(e_data, e_obj, e_obj_data);
                    __extractElementData(element, e_obj_data);
                    __addToEvent(e_id, e_obj, e_obj_data);
                }
                catch(e)
                {
                    console.log(e);
                }
            }
        };

        this.addCommand = function(name, param) {

            name = name || '';
            command = (param && param.command) || '';

            persistent = (typeof param.persistent == 'undefined') ? false : param.persistent;
            c_delay = (typeof param.delay == 'undefined') ? com_config.delay_default : param.delay;

            if (c_delay > com_config.maximum_delay) return;  // temporarily allow only less than 60 seconds delay

            if (!__isCommandExist(name, command, c_delay)) {  // checking command if already in heap, if not then add to que

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