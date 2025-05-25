/* eslint-disable no-constant-condition */
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
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';
let workInProgress: FiberNode | null = null;
//提交阶段的主要任务是将更新同步到实际的 DOM 中，执行 DOM 操作，例如创建、更新或删除 DOM 元素，反映组件树的最新状态，可以分为三个主要的子阶段
//1: Before Mutation (布局阶段)：主要用于执行 DOM 操作之前的准备工作，包括类似 getSnapshotBeforeUpdate 生命周期函数的处理
//2: Mutation (DOM 操作阶段)：执行实际 DOM 操作的阶段，包括创建、更新或删除 DOM 元素等。使用深度优先遍历的方式，逐个处理 Fiber 树中的节点，根据协调阶段生成的更新计划，执行相应的 DOM 操作
//3: Layout (布局阶段)：用于处理布局相关的任务，进行一些布局的优化，比如批量更新布局信息，减少浏览器的重排（reflow）次数，提高性能
//实现 commitRoot 函数 -- 即开始提交阶段的入口函数
//commitRoot 函数会判断根节点的 flags 和 subtreeFlags 是否存在上述三个阶段需要执行的操作，如果有则执行 commitMutationEffects 函数从而完成 Fiber 树的替换
//因为 current 是与视图中真实 UI 对应的 Fiber 树，而 workInProgress 是触发更新后正在 Reconciler 中计算的 Fiber 树，因此在 DOM 操作执行完之后，需要将 current 指向 workInProgress，完成 Fiber 树的切换
function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);
	//开始执行主循环
	//如果中间某个节点处理有错误，打印警告，并把 workInProgress 清空，防止挂死
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop 发生错误: ', e);
			workInProgress = null;
		}
	} while (true);
	//创建根 Fiber 树的 Root Fiber
	//将已经构建完成的 workInProgress 树赋值给 finishedWork
	const finishedWork = root.current.alternate;
	//将构建完成的新树挂载到根节点上
	root.finishedWork = finishedWork;
	//提交阶段的入口函数
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}
	//开发环境
	if (__DEV__) {
		console.log('commit 阶段开始');
	}
	//重置 -- 目的是防止重复提交
	root.finishedWork = null;
	//判断是否存在3个子阶段需要执行的操作
	const subtreeHasEffects =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;
	if (subtreeHasEffects || rootHasEffects) {
		//Mutation
		commitMutationEffects(finishedWork);
		//Fiber 树切换，current 变成 workInProgress
		root.current = finishedWork;
	} else {
		root.current = finishedWork;
	}
}
//初始化 workInProgress 变量
//直接把 workInProgress 设置成当前要渲染的 root 根节点
function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
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
	//开始工作 --> 负责构建表示更新的 Fiber 树
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
		//生成更新计划 --> 将 Fiber 树映射到实际的 DOM 结构
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
//调度功能
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	const root = markUpdateFromFiberToRoot(fiber);
	//渲染根节点
	renderRoot(root);
}
//从当前的 fiber 节点开始，向上查找根节点，然后从根节点开始 render 流程
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	while (node.return !== null) {
		node = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
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
