//实现 ReactDOM.createRoot().render()过程中实现的API
//createContainer 函数: 用于创建一个新的容器（container），该容器包含了 React 应用的根节点以及与之相关的一些配置信息
//createContainer 函数会创建一个新的 FiberRootNode 对象，该对象用于管理整个 React 应用的状态和更新
//updateContainer 函数: 用于更新已经存在的容器中的内容。在内部，updateContainer 函数会调用 scheduleUpdateOnFiber 等方法，通过 Fiber 架构中的协调更新过程，将新的 React 元素（element）渲染到容器中，并更新整个应用的状态
import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	updateQueue,
	createUpdate,
	createUpdateQueue,
	addQueueUpdate
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
export function createContainer(container: Container) {
	//创建一个新的 FiberNode 对象，该对象表示根节点
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	//创建一个新的 FiberRootNode 对象，该对象用于管理整个 React 应用的状态以及更新
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	//获取根节点的 current 属性，该属性表示当前正在渲染的 Fiber 节点
	const hostRootFiber = root.current;
	//创建一个 update 对象，用于存储新的 React 元素
	const update = createUpdate<ReactElementType | null>(element);
	//将 update 加入到 updateQueue 中
	addQueueUpdate(
		hostRootFiber.updateQueue as updateQueue<ReactElementType | null>,
		update
	);
	//协调更新
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}

//总结 React 应用在首次渲染或后续更新时的大致更新流程:
//1: 通过 createContainer 函数创建了 React 应用的根节点 FiberRootNode, 并将其与 DOM 节点 (hostFiberRoot) 连接起来
//2: 通过 updateContainer 函数创建了一个更新 update，并将其加入到更新队列 (updateQueue) 中，启动了首屏渲染或者后续更新的机制
//3: 调用 scheduleUpdateOnFiber 函数开始调度更新，从触发更新的节点开始向上遍历，直到达到根节点 FiberRootNode
//4: 调用 renderRoot 函数，初始化 workInProgress 变量，生成与 hostRootFiber 对应的 workInProgress hostRootFiber
//5: 开始 Reconciler 的更新流程，即 workLoop 函数，对 Fiber 树进行深度优先遍历
//6: 在向下遍历阶段会调用 beginWork 方法，在向上返回阶段会调用 completeWork 方法，这两个方法负责 Fiber 节点的创建、更新和处理
