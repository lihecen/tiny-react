//completeWork 根据 Fiber 节点类型构建 DOM 节点，收集更新 flags, 并且根据更新 flags 执行不同的 DOM 操作
//HostRoot:
//表示根节点
//会执行一些与根节点相关的最终操作，例如处理根节点的属性，确保整个应用更新完毕

//HostComponent:
//表示原生 DOM 节点
//构建 DOM 节点，并调用 appendAllChildren 函数将 DOM 插入到 DOM 树上，收集更新 flags，并根据更新的 flags 执行不同的 DOM 操作，例如插入新节点，更新节点属性，删除节点等

//HostText:
//表示文本节点
//构建 DOM 节点，并将 DOM 插入到 DOM 树上
//收集更新 flags，根据 flags 的值，更新文本节点的内容
import {
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { NoFlags } from './fiberFlags';
//生成更新计划，计算和收集更新 flags
export const completeWork = (workInProgress: FiberNode) => {
	const newProps = workInProgress.pendingProps;
	const current = workInProgress.alternate;
	switch (workInProgress.tag) {
		case HostRoot:
			//对于根节点，只需要向上冒泡节点的副作用标记
			bubbleProperties(workInProgress);
			return null;
		case HostComponent:
			if (current !== null && workInProgress.stateNode !== null) {
				//TODO: 组件更新阶段
			} else {
				//首屏渲染阶段
				//创建新的 DOM 元素, eg: document.createElement('div')
				const instance = createInstance(workInProgress.type, newProps);
				//将 DOM 插入到 DOM 树中
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			//收集更新 flags
			bubbleProperties(workInProgress);
			return null;
		case HostText:
			if (current !== null && workInProgress.stateNode !== null) {
				//TODO: 组件更新阶段
			} else {
				//首屏渲染阶段
				//构建 DOM 元素
				const instance = createTextInstance(newProps.content);
				workInProgress.stateNode = instance;
			}
			//收集更新 flags
			bubbleProperties(workInProgress);
			return null;
		default:
			if (__DEV__) {
				console.warn('completeWork 未实现的类型', workInProgress);
			}
			return null;
	}
};

//appendAllChildren 函数负责递归的将组件的子节点添加到指定的 parent 中，通过深度优先遍历遍历 workInProgress 的子节点链表, 处理每个子节点的类型
//先处理当前节点的所有子节点，再处理兄弟节点
//如果为原生 DOM 元素节点或者文本节点，则将其添加到父节点中
//如果是其他类型的组件节点并且有子节点，则递归处理子节点
function appendAllChildren(parent: FiberNode, workInProgress: FiberNode) {
	let node = workInProgress.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			//处理原生 DOM 元素或者文本节点
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			//递归处理其他类型的组件节点的子节点
			node.child.return = node;
			node = node.child;
			continue;
		}
		//如果返回到最深层的节点，说明处理完毕
		if (node === workInProgress) {
			return;
		}
		//如果当前节点没有兄弟节点，说明已处理完，需要向上返回父节点寻找下一个兄弟节点
		while (node.sibling === null) {
			//如果已经回到根节点或者没有父节点，就结束遍历
			if (node.return === null || node.return === workInProgress) {
				return;
			}
			node = node.return;
		}
		//处理下一个兄弟节点
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

//bubbleProperties 函数负责在 completeWork 函数向上遍历的过程中，通过向上冒泡子节点的 flags，将所有更新 flags 收集到根节点
//从当前需要冒泡属性的 Fiber 节点开始，检查是否有需要冒泡的属性。如果当前节点有需要冒泡的属性，将这些属性冒泡到父节点的 subtreeFlags 或者其他适当的属性中
//递归调用 bubbleProperties 函数，处理父节点，将属性继续冒泡到更上层的祖先节点，直至达到根节点
function bubbleProperties(workInProgress: FiberNode) {
	//累加节点所有子树的 flags
	let subtreeFlags = NoFlags;
	let child = workInProgress.child;
	//遍历兄弟节点
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;
		//建立父子节点关系
		child.return = workInProgress;
		child = child.sibling;
	}
	//把累加的子树 subtreeFlags 传入当前的 workInProgress 中
	workInProgress.subtreeFlags |= subtreeFlags;
}
