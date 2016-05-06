'use strict';

var React = require('react-native');
var t = require('tcomb-validation');
var { humanize, merge, getTypeInfo, getOptionsOfEnum } = require('./util');

var SOURCE = 'tcomb-form-native';
var nooptions = Object.freeze({});
var noop = function () { };
var Nil = t.Nil;

class List extends t.form.Component {

  isValueNully() {
    return Object.keys(this.refs).every((ref) => this.refs[ref].isValueNully());
  }

  removeErrors() {
    this.setState({ hasError: false });
    Object.keys(this.refs).forEach((ref) => this.refs[ref].removeErrors());
  }

  getValue() {
    const value = [];
    let ref;

    for (ref in this.refs) {
      if (this.refs.hasOwnProperty(ref)) {
        let [refIdx, refName] = /^(\d)+\:(.*)$/.exec(ref) || [];
        refIdx = parseInt(refIdx, 10);
        if (refIdx > value.length) {
          value.push({});
        }
        value[refIdx][refName] = this.refs[ref].getValue();
      }
    }
    return this.getTransformer().parse(value);
  }

  validate() {
    let value = [];
    let errors = [];
    let hasError = false;
    let result;
    let ref;

    if (this.typeInfo.isMaybe && this.isValueNully()) {
      this.removeErrors();
      return new t.ValidationResult({ errors: [], value: null });
    }

    for (ref in this.refs) {
      if (this.refs.hasOwnProperty(ref)) {
        let [refIdx, refName] = /^(\d)+\:(.*)$/.exec(ref) || [];
        refIdx = parseInt(refIdx, 10);
        result = this.refs[ref].validate();
        errors = errors.concat(result.errors);
        value[refIdx][refName] = result.value;
      }
    }

    if (errors.length === 0) {
      const InnerType = this.typeInfo.innerType;
      value = new InnerType(value);
      if (this.typeInfo.isSubtype && errors.length === 0) {
        result = t.validate(value, this.props.type, this.getValidationOptions());
        hasError = !result.isValid();
        errors = errors.concat(result.errors);
      }
    }

    this.setState({ hasError });
    return new t.ValidationResult({ errors, value });
  }

  onChange(fieldPath, fieldValue, path) {
    const fieldIdx = fieldPath[0];
    const fieldName = fieldPath[1];
    const value = t.mixin([], this.state.value);
    value[fieldIdx][fieldName] = fieldValue;
    this.setState({ value }, () => {
      this.props.onChange(value, path);
    });
  }

  getTemplates() {
    return merge(this.props.ctx.templates, this.props.options.templates);
  }

  getTemplate() {
    return this.props.options.template || list;
  }

  getStylesheet() {
    return this.props.options.stylesheet || this.props.ctx.stylesheet;
  }

  getTypeProps() {
    return this.typeInfo.isMaybe ?
      this.typeInfo.type.meta.type.meta.type.meta.props :
      this.typeInfo.type.meta.type.meta.props;
  }

  getInputs() {
    const { ctx, options } = this.props;
    const props = this.getTypeProps();
    const auto = this.getAuto();
    const i18n = this.getI18n();
    const config = this.getConfig();
    const values = this.state.value || [];
    const valuesLen = values.length;
    const templates = this.getTemplates();
    const stylesheet = this.getStylesheet();
    const inputs = [];
    let inputRow;
    let prop;
    let propType;
    let propOptions;
    let i;

    if (Object.prototype.toString.call(values) === '[object Array]') {
      for (i = 0; i < valuesLen; i += 1) {
        inputRow = {};
        for (prop in props) {
          if (props.hasOwnProperty(prop)) {
            propType = props[prop];
            propOptions = options.fields && options.fields[prop] ? options.fields[prop] : nooptions;
            inputRow[prop] = React.createElement(t.form.getComponent(propType, propOptions), {
              key: `${i}:${prop}`,
              ref: `${i}:${prop}`, // So we can split it
              type: propType,
              options: propOptions,
              value: values[i][prop],
              onChange: this.onChange.bind(this, [i, prop]),
              ctx: {
                context: ctx.context,
                auto,
                config,
                label: humanize(prop),
                i18n,
                stylesheet,
                templates,
                path: this.props.ctx.path.concat(i, prop),
              },
            });
          }
        }
        inputs.push(inputRow);
      }
    }
    return inputs;
  }

  defaultAddItem(e) {
    let newValue = {};
    if (this.props.options.addItem && this.props.options.addItem.onBefore) {
      newValue = this.props.options.addItem.onBefore(e);
    }
    if (newValue) {
      if (newValue.then) {
        newValue.then(this.addItem.bind(this)).catch(noop);
      } else {
        this.addItem(newValue);
      }
    }
  }

  addItem(newValue) {
    let value;
    let callback = noop;
    let actualState;
    if (newValue) {
      actualState = this.state.value || [];
      if (newValue !== true) {
        value = [...actualState, newValue];
      } else {
        // TODO What if this is an array of strings/numbers/booleans?
        value = [...actualState, {}];
      }
      if (this.props.options.addItem && this.props.options.addItem.onAfter) {
        callback = this.props.options.addItem.onAfter;
      }
      this.setState({ value }, () => {
        callback(newValue);
        this.props.onChange(value, this.props.ctx.path.concat(value.length - 1));
      });
    }
  }

  defaultRemoveItem(e, idx, value) {
    let isRemove = true;

    if (this.props.options.removeItem && this.props.options.removeItem.onBefore) {
      isRemove = this.props.options.removeItem.onBefore(e, idx, value);
    }

    if (isRemove) {
      if (isRemove.then) {
        isRemove.then(() => this.removeItem(idx, value)).catch(noop);
      } else {
        this.removeItem(idx, value);
      }
    }
  }

  removeItem(idx, oldValue) {
    const actualState = this.state.value || [];
    const value = [
      ...actualState.slice(0, idx),
      ...actualState.slice(idx + 1),
    ];
    let callback = noop;
    if (this.props.options.removeItem && this.props.options.removeItem.onAfter) {
      callback = this.props.options.removeItem.onAfter;
    }
    this.setState({ value }, () => {
      callback(idx, oldValue);
      this.props.onChange(value, this.props.ctx.path.concat(idx));
    });
  }

  getLocals() {
    const locals = super.getLocals();
    locals.inputs = this.getInputs();

    locals.addItem = this.props.options.addItem || {};
    locals.addItem.label = locals.addItem.label || humanize('addItem');
    locals.addItem.onPress = locals.addItem.onPress || this.defaultAddItem.bind(this);
    locals.addItem.stylesheet = locals.addItem.stylesheet || this.getStylesheet().addItem;

    locals.removeItem = this.props.options.removeItem || {};
    locals.removeItem.label = locals.removeItem.label || humanize('removeItem');
    locals.removeItem.onPress = locals.removeItem.onPress || this.defaultRemoveItem.bind(this);
    locals.removeItem.stylesheet = locals.removeItem.stylesheet || this.getStylesheet().removeItem;

    return locals;
  }
}

module.exports = List;
