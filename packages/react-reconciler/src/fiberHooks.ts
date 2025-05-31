/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//需要在 renderWithHooks 方法中判断当前的上下文环境，来决定调用哪个 hooks 集合，判断的方法为根据 workInProgress.alternate:
//1: 若为 null, 则代表此时还没有真实的 DOM 树(首屏还没有渲染), 所以是 mount 阶段。应该调用 mount 阶段对应的 hooks 集合: HooksDispatcherOnMount，将它赋值给 currentDispatcher
//2: 否则为 update 阶段，应该调用 update 阶段对应的 hooks 集合: HooksDispatcherOnUpdate

//引入两个全局变量
//currentlyRenderingFiber: 用于跟踪当前正在被处理的 FiberNode 节点，以便在调用 hook 时能找到正确的 FiberNode 节点，将状态和上下文与之相关联
//workInProgressHook: 用于跟踪当前正在进行工作的 hook
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { FiberNode } from './fiber';
import internals from 'shared/internals';
import {
	addQueueUpdate,
	createUpdate,
	createUpdateQueue,
	updateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
//当前正在处理的 FiberNode
let currentlyRenderingFiber: FiberNode | null = null;
//hooks 链表中当前正在处理的 hook
let workInProgressHook: Hook | null = null;
//当前使用的 hook 指针，根据初始渲染/更新渲染阶段不同进行赋值
const { currentDispatcher } = internals;
//定义 hook 数据结构
export interface Hook {
	//保存 hook 状态值
	memorizedState: any;
	//保存更新队列
	queue: any;
	//指向下一个 hook，形成链表
	next: Hook | null;
}
//执行函数组件中的函数
export function renderWithHooks(workInProgress: FiberNode) {
	//赋值
	currentlyRenderingFiber = workInProgress;
	workInProgress.memorizedState = null;
	//判断 hook 被调用的时机
	const current = workInProgress.alternate;
	if (current !== null) {
		//组件的更新阶段
		//update
		//currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		//首屏渲染阶段
		//mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}
	//函数保存在 type 字段中
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	//执行函数
	const children = Component(props);
	//重置全局变量
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	return children;
}
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};
//const HooksDispatcherOnUpdate: Dispatcher = {
//	useState: updateState
//};

//实现 mountState
//1: 从 hooks 链表中获取正在工作的 hook
//2: 获取当前 hook 对应的 hook 数据, 即 mountState
//对于 mount 阶段，需要新建一个 hook，然后将它赋值给 workInProgressHook 变量

//获取当前正在工作的 hook
function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memorizedState: null,
		queue: null,
		next: null
	};
	if (workInProgressHook == null) {
		//mount 的第一个 hook
		if (currentlyRenderingFiber !== null) {
			workInProgressHook = hook;
			currentlyRenderingFiber.memorizedState = workInProgressHook;
		} else {
			// hook 执行的上下文不是一个函数组件
			throw new Error('Hooks 只能在函数组件中执行');
		}
	} else {
		//mount 的其他 hook
		//将当前工作的 hook 的 next指向新建的 hook, 形成 hooks 链表
		workInProgressHook.next = hook;
		//更新当前工作的 hook
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
//当前 useState 对应的 hook 数据就是 initialState，需要将这个数据存放在 hook 的 memoizedState 变量中
//因为 useState 可以触发更新，所以创建一个 UpdateQueue，存放在 hook 的 queue 变量中
function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	//当前正在工作的 useState
	const hook = mountWorkInProgressHook();
	//当前 useState 对应两种 hook 数据
	//const [data, setData] = useState(0)
	//const [data, setData] = useState(data => data + 1)
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	hook.memorizedState = memoizedState;
	//创建 updateQueue 实例
	const queue = createUpdateQueue<State>();
	hook.queue = queue;
	//实现 dispatch
	//@ts-expect-error
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}
//用于触发状态更新的逻辑
function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: updateQueue<State>,
	action: Action<State>
) {
	//创建 update 实例
	const update = createUpdate(action);
	//将 update 添加到 updateQueue 中
	addQueueUpdate(updateQueue, update);
	//调度更新
	scheduleUpdateOnFiber(fiber);
}
