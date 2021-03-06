/*
 * simpleChecker.js
 * @version 1.0.0
 * @author Ghiya Mikadze <g.mikadze@lakka.io>
 * @license Licensed under the MIT license
 */
+function ($) {
  'use strict';

  // CLASS DEFINITION
  // ================

  var Checker = function ($container, options) {
    this.$fields = [];
    this.options = $.extend(
      {},
      Checker.DEFAULTS,
      {
        _fields: $.extend(
          Checker.DEFAULTS._fields,
          typeof options === 'object' && options
        )
      }
    );
    // устанавливает поля относительно переданных настроек
    var _$container = $container ? $container : $(document).find(this.options.selector).first();
    if (_$container && _$container.length) {
      var fieldTypes = Object.getOwnPropertyNames(this.options._fields);
      for (var index in fieldTypes) {
        this.bindField(
          _$container,
          this.options._fields[fieldTypes[index]]
        );
      }
    }
  };
  Checker.PROPERTY = {
    public: {
      validator: undefined,
      default: {
        validator: function ($field) {
          var context = this;
          var inputMaskOptions = $.extend(
            {
              oncomplete: function () {
                $(this).data('inputChecker').refreshState(true);
              },
              onincomplete: function () {
                $(this).data('inputChecker').refreshState(false);
              }
            },
            context.default.options,
            typeof context.options === "object" && context.options
          );
          Inputmask(
            inputMaskOptions
          )
            .mask(
              $field
            );
        },
        options: {
          showMaskOnFocus: false,
          showMaskOnHover: false
        }
      },
      parentGroup: '[class*=form-group]',
      isPersistent: false,
      initialState: false,
      selector: ''
    },
    protected: {
      $instance: {},
      defined: function () {
        return this.$instance.length > 0;
      },
      wasBind: false,
      holdOnWith: null,
      markGroup: function (state) {
        var $parentGroup = this.$instance.parents(this.parentGroup).first();
        if ( $parentGroup.length ) {
          if (state) {
            $parentGroup.removeClass('has-error');
          }
          else {
            $parentGroup.addClass('has-error');
          }
        }
      },
      isValid: function () {
        // return `initialState` if persistent defined
        if ( this.isPersistent ) {
          return this.initialState;
        }
        var isValid = this.defined() ? this.$instance.data('checkerState') : false;
        this.markGroup(isValid);
        return isValid;
      },
      refreshState: function (state, stateOnly) {
        if (this.defined()) {
          // do nothing if persistent defined
          if ( this.isPersistent ) {
            return;
          }
          this.$instance.data('checkerState', state);
          if (!stateOnly) {
            this.markGroup(state);
          }
        }
        else {
          throw new Error('Refresh undefined field state error')
        }
      },
      holdOn: function () {
        if (this.defined()) {
          this.holdOnWith = typeof this.$instance.data('checkerState') !== "undefined" ? this.$instance.data('checkerState') : this.initialState;
          this.refreshState(true, true);
        }
      },
      resume: function () {
        if (this.defined()) {
          this.refreshState(
            typeof this.holdOnWith !== "object" ? this.holdOnWith : this.initialState,
            true
          );
        }
      },
      bind: function () {
        if (this.defined()) {
          if (typeof this.validator === 'function') {
            this.validator.call(this, this.$instance);
          }
          else {
            this.default.validator.call(this, this.$instance);
          }
        }
        return this;
      }
    },
    private: {
      _getInstances: function () {
        return this.$container && this.$container.length ?
          this.$container.find(this.selector) : {};
      },
      _bind: function () {
        var _bindResult = [];
        var _public = this._hidePrivate();
        this._getInstances()
          .each(
            function () {
              $(this).data(
                {
                  inputChecker:
                    $.extend(
                      {},
                      _public,
                      {
                        $instance: $(this)
                      }
                    ),
                  checkerState: typeof _public.initialState === 'function' ?
                    _public.initialState.call($(this)) : _public.initialState
                }
              );
              var bind = $(this).data('inputChecker').bind();
              _bindResult.push(bind);
            }
          );
        return _bindResult;
      },
      _hidePrivate: function () {
        var _public = {};
        var properties = Object.getOwnPropertyNames(this);
        for (var index in properties) {
          if (!/^_/.test(properties[index])) {
            _public[properties[index]] = this[properties[index]];
          }
        }
        return _public;
      }
    }
  };
  Checker.prototype.bindField = function ($container, options) {
    var bindResult = $.extend(
      {},
      Checker.PROPERTY.public, // перезаписываемые свойства
      options,
      // следующие параметры идут в конце во избежании перезаписывания
      {
        $container: $container
      },
      Checker.PROPERTY.protected, // защищённые свойства
      Checker.PROPERTY.private // закрытые свойства
    )
      ._bind();
    if (bindResult && bindResult.length) {
      for (var index = 0; index < bindResult.length; index++) {
        this.$fields.push(
          bindResult[index]
        );
      }
    }
  };
  Checker.prototype.validateFields = function () {
    if (this.$fields.length) {
      for (var index in this.$fields) {
        if (!this.$fields[index].isValid()) {
          this.$fields[index].markGroup(false);
          return false;
        }
      }
    }
    return true;
  };
  Checker.DEFAULTS = {
    _fields: {},
    selector: '[data-checker=container]'
  };

  // PLUGIN
  // ======

  function Plugin(options) {
    var plugin = $(this).data('simpleChecker');
    if (!plugin) {
      $(this).data('simpleChecker', (plugin = new Checker($(this), options)))
    }
    return plugin;
  }

  var old = $.fn.checker;

  $.fn.checker = Plugin;
  $.fn.checker.Constructor = Checker;

  // NO CONFLICT
  // ===========

  $.fn.checker.noConflict = function () {
    $.fn.checker = old;
    return this
  }

}(jQuery);