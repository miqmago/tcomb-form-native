var React = require('react-native');
var { View, Text, TouchableHighlight } = React;

function controlButton(locals, ...onPressParams) {
  if (locals.hidden) {
    return null;
  }

  const stylesheet = locals.stylesheet;
  const touchableProps = {};
  let innerControlStyle;
  let innerControl = null;

  [
    'activeOpacity',
    'onHideUnderlay',
    'onShowUnderlay',
    'underlayColor',
    'accessibilityComponentType',
    'accessibilityTraits',
    'accessible',
    'delayLongPress',
    'delayPressIn',
    'delayPressOut',
    'disabled',
    'hitSlop',
    'onLayout',
    'onLongPress',
    'onPressIn',
    'onPressOut',
    'pressRetentionOffset',
  ].forEach(name => (touchableProps[name] = locals[name]));

  touchableProps.onPress = (...e) => locals.onPress(...e, ...onPressParams);
  touchableProps.style = locals.disabled ? stylesheet.button.disabled : stylesheet.button.normal;
  if (locals.label) {
    if (typeof locals.label === 'string') {
      innerControlStyle = locals.disabled ? stylesheet.label.disabled : stylesheet.label.normal;
      innerControl = <Text style={innerControlStyle}>{locals.label}</Text>;
    } else {
      innerControl = locals.label;
    }
  }

  return (
    <TouchableHighlight {...touchableProps}>
      {innerControl}
    </TouchableHighlight>
  );
}

function getListItem(locals, inputRow, index) {
  const stylesheet = locals.stylesheet;
  const listItemStyle = stylesheet.listItem.normal;
  const subComponents = Object.keys(inputRow || {}).map(key => inputRow[key]);
  const removeItemBtn = controlButton(locals.removeItem, index, locals.value[index]);
  let removeItemBtnTop = null;
  let removeItemBtnBottom = null;

  switch (locals.removeItem.position) {
    case 'top':
      removeItemBtnTop = removeItemBtn;
      break;
    default:
      removeItemBtnBottom = removeItemBtn;
      break;
  }

  return (
    <View key={index} style={listItemStyle}>
      {removeItemBtnTop}
      {subComponents}
      {removeItemBtnBottom}
    </View>
  );
}

function list(locals) {
  if (locals.hidden) {
    return null;
  }

  const stylesheet = locals.stylesheet;
  const formGroupStyle = locals.hasError ? stylesheet.formGroup.error : stylesheet.formGroup.normal;
  const controlLabelStyle = locals.hasError ? stylesheet.controlLabel.error : stylesheet.controlLabel.normal;
  const listStyle = locals.hasError ? stylesheet.listGroup.error : stylesheet.listGroup.normal;
  const helpBlockStyle = locals.hasError ? stylesheet.helpBlock.error : stylesheet.helpBlock.normal;
  const errorBlockStyle = stylesheet.errorBlock;
  const label = locals.label ? <Text style={controlLabelStyle}>{locals.label}</Text> : null;
  const help = locals.help ? <Text style={helpBlockStyle}>{locals.help}</Text> : null;
  const error = locals.hasError && locals.error ? <Text accessibilityLiveRegion="polite" style={errorBlockStyle}>{locals.error}</Text> : null;
  const addItemBtn = controlButton(locals.addItem);
  let addItemBtnTop = null;
  let addItemBtnBottom = null;
  const listItems = (locals.inputs || []).map((inputRow, index) => getListItem(locals, inputRow, index));

  switch (locals.addItem.position) {
    case 'bottom':
      addItemBtnBottom = addItemBtn;
      break;
    default:
      addItemBtnTop = addItemBtn;
      break;
  }

  return (
    <View style={formGroupStyle}>
      {label}
      {addItemBtnTop}
      <View style={listStyle}>
        { listItems }
      </View>
      {addItemBtnBottom}
      {help}
      {error}
    </View>
  );
}

module.exports = list;
