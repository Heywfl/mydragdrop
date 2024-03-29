'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Pane = function (_Component) {
  _inherits(Pane, _Component);

  function Pane() {
    _classCallCheck(this, Pane);

    return _possibleConstructorReturn(this, (Pane.__proto__ || Object.getPrototypeOf(Pane)).apply(this, arguments));
  }

  _createClass(Pane, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: this.props.className },
        this.props.children
      );
    }
  }]);

  return Pane;
}(_react.Component);

Pane.propTypes = {
  id: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]).isRequired,
  width: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
  height: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.number]),
  minWidth: _react.PropTypes.number,
  maxWidth: _react.PropTypes.number,
  minHeight: _react.PropTypes.number,
  maxHeight: _react.PropTypes.number,
  style: _react.PropTypes.object,
  className: _react.PropTypes.string,
  children: _react.PropTypes.any,
  onDragStart: _react.PropTypes.func,
  onDragEnd: _react.PropTypes.func,
  isResizable: _react.PropTypes.shape([x, y, xy])
};
Pane.defaultProps = {
  onDragStart: function onDragStart() {
    return null;
  },
  onDragEnd: function onDragEnd() {
    return null;
  },
  style: {},
  className: '',
  isResizable: {
    x: true,
    y: true,
    xy: true
  }
};
exports.default = Pane;
module.exports = exports['default'];