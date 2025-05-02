/* eslint-disable @typescript-eslint/no-explicit-any */
//实现 FiberNode 类
//FiberNode 是 Reconciler 的核心数据结构，用于构建协调树
//Reconciler 使用 FiberNode 来表示 React 元素树中的节点，并通过比较 Fiber 树的差异，找出需要进行更新的部分，生成更新指令，来实现 UI 的渲染和更新
//FiberNode 结构包括以下部分:
//1: type: 节点的类型（包括原生的 DOM 元素，类组件或者函数式组件）
//2: props: 节点的属性
//3: stateNode: 节点对应的实际 DOM 节点或者组件实例
//4: child: 节点的第一个子节点
//5: sibling: 节点的下一个兄弟节点
//6: return: 指向节点的父节点
//7: alternate: 节点的备份节点，用于在协调过程中进行比较
//8: effectTag: 节点的副作用类型，比如说更新，插入，删除操作等等
//9: pendingProps: 节点的新属性
import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, workTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';
import { Container } from 'hostConfig';
export class FiberNode {
	tag: workTag;
	key: Key;
	stateNode: any;
	type: any;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	ref: Ref;
	pendingProps: Props;
	memorizedProps: Props | null;
	memorizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	updateQueue: unknown;
	constructor(tag: workTag, pendingProps: Props, key: Key) {
		//类型
		this.tag = tag;
		this.key = key;
		this.ref = null;
		//节点对应的实际 DOM 节点或者组件实例
		this.stateNode = null;
		//节点的类型（包括原生的 DOM 元素，类组件或者函数式组件）
		this.type = null;
		//树状结构
		//节点的父节点
		this.return = null;
		//节点的下一个兄弟节点
		this.sibling = null;
		//节点的第一个子节点
		this.child = null;
		//索引
		this.index = 0;
		//作为工作单元
		//节点的新属性 -> 用于在协调过程中进行更新
		this.pendingProps = pendingProps;
		//已经更新完的属性
		this.memorizedProps = null;
		//更新完成后新的state
		this.memorizedState = null;
		//节点的备份节点，用于在协调过程中进行比较
		this.alternate = null;
		//节点的副作用类型
		this.flags = NoFlags;
		//子节点的副作用类型，如更新，插入，删除等
		this.subtreeFlags = NoFlags;
		//更新计划队列
		this.updateQueue = null;
	}
}

//触发更新
//更新 React 应用可以由多种触发方式引发，包括组件的状态变化、属性变化、父组件的重新渲染以及用户事件等等
//先来处理创建 React 应用的根对象这种情况，也就是 ReactDOM.createRoot(rootElement).render(<App/>) 这条语句
//ReactDOM.createRoot() 函数生成一个新的 Root 对象，它在源码中是 FiberRootNode 类型，充当了 React 应用的根节点
//rootElement 则是要渲染到的 DOM 节点，它在源码中是 hostRootFiber 类型，作为 React 应用的根 DOM 节点
//render() 方法将组件 <App/> 渲染到根节点上。在这个过程中，React 会创建一个代表 <App/> 组件的 FiberNode，并将其添加到 Root 对象的 Fiber 树上
//实现 FiberRootNode 类
export class FiberRootNode {
	//传入的 DOM 容器
	container: Container;
	//指向当前 Fiber 树根节点 (hostRootFiber)
	current: FiberNode;
	//表示已经完成构建的 Fiber 树
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		//将根节点的 stateNode 属性指向 FiberNodeRoot, 用于表示整个 React 的根节点
		hostRootFiber.stateNode = this;
		//指向更新完成之后的 hostRootFiber
		this.finishedWork = null;
	}
}

//根据 FiberRootNode.current 创建 workInProgress
//在 "旧 Fiber 树" 的基础上构建或复用一颗 "工作树"
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let workInProgress = current.alternate;
	if (workInProgress === null) {
		//首屏渲染时，会从 root 节点从无到有创建一颗 workInProgress 树
		workInProgress = new FiberNode(current.tag, pendingProps, current.key);
		workInProgress.stateNode = current.stateNode;
		//双缓存机制实现，实现状态缓存
		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		//非首屏渲染
		workInProgress.pendingProps = pendingProps;
		//将 effect 链表重置为空
		workInProgress.flags = NoFlags;
		workInProgress.subtreeFlags = NoFlags;
	}
	//复制当前节点的大部分属性
	workInProgress.type = current.type;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.child = current.child;
	workInProgress.memorizedState = current.memorizedState;
	workInProgress.memorizedProps = current.memorizedProps;
	return workInProgress;
};

//从 React 元素 (如 <div /> 或者函数组件) 创建 Fiber 节点
//通常在初次挂载 Fiber 树时调用
export function createFiberFromElement(element: ReactElementType): FiberNode {
	//解构 type, key, props
	//type: 元素类型，可以是字符串 ('div')，也可以是函数组件或者类组件
	const { type, key, props } = element;
	//默认是函数组件
	let fiberTag: workTag = FunctionComponent;
	if (typeof type === 'string') {
		//字符串 --> 原生 DOM 元素
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未定义的 type 类型', element);
	}
	//创建新的 FiberNode 实例
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}
