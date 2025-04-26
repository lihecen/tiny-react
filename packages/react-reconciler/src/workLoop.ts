//实现 Reconciler 的更新流程
//具体流程
//1: 遍历 Fiber 树: React 使用 DFS 来遍历 Fiber 树，首先会从 Fiber 树的根节点开始遍历，遍历整棵树的结构
//2: 比较新旧节点: 对于每个 Fiber 节点，Reconciler 会比较新节点(React Element) 和旧节点(现有的 FiberNode) 之间的差异，比较内容包括节点类型，属性，子节点等差异
//3: 生成更新计划: 根据比较结果，Reconciler 会生成一个更新计划，用于确定需要进行的操作。更新计划通常包括哪些节点需要更新，哪些节点需要插入到 DOM 中，哪些节点需要删除等信息
//4: 打标记: 为了记录不同节点的操作，React 会为每个节点打上不同的标记。例如，如果节点需要更新，可能会打上更新标记（Update Tag）；如果节点是新创建的，可能会打上插入标记（Placement Tag）；如果节点被移除，可能会打上删除标记（Deletion Tag）等
//5: 更新 Fiber 节点:  根据生成的更新计划和标记，Reconciler 会更新对应的 Fiber 节点以反映组件的最新状态
//6: 递归处理子节点: 对于每个节点的子节点，React 会递归地重复进行上述的比较和更新操作，以确保整个组件树都得到了正确的处理

//当所有 React Element 都比较完成之后，会生成一棵新的 Fiber 树，此时，一共存在两棵 Fiber 树:
//current: 与视图中真实 UI 对应的 Fiber 树，当 React 开始新的一轮渲染时，会使用 current 作为参考来比较新的树与旧树的差异，决定如何更新 UI
//workInProgress: 触发更新后，正在 Reconciler 中计算的 Fiber 树，一旦 workInProgress 上的更新完成，它将会被提交为新的current，成为下一次渲染的参考树，并清空旧的 current 树

//current Fiber 树中的 Fiber 节点被称为 current fiber, workInProgress Fiber 树中的 Fiber 节点被称为 workInProgress fiber
//通过 alternate 属性来连接，即
//currentFiber.alternate === workInProgressFiber | workInProgressFiber.alternate === currentFiber
import { FiberNode } from './fiber';
let workInProgress: FiberNode | null = null;
function renderRoot(root: FiberNode) {
	prepareFreshStack(root);
	//开始执行主循环
	//如果中间某个节点处理有错误，打印警告，并把 workInProgress 清空，防止挂死
	try {
		workLoop();
	} catch (e) {
		console.warn('workLoop 发生错误: ', e);
		workInProgress = null;
	}
}
//初始化 workInProgress 变量
//直接把 workInProgress 设置成当前要渲染的 root 根节点
function prepareFreshStack(root: FiberNode) {
	workInProgress = root;
}
//DFS
//向下递归子节点
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
function performUnitOfWork(fiber: FiberNode) {
	//比较并返回子 FiberNode
	//开始工作
	const next = beginWork(fiber);
	//更新节点的新属性
	fiber.memorizedProps = fiber.pendingProps;
	if (next === null) {
		//如果当前没有子节点，则遍历兄弟节点或者父节点
		completeUnitOfWork(fiber);
	} else {
		//如果当前有子节点，则继续向下进行深度遍历
		workInProgress = next;
	}
}
function completeUnitOfWork(fiber: FiberNode) {
	//从当前节点开始
	let node: FiberNode | null = fiber;
	do {
		//生成更新计划
		completeWork(node);
		//如果有兄弟节点，则遍历兄弟节点
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		//否则向上返回, 遍历父节点
		node = node.return;
		//workInProgress 最终指向根节点
		workInProgress = node;
	} while (node !== null);
}

//eg: 对于下面的组件，render 阶段会依次执行
//function App() {
//	return (
//		<div>
//			Hello
//			<span>World</span>
//		</div>
//	);
//}

//HostRootFiber beginWork(生成 App FiberNode) -> App fiberNode beginWork(生成 div fiberNode) -> div fiberNode beginWork(生成 'Hello' 以及 span fiberNode)
// -> 'Hello' fiberNode beginWork(叶子元素) -> 'Hello' fiberNode completeWork -> span fiberNode beginWork(叶子元素) -> span fiberNode completeWork
// -> div fiberNode completeWork -> App fiberNode completeWork -> HostRootFiber completeWork
