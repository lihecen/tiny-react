//commitMutationEffects 函数负责深度优先遍历 Fiber 树，递归向下寻找子节点是否存在 Mutation 阶段需要执行的 Flags
//如果遍历到某个节点，其所有的子节点都不存在 Flags，则停止向下，调用 commitMutationEffectsOnFiber 处理该节点的 Flags, 之后开始遍历其兄弟节点和父节点
//commitMutationEffectsOnFiber 会根据每个节点的 Flags 和更新计划中的信息执行相应的 DOM 操作
import { Container, appendChildToContainer } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';
//记录遍历时当前正在处理的 Fiber 节点
let nextEffect: FiberNode | null = null;
//Mutation 阶段，提交 HostComponent 的副作用
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	//深度优先遍历 Fiber 树，寻找更新 Flags
	while (nextEffect !== null) {
		//向下遍历
		const child: FiberNode | null = nextEffect.child;
		//如果有子节点并且子节点存在 Mutation 阶段需要执行的 Flags
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			//子节点不存在或者子节点不存在 Mutation 阶段需要执行的 Flags
			//向上遍历
			up: while (nextEffect !== null) {
				//处理 Flags
				commitMutationEffectOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				//遍历兄弟节点
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				//遍历父节点
				nextEffect = nextEffect.return;
			}
		}
	}
};
//遍历 Fiber 树，处理 Flags
const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;
	//位运算
	//判断该节点是否包含副作用
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		//清除该副作用标志
		finishedWork.flags &= ~Placement;
	}
	if ((flags & Update) !== NoFlags) {
		finishedWork.flags &= ~Update;
	}
	if ((flags & ChildDeletion) !== NoFlags) {
		finishedWork.flags &= ~ChildDeletion;
	}
};
//执行 DOM 插入操作，将 FiberNode 对应的 DOM 插入到 parent DOM 中
const commitPlacement = (finishedWork: FiberNode) => {
	//开发模式
	if (__DEV__) {
		console.log('执行 Placement 操作', finishedWork);
	}
	//查找一个对应实际 DOM 的节点
	const hostParent = getHostParent(finishedWork);
	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};
//获取 parent DOM
const getHostParent = (fiber: FiberNode): Container | null => {
	let parent = fiber.return;
	while (parent !== null) {
		const parentTag = parent.tag;
		//处理 root 节点
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		//处理原生 DOM 节点
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		} else {
			parent = parent.return;
		}
	}
	if (__DEV__) {
		console.log('未找到 host parent', fiber);
	}
	return null;
};
//遍历子节点，将子节点的 DOM 插入到 parent DOM 中
const appendPlacementNodeIntoContainer = (
	finishedWork: FiberNode,
	hostParent: Container
) => {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		//插入到 parent DOM 中
		appendChildToContainer(finishedWork.stateNode, hostParent);
	} else {
		const child = finishedWork.child;
		if (child !== null) {
			appendPlacementNodeIntoContainer(child, hostParent);
			//处理子节点的兄弟节点
			let sibling = child.sibling;
			while (sibling !== null) {
				appendPlacementNodeIntoContainer(sibling, hostParent);
				sibling = sibling.sibling;
			}
		}
	}
};
