//实现更新机制
//updateQueue 是一个队列，用来存储组件的更新操作
//当组件的状态发生变化时，会生成一个新的 update 对象，并将其添加到组件的 updateQueue 中
//更新队列通常是以链表的形式实现的，每个 update 对象都连接到下一个更新对象，形成一个更新链表。在 React 的更新过程中，会遍历更新队列，并根据其中的更新操作来更新组件的状态以及更新 DOM

//eg:
//const updateQueue = {
//  参与计算的初始 state
//  baseState: null,
//  代表本次更新前该 FiberNode 中已经保存的 update，以链表形式保存，一头一尾
//  firstBaseUpdate: null，
//  lastBaseUpdate: null，
//  本次更新产生的单向环状链表。计算 state 时，该环状链表会被拆分拼接在 lastBaseUpdate 的后面
//  shared: {
//    pending: null
//  }
//};

//当拼接后，遍历 updateQueue.baseState,基于 baseState，遍历到的每个符合优先级条件的 update，都会被执行，从而更新 state
//shared.pending 始终指向最后插入的 update ，而 shared.pending.next 则指向第一个插入的 update
import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';
import { Dispatch } from 'react/src/currentDispatcher';
//定义 update 数据结构
export interface Update<State> {
	action: Action<State>;
}
//定义 updateQueue 数据结构
//pending 表示待处理的更新(一次只能有一个)
export interface updateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}
//创建 update 实例
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};
//创建 updateQueue 实例
//pending 初始化为 null，表示没有待处理的更新
export const createUpdateQueue = <State>(): updateQueue<State> => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	};
};
//将 update 添加到 updateQueue 中
export const addQueueUpdate = <State>(
	updateQueue: updateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};
//从 updateQueue 中消费 update 的方法
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memorizedState: State } => {
	//初始化结果
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memorizedState: baseState
	};
	//如果有待处理的更新，则取出 action
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		//如果 action 是回调函数，(baseState = 1, update = (i) => 5 * i) --> memorizedState = 5
		if (action instanceof Function) {
			result.memorizedState = action(baseState);
		} else {
			//如果 action 是状态值，(baseState = 1, update = 2) --> memorizedState = 2
			result.memorizedState = action;
		}
	}
	return result;
};
