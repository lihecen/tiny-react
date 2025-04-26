//检查 Symbol 是否是一个函数 (在支持 ES6 的环境中是一个函数)
//Symbol.for 是一个静态方法，用于创建或访问一个全局注册的 symbol
const supportSymbol = typeof Symbol === 'function' && Symbol.for;
// 表示普通的 React 元素，即通过 JSX 创建的组件或 DOM 元素
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
