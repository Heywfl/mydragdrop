import React, { Component, PropTypes } from 'react';
import { Motion, spring } from 'react-motion';
import Resizable from 'react-resizable-box';
import isEqual from 'lodash.isequal';
import Pane from './pane';

const reinsert = (array, from, to) => {
  //arrayObject.slice(start,end) slice()方法可从已有的数组中返回选定的元素。start是必需，end是可选。
  const a = array.slice(0);
  const v = a[from];
  //arrayObject.splice(index,howmany,item1,....,itemX) index是必需，规定添加/删除项目的位置，
  //howmany，必需，要输出项目的数量，如果是0，就不会删除项目，item1,...,itemX是向数组添加的新项目。
  a.splice(from, 1);
  a.splice(to, 0, v);
  return a;
};

const clamp = (n, min = n, max = n) => Math.max(Math.min(n, max), min);

const springConfig = [500, 30];

class SortablePane extends Component {
  static propTypes = {
    order: PropTypes.arrayOf(PropTypes.number),
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    margin: PropTypes.number,
    style: PropTypes.object,
    children: PropTypes.array,
    onResizeStart: PropTypes.func,
    onResize: PropTypes.func,
    onResizeStop: PropTypes.func,
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
    onOrderChange: PropTypes.func,
    className: PropTypes.string,
    disableEffect: PropTypes.bool,
    isSortable: PropTypes.bool,
    zIndex: PropTypes.number,
  };

  static defaultProps = {
    order: [],
    direction: 'horizontal',
    margin: 0,
    onClick: () => null,
    onTouchStart: () => null,
    onResizeStart: () => null,
    onResize: () => null,
    onResizeStop: () => null,
    onDragStart: () => null,
    onDragEnd: () => null,
    onOrderChange: () => null,
    customStyle: {},
    className: '',
    disableEffect: false,
    isSortable: true,
    zIndex: 100,
  };

  constructor(props) {
    super(props);
    this.state = {
      delta: 0,
      mouse: 0,
      isPressed: false,
      lastPressed: 0,
      isResizing: false,
      panes: this.props.children.map((child, order) => ({
        id: child.props.id,
        width: child.props.width,
        height: child.props.height,
        order,
      })),
    };
    this.sizePropsUpdated = false;
    this.handleTouchMove = ::this.handleTouchMove;
    this.handleMouseUp = ::this.handleMouseUp;
    this.handleMouseMove = ::this.handleMouseMove;
    if (typeof window !== 'undefined') {
      window.addEventListener('touchmove', this.handleTouchMove);
      window.addEventListener('touchend', this.handleMouseUp);
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('mouseup', this.handleMouseUp);
    }
  }

  componentDidMount() {
    this.setSize();
  }

  componentWillReceiveProps(next) {
    const newPanes = [];
    const order = this.getPanePropsArrayOf('order');
    if (!isEqual(this.props.order, next.order)) {
      for (let i = 0; i < next.order.length; i++) {
        newPanes[next.order[i]] = this.state.panes[order[i]];
      }
      this.setState({ panes: newPanes });
    }
    for (let i = 0; i < this.props.children.length; i++) {
      if (next.children[i]) {
        const width = this.props.children[i].props.width;
        const height = this.props.children[i].props.height;
        const newWidth = next.children[i].props.width;
        const newHeight = next.children[i].props.height;
        if (width !== newWidth || height !== newHeight) this.sizePropsUpdated = true;
      }
    }
  }

