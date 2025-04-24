//用来支持新的 jsx 转换
//新的转换不会将 jsx 转换为 React.createElement，而是直接从 React 的包中引入新的入口函数并调用
export { jsxDEV } from './src/jsx';
