const React = require('react');
const {Pressable, Text: RNText, View} = require('react-native');

const passthrough = ({children, style, ...props}) =>
  React.createElement(View, {...props, style}, children);
const text = ({children, color, style, ...props}) =>
  React.createElement(RNText, {...props, style: [{color}, style]}, children);
const button = ({children, enabled = true, onClick, ...props}) =>
  React.createElement(
    Pressable,
    {...props, disabled: !enabled, onPress: onClick},
    children,
  );

const slotComponent = passthrough;
const textField = React.forwardRef(
  ({children, onValueChange, keyboardActions, ...props}, ref) => {
    React.useImperativeHandle(ref, () => ({
      setText: async () => {},
      clear: async () => {},
      focus: async () => {},
      blur: async () => {},
      setSelection: async () => {},
    }));
    return React.createElement(View, props, children);
  },
);
textField.Placeholder = slotComponent;
textField.Label = slotComponent;
textField.LeadingIcon = slotComponent;
textField.TrailingIcon = slotComponent;
textField.Prefix = slotComponent;
textField.Suffix = slotComponent;
textField.SupportingText = slotComponent;

const alertDialog = passthrough;
alertDialog.Title = slotComponent;
alertDialog.Content = slotComponent;
alertDialog.Actions = slotComponent;
alertDialog.Text = slotComponent;
alertDialog.DismissButton = slotComponent;
alertDialog.ConfirmButton = slotComponent;

const dropdownMenu = passthrough;
dropdownMenu.Trigger = slotComponent;
dropdownMenu.Items = slotComponent;
const dropdownMenuItem = button;
dropdownMenuItem.Text = slotComponent;
dropdownMenuItem.LeadingIcon = slotComponent;

module.exports = {
  DropdownMenu: dropdownMenu,
  DropdownMenuItem: dropdownMenuItem,
  Box: passthrough,
  AlertDialog: alertDialog,
  BasicAlertDialog: passthrough,
  Host: passthrough,
  RNHostView: passthrough,
  Surface: passthrough,
  Card: passthrough,
  ElevatedCard: passthrough,
  OutlinedCard: passthrough,
  Text: text,
  Button: button,
  FilledTonalButton: button,
  OutlinedButton: button,
  ElevatedButton: button,
  TextButton: button,
  IconButton: button,
  FilledIconButton: button,
  FilledTonalIconButton: button,
  OutlinedIconButton: button,
  LoadingIndicator: passthrough,
  ContainedLoadingIndicator: passthrough,
  TextField: textField,
  OutlinedTextField: textField,
  useNativeState: value => ({value, get: () => value, set: () => {}}),
  Shape: {
    RoundedCorner: props => props,
    Pill: props => props,
    Circle: props => props,
  },
};