  componentDidUpdate() {
    const { panes } = this.state;
    if (this.props.children.length > panes.length) return this.addPane();
    if (this.props.children.length < panes.length) return this.removePane();

    if (this.sizePropsUpdated) {
      this.sizePropsUpdated = false;
      this.setSize();
    }
    return null;
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('touchmove', this.handleTouchMove);
      window.removeEventListener('touchend', this.handleMouseUp);
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('mouseup', this.handleMouseUp);
    }
  }

  onResize(i, dir, size, rect) {
    let { panes } = this.state;
    const order = this.getPanePropsArrayOf('order');
    panes = panes.map((pane, index) => {
      if (order.indexOf(i) === index) {
        const { offsetWidth, offsetHeight } = this.refs.panes.children[i];
        return {
          width: offsetWidth,
          height: offsetHeight,
          order: pane.order,
          id: pane.id,
        };
      }
      return pane;
    });
    this.setState({ panes });
    this.props.onResize({ id: panes[order.indexOf(i)].id, dir, size, rect });
  }

  getPanePropsArrayOf(key) {
    return this.state.panes.map(pane => pane[key]);
  }

  getPaneSizeList() {
    const width = this.getPanePropsArrayOf('width');
    const height = this.getPanePropsArrayOf('height');
    return this.isHorizontal() ? width : height;
  }

  /**
   * Find the position sum of halfway points of panes surrounding a given pane
   *
   *  |-------------|
   *  |             | ---> 'previous' halfway
   *  |-------------|
   *                  <--- margin
   *  |-------------|
   *  | currentPane |
   *  |-------------|
   *                  <--- margin
   *  |-------------|
   *  |             |
   *  |             | ---> 'next' halfway
   *  |             |
   *  |-------------|
   *
   *
   * @param  {number}   currentPane - Index of rerference pane
   * @param  {number[]} sizes       - Array of pane sizes
   * @param  {number}   margin      - The margin between panes
   * @return {object}               - Object containing 'prevoius' and 'next'
   *                                  pane halfway points
   */
  getSurroundingHalfSizes(currentPane, sizes, margin) {
    const nextPane = currentPane + 1;
    const prevPane = currentPane - 1;

    return sizes.reduce((sums, val, index) => {
      const newSums = {};
      if (index < prevPane) {
        newSums.previous = sums.previous + val + margin;
      } else if (index === prevPane) {
        newSums.previous = sums.previous + val / 2;
      } else {
        newSums.previous = sums.previous;
      }

      if (index < nextPane) {
        newSums.next = sums.next + val + margin;
      } else if (index === nextPane) {
        newSums.next = sums.next + val / 2;
      } else {
        newSums.next = sums.next;
      }
      return newSums;
    }, { previous: 0, next: 0 });
  }

  /**
   * Determine where a particular pane should be ordered
   *
   * @param  {number} position     - Top of the current pane
   * @param  {number} paneIndex    - Index of the pane
   * @return {number}              - New index of the pane based on position
   */
  getItemCountByPosition(position, paneIndex) {
    const size = this.getPaneSizeList();
    const { margin } = this.props;
    const halfsizes = this.getSurroundingHalfSizes(paneIndex, size, margin);

    if (position + size[paneIndex] > halfsizes.next) return paneIndex + 1;
    if (position < halfsizes.previous) return paneIndex - 1;
    return paneIndex;
  }

  setSize() {
    const panes = this.props.children.map((child, i) => {
      const { offsetWidth, offsetHeight } = this.refs.panes.children[i];
      return {
        id: child.props.id,
        width: offsetWidth,
        height: offsetHeight,
        order: i,
      };
    });
    if (!isEqual(panes, this.state.panes)) this.setState({ panes });
  }

  getItemPositionByIndex(index) {
    const size = this.getPaneSizeList();
    let sum = 0;
    for (let i = 0; i < index; i++) sum += size[i] + this.props.margin;
    return sum;
  }

  isHorizontal() {
    return this.props.direction === 'horizontal';
  }

  updateOrder(panes, index, mode) {
    return panes.map(pane => {
      if (pane.order >= index) {
        const { id, width, height, order } = pane;
        return { id, width, height, order: mode === 'add' ? order + 1 : order - 1 };
      }
      return pane;
    });
  }

  addPane() {
    let newPanes = this.state.panes;
    this.props.children.forEach((child, i) => {
      const ids = this.state.panes.map(pane => pane.id);
      if (ids.indexOf(child.props.id) === -1) {
        newPanes = this.updateOrder(newPanes, i, 'add');
        const { id } = child.props;
        const { width, height } = this.refs.panes.children[i].getBoundingClientRect();
        const pane = { id, width, height, order: i };
        newPanes.splice(i, 0, pane);
      }
    });
    this.setState({ panes: newPanes });
  }

  removePane() {
    let newPanes;
    this.state.panes.forEach((pane, i) => {
      const ids = this.props.children.map(child => child.props.id);
      if (ids.indexOf(pane.id) === -1) {
        newPanes = this.updateOrder(this.state.panes, i, 'remove');
        newPanes.splice(i, 1);
      }
    });
    this.setState({ panes: newPanes });
  }

  handleResizeStart(i) {
    const order = this.getPanePropsArrayOf('order');
    this.setState({ isResizing: true });
    this.props.onResizeStart({ id: this.state.panes[order.indexOf(i)].id });
  }

  handleResizeStop(i, dir, size, rect) {
    const { panes } = this.state;
    const order = this.getPanePropsArrayOf('order');
    this.setState({ isResizing: false });
    this.props.onResizeStop({ id: panes[order.indexOf(i)].id, dir, size, rect });
  }

  handleMouseDown(pos, pressX, pressY, { pageX, pageY }) {
    this.setState({
      delta: this.isHorizontal() ? pageX - pressX : pageY - pressY,
      mouse: this.isHorizontal() ? pressX : pressY,
      isPressed: true,
      lastPressed: pos,
    });
    this.props.children[pos].props.onDragStart();
    this.props.onDragStart(this.props.children[pos].props.id);
  }

  handleMouseMove({ pageX, pageY }) {
    const { isPressed, delta, lastPressed, isResizing, panes } = this.state;
    const { onOrderChange } = this.props;
    if (isPressed && !isResizing) {
      const mouse = this.isHorizontal() ? pageX - delta : pageY - delta;
      const { length } = this.props.children;
      const order = this.getPanePropsArrayOf('order');
      const newPosition = this.getItemCountByPosition(mouse, order.indexOf(lastPressed));
      const row = clamp(Math.round(newPosition), 0, length - 1);
      const newPanes = reinsert(panes, order.indexOf(lastPressed), row);
      this.setState({ mouse, panes: newPanes });
      if (!isEqual(panes, newPanes)) onOrderChange(panes, newPanes);
    }
  }

  handleTouchStart(key, pressLocation, e) {
    this.handleMouseDown(key, pressLocation, e.touches[0]);
  }

  handleTouchMove(e) {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  }

  handleMouseUp() {
    if (this.props.children.length === 0) return;
    this.setState({ isPressed: false, delta: 0 });
    this.props.children[this.state.lastPressed].props.onDragEnd();
    const lastPressedId = this.props.children[this.state.lastPressed].props.id;
    this.props.onDragEnd(lastPressedId);
  }

  renderPanes() {
    const { mouse, isPressed, lastPressed, isResizing } = this.state;
    const order = this.getPanePropsArrayOf('order');
    const { children, disableEffect, isSortable, zIndex } = this.props;
    return children.map((child, i) => {
      const springPosition = spring(this.getItemPositionByIndex(order.indexOf(i)), springConfig);
      const style = lastPressed === i && isPressed
              ? {
                scale: disableEffect ? 1 : spring(1.05, springConfig),
                shadow: disableEffect ? 0 : spring(16, springConfig),
                x: this.isHorizontal() ? mouse : 0,
                y: !this.isHorizontal() ? mouse : 0,
              }
              : {
                scale: disableEffect ? 1 : spring(1, springConfig),
                shadow: disableEffect ? 0 : spring(0, springConfig),
                x: this.isHorizontal() ? springPosition : 0,
                y: !this.isHorizontal() ? springPosition : 0,
              };
      return (
        <Motion style={style} key={child.props.id}>
          {({ scale, shadow, x, y }) => {
            const onResize = this.onResize.bind(this, i);
            const onMouseDown = isSortable ? this.handleMouseDown.bind(this, i, x, y) : () => null;
            const onTouchStart = this.handleTouchStart.bind(this, i, x, y);
            const onResizeStart = this.handleResizeStart.bind(this, i);
            const onResizeStop = this.handleResizeStop.bind(this, i);
            const userSelect = (isPressed || isResizing)
              ? {
                userSelect: 'none',
                MozUserSelect: 'none',
                WebkitUserSelect: 'none',
                MsUserSelect: 'none',
              } : {
                userSelect: 'auto',
                MozUserSelect: 'auto',
                WebkitUserSelect: 'auto',
                MsUserSelect: 'auto',
              };

            // take a copy rather than direct-manipulating the child's prop, which violates React
            // and causes problems if the child's prop is a static default {}, which then will be
            // shared across all children!
            const customStyle = Object.assign({}, child.props.style);
            Object.assign(customStyle, {
              boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
              transform: `translate3d(${x}px, ${y}px, 0px) scale(${scale})`,
              WebkitTransform: `translate3d(${x}px, ${y}px, 0px) scale(${scale})`,
              MozTransform: `translate3d(${x}px, ${y}px, 0px) scale(${scale})`,
              MsTransform: `translate3d(${x}px, ${y}px, 0px) scale(${scale})`,
              zIndex: i === lastPressed ? zIndex + children.length : zIndex + i,
              position: 'absolute',
              ...userSelect,
            });

            return (
              <Resizable
                customClass={child.props.className}
                onResize={onResize}
                isResizable={{
                  top: false,
                  right: child.props.isResizable.x,
                  bottomRight: child.props.isResizable.xy,
                  bottom: child.props.isResizable.y,
                  left: false,
                  topRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }}
                width={child.props.width}
                height={child.props.height}
                minWidth={child.props.minWidth}
                minHeight={child.props.minHeight}
                maxWidth={child.props.maxWidth}
                maxHeight={child.props.maxHeight}
                customStyle={customStyle}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onResizeStart={onResizeStart}
                onResizeStop={onResizeStop}
              >
                {child.props.children}
              </Resizable>
            );
          }}
        </Motion>
      );
    });
  }

  render() {
    const { style, className } = this.props;
    return (
      <div
        ref="panes"
        className={className}
        style={style}
      >
        { this.renderPanes() }
      </div>
    );
  }
}

export { Pane, SortablePane };
