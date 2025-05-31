//根据 Fiber 节点的类型 (HostRoot, HostComponent, HostText) 分发任务给不同的处理函数，处理具体节点类型的更新逻辑
//HostRoot: 表示根节点，即应用的最顶层节点
//调用 updateHostRoot 函数，处理根节点的更新，包括协调处理根节点的属性以及子节点的更新逻辑
//调用 reconcileChildren 函数，处理根节点的子节点，可能会递归调用其他协调函数
//返回 workInProgress.child 表示经过协调后的新的子节点链表

//HostComponent: 表示原生 DOM 节点，例如 <div> <span> 等
//调用 updateHostComponent 函数，处理原生 DOM 节点的更新，负责协调处理属性和子节点的更新逻辑
//调用 reconcileChildren 函数，处理原生 DOM 子节点的更新
//返回 workInProgress.child 表示经过协调后新的子节点链表

//HostText: 文本节点，即 DOM 中的文本内容，例如 <div>123</div>
//调用 updateHostText 函数，协调处理文本节点的内容更新
//返回 null 表示已经是叶子节点，没有子节点
//其中 reconcileChildren 函数的作用是，通过对比子节点的 current FiberNode 与子节点的 ReactElement，来生成子节点对应的 workInProgress FiberNode
//current 是与视图中真实 UI 对应的 Fiber 树，workInProgress 是触发更新后正在 Reconciler 中计算的 Fiber 树
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { updateQueue, processUpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { reconcileChildFibers, mountChildFibers } from './childFiber';
//比较并返回子 FiberNode
export const beginWork = (workInProgress: FiberNode) => {
	switch (workInProgress.tag) {
		case HostRoot:
			//表示根节点，即应用的最顶层节点
			return updateHostRoot(workInProgress);
		case HostComponent:
			//表示原生 DOM 元素
			return updateHostComponent(workInProgress);
		//表示函数组件
		case FunctionComponent:
			return updateFunctionComponent(workInProgress);
		case HostText:
			//表示文本节点
			return updateHostText();
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型', workInProgress.tag);
			}
			return null;
	}
};
//根据当前节点和工作中节点的状态进行比较，处理属性等更新逻辑
function updateHostRoot(workInProgress: FiberNode) {
	//状态初始化
	//此时 memorizedState 是上一次计算后的状态，把它作为初始状态
	const baseState = workInProgress.memorizedState;
	//获取更新队列 updateQueue，记录了待处理的状态更新
	const updateQueue = workInProgress.updateQueue as updateQueue<Element>;
	//从更新队列中提取待处理的更新链表
	const pending = updateQueue.shared.pending;
	//清空更新队列，表示这些更新即将被处理
	updateQueue.shared.pending = null;
	//计算待更新状态的最新值
	//将 pending 中的更新应用到新的 baseState 上，生成新的状态
	const { memorizedState } = processUpdateQueue(baseState, pending);
	//将 memorizedState 赋值给当前 workInProgress 上
	workInProgress.memorizedState = memorizedState;
	//处理子节点的更新逻辑
	const nextChildren = workInProgress.memorizedState;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
	//从 Fiber 节点中获取即将使用的属性 pendingProps
	//属性来自 React 最新一次渲染提交的 DOM
	//eg: <div id="app" className="main">hello</div>
	//pendingProps 为: {id: "app", className: "main", children: "hello"}
	const nextProps = workInProgress.pendingProps;
	//提取 children
	const nextChildren = nextProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostText() {
	//没有子节点，返回 null
	return null;
}

//updateFunctionComponent函数会调用函数组件本身来获取其返回的 React 元素树
//eg: function App() {
//     return {
//        123;
//    }
// }
//只需要调用 App() 就可以得到其子节点，从而将子节点传给 reconcileChildren 协调处理子节点的更新逻辑
//eg: function App() {
//   const [count, setCount] = useState(0)
//   return <div>{count}</div>
//}
//1: 首先会调用 renderWithHooks 执行 App() 得到 <div>{count}</div>
//2: 将 JSX 转化为虚拟 DOM 节点
//3: 调用 reconcileChildren 开始对比新旧 Fiber 树，准备生成新的 Fiber 子节点
//4: 返回第一个子节点供调度器继续向下构建 Fiber 树
function updateFunctionComponent(workInProgress: FiberNode) {
	const nextChildren = renderWithHooks(workInProgress);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}
//执行函数组件中的函数
export function renderWithHooks(workInProgress: FiberNode) {
	//保存在 type 字段中
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	//执行函数
	const children = Component(props);
	return children;
}

//对比子节点的 current FiberNode 与子节点的 ReactElement
//生成子节点对应的 workInProgress FiberNode
function reconcileChildren(
	workInProgress: FiberNode,
	children?: ReactElementType
) {
	const current = workInProgress.alternate;
	if (current !== null) {
		//组件的更新阶段
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current?.child,
			children
		);
	} else {
		//首屏渲染阶段
		workInProgress.child = mountChildFibers(workInProgress, null, children);
	}
}
