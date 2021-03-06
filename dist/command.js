'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodashStringRepeat = require('lodash/string/repeat');

var _lodashStringRepeat2 = _interopRequireDefault(_lodashStringRepeat);

var _option = require('./option');

var _option2 = _interopRequireDefault(_option);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var argv = undefined,
    env = undefined,
    program = undefined;

var Command = (function () {

  /*
      constructor
      @param parent    program
      @param config    globalConfig
       @Event start     Check if is current command
                       Call parseOptions to parse options
                       run _runAction()
       @Event --help    Check if is current command or if all commands
                       Call parseOptions to parse options
                       run context.help()
    */

  function Command(parent, config) {
    _classCallCheck(this, Command);

    var self = this;
    program = parent;
    argv = process.AURELIA.argv || config.argv;
    this.program = program;
    this._readyCallbacks = [];

    program.on('start', function (payload) {
      if (payload.commandId === self.context.commandId || payload.commandId === self.context.alias) {
        self._runAction();
      }
    });

    program.on('--help', function (payload) {
      if (payload.all || payload.commandId === self.context.commandId || payload.commandId === self.context.alias) {
        self._runHelp(payload.all);
      }
    });

    return this;
  }

  _createClass(Command, [{
    key: 'createContext',

    /*
        Create context
        @param ClassConstruction {Class Constructor} The CustomCommand Constructor.
        @param commandId    {String}      The name of the command;
     */
    value: function createContext(ClassConstruction, commandId) {

      ClassConstruction.commandId = ClassConstruction.commandId || commandId;
      ClassConstruction.argv = ClassConstruction.argv || argv;
      ClassConstruction._flags = ClassConstruction._flags || [];
      ClassConstruction._args = ClassConstruction._args || argv._.slice(1) || [];
      ClassConstruction.options = ClassConstruction.options || {};
      ClassConstruction._inject = ClassConstruction._inject || [];

      this.context = ClassConstruction;
      return this.context;
    }
  }, {
    key: '_onEvent',

    // Handles events bound to the specific command
    value: function _onEvent(proto, evt) {
      program.on(evt, (function (payload) {
        this.context[proto].bind(this.context)(payload);
      }).bind(this));
    }
  }, {
    key: 'option',

    /*
        Set options on the ClassConstruction.__flags for later parsing
     */
    value: function option() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var self = this;
      this.context._flags.push(new _option2['default'](this.context, args));
      return this;
    }
  }, {
    key: 'args',

    /*
        Set args on the ClassConstruction.__args for later parsing
     */
    value: function args() {
      for (var _len2 = arguments.length, _args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        _args[_key2] = arguments[_key2];
      }

      this.context.__args = this.context.__args || _args;
      return this;
    }
  }, {
    key: 'alias',

    /*
        Set the alias on the ClassConstruction.alias
     */
    value: function alias(str) {
      this.context._alias = str;
      if (argv._[0] === this.context.alias && argv._[0] !== this.context.commandId) {
        argv._[0] = this.context.commandId;
      }
      return this;
    }
  }, {
    key: 'description',

    /*
        Set the description on the ClassConstruction._description
     */
    value: function description(text) {
      this.context._description = text;
      return this;
    }
  }, {
    key: '_runAction',

    /*
        Parse the context
        Run   instance.canExecute()
        then  instance.beforAction()
        then  instance.action()
        then  instance.afterAction()
        catch instance.onError()
     */
    value: function _runAction() {
      var self = this;
      var instance = this.parse();

      return _bluebird2['default'].resolve().then(function () {
        return instance.canExecute.call(instance, instance.args, instance.options);
      }).then(function (canExecute) {
        if (canExecute) return instance.beforeAction.call(instance, instance.args, instance.options);
      }).then(function (before) {
        return instance.action.call(instance, instance.args, instance.options, before);
      }).then(function (result) {
        return instance.afterAction.call(instance, instance.args, instance.options, result);
      })['catch'](function (result) {
        return instance.onError.call(instance, instance.args, instance.options, result);
      });
    }
  }, {
    key: '_runHelp',

    /*
        Run help
        @param {Boolean} isAll run a separate log if the all --help is executed
     */
    value: function _runHelp(isAll) {
      var self = this;
      var instance = this.parse();
      return _bluebird2['default'].resolve().then(function () {
        return isAll ? self._allHelp.call(instance, console.log, instance.argv, instance.options) : instance.help.call(instance, console.log, instance.argv, instance.options);
      });
    }
  }, {
    key: 'parse',
    value: function parse() {
      var injectable = [];
      for (var inst in this.context._inject) {
        if (typeof this.context._inject[inst] === 'function') {
          injectable.push(new this.context._inject[inst]());
        } else {
          injectable.push(this.context._inject[inst]);
        }
      }
      var ConstructedCommand = this.context.bind.apply(this.context, [this.context.prototype].concat(injectable));

      // Create The instance
      //////////////////////
      var command = new ConstructedCommand();
      //////////////////////////////////////

      // Apply Static properties to Commands Prototype.

      command.description = this.context._description;
      command.commandId = this.context.commandId;
      command.options = {};
      command.flags = {};
      command.argv = this.context.argv;
      command.args = { _: [] };

      command.argv._.shift();

      // Apply args

      var argvArgs = this.context._args;

      for (var index in this.context.__args) {
        var argStr = this.context.__args[index];
        var argName = argStr.match(/(\w+)/)[0];
        var isRequired = /</.test(argStr);
        var isOptional = /\[/.test(argStr);
        var argValue = argvArgs.shift();

        if (argValue) {
          command.args[argName] = argValue;
          command.args._.push(argValue);
        }

        if (isRequired && !argValue) {
          return { msg: ' ' + argName + ' Argument [' + index + '] is Required!', type: 'err' };
        }
        command._argString = command._argString || '';
        command._argString += ' ' + argStr;
      }

      // parse FLAGS
      for (var index in this.context._flags) {
        var flag = this.context._flags[index].parse();
        command.flags[flag.name] = flag;
        command.options[flag.name] = flag.value;
      }

      var DynamicPrototypes = {
        canExecute: function canExecute() {
          return true;
        },
        beforeAction: function beforeAction(c) {
          return c;
        },
        action: function action(c) {
          return c;
        },
        afterAction: function afterAction(c) {
          return c;
        },
        onError: this._onError,
        help: this._help
      };

      for (var PrototypeName in DynamicPrototypes) {
        if (!command[PrototypeName] || typeof command[PrototypeName] !== 'function') {
          command[PrototypeName] = DynamicPrototypes[PrototypeName];
        }
      }

      return command;
    }
  }, {
    key: '_help',
    value: function _help(log, argv, options) {
      var isFlags;
      log();
      log('    Usage: %s %s', this.commandId.green, (this._argString || '').cyan);
      log();
      log('    Info:  ' + (this.description || '').green);
      log();

      for (var index in this.flags) {
        if (!isFlags) {
          log('    flags:');
          log();
        }
        isFlags = true;
        var option = this.flags[index];
        var padding = (0, _lodashStringRepeat2['default'])(' ', program.maxFlags - option._flags.length);

        log('        ' + option._flags.cyan + padding, option.required ? ('(', 'required'.red + ')') : '(' + 'optional'.green + ')', option.description);
      }
      log();
    }
  }, {
    key: '_allHelp',
    value: function _allHelp(log, argv, options) {
      log();
      log('%s %s %s', this.commandId, this._argString || '', this.description || '');
      for (var index in this.flags) {
        var option = this.flags[index];
        var padding = (0, _lodashStringRepeat2['default'])(' ', program.maxFlags - option._flags.length);

        log(this.commandId + ' ' + option._flags.cyan + padding, option.required ? ('(', 'required'.red + ')') : '(' + 'optional'.green + ')', option.description);
      }
      log();
    }
  }, {
    key: '_onError',
    value: function _onError(args, options, issue) {
      if (issue.msg) {
        console.error(issue.msg);
        console.error(issue.error || issue.Error);
      } else {
        console.error(issue);
        throw issue;
      }
    }
  }, {
    key: 'addPrototype',
    value: function addPrototype(name, value, force) {
      if (force) this.context[name] = value;else this.context[name] = this.context[name] || value;
    }
  }, {
    key: 'isPrototype',
    value: function isPrototype(name, type) {
      return name && typeof name === 'string' && typeof this.context[name] === (type || 'function');
    }
  }]);

  return Command;
})();

exports['default'] = Command;
module.exports = exports['default'];