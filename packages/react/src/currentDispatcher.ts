// import {useState} from 'react';
// const [state, setState] = useState(initialState);
// useState 是被 react 包导出，若感知上下文环境，则需要依赖 react-reconciler 包中的更新流程，也就是说两个包之间需要共享数据，需要实现一个内部数据共享层
// currentDispatcher.ts 文件中保存了当前使用的 hooks 指针 currentDispatcher，同时导出一个 resolveDispatcher 函数，方便查询当前使用的 hooks 集合
import { Action } from 'shared/ReactTypes';
export interface Dispatcher {
	useState: <S>(initialState: (() => S) | S) => [S, Dispatch<S>];
}
export type Dispatch<State> = (action: Action<State>) => void;
//当前使用的 hooks 指针，用来指向正在使用 hooks 的实现版本 (mount, update.........)
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};
//查询当前使用的 hooks 集合
//eg: 调用 useState 的背后过程
//function useState(initial) {
//  const dispatcher = resolveDispatcher();  //获取当前 useState 的具体实现
//  return dispatcher.useState(initial);  //调用 mount 或者 update 的 useState
//}
//进一步举例
//eg: 在 mount 时
//currentDispatcher.current = HooksDispatcherOnMount;
//const HooksDispatcherOnMount = {
//   useState: mountState;
//}
export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;
	if (dispatcher === null) {
		//当前代码执行上下文不是在函数组件或者自定义 hooks 中
		throw new Error('hooks 只能在函数组件中执行');
	}
	return dispatcher;
};
export default currentDispatcher;
