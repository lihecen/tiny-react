//reconcileChildren 函数中调用了 reconcileChildFibers 和 mountChildFibers 两个函数，它们分别负责处理更新阶段和首次渲染阶段的子节点协调
//reconcileChildFibers:
//reconcileChildFibers 函数作用于组件的更新阶段，即当组件已经存在于 DOM 中，需要进行更新时
//主要任务是协调处理当前组件实例的子节点，对比之前的子节点（current）和新的子节点（workInProgress）之间的变化
//根据子节点的类型和 key 进行对比，决定是复用、更新、插入还是删除子节点，最终形成新的子节点链表

//mountChildFibers:
//mountChildFibers 函数作用于组件的首次渲染阶段，即当组件第一次被渲染到 DOM 中时
//主要任务是协调处理首次渲染时组件实例的子节点
//但此时是首次渲染，没有之前的子节点，所以主要是创建新的子节点链表
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';
//根据参数 shouldTrackSideEffects 控制是否追踪副作用 (如 DOM 插入操作)
//true: 更新阶段 false: 初次挂载 (所有节点都被插入)
function ChildReconciler(shouldTrackSideEffects: boolean) {
	//处理单个 Element 节点的情况
	//对比 current Fiber 与 ReactElement
	//生成 workInProgress FiberNode
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		//returnFiber: 当前正在处理的父 Fiber
		//currentFiber: 之前的子节点
		//element: 当前 ReactElement
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}
	//处理文本节点
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}
	//为 Fiber 节点添加更新的 flags
	function placeSingleChild(fiber: FiberNode) {
		//当首屏渲染且追踪副作用时，才会添加更新 flags
		if (shouldTrackSideEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}
	//根据 shouldTrackSideEffects 返回不同的 reconcileChildFibers 实现
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		//判断当前 fiber 类型
		//单个 Element 节点
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的 reconcile 类型', newChild);
					}
					break;
			}
		}
		//多个 Element 节点
		if (Array.isArray(newChild)) {
			if (__DEV__) {
				console.warn('未实现的 reconcile 类型', newChild);
			}
		}
		//文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		if (__DEV__) {
			console.warn('未实现的 reconcile 类型', newChild);
		}
		return null;
	};
}

//组件的更新阶段中，追踪副作用
export const reconcileChildFibers = ChildReconciler(true);
//首屏渲染阶段中不追踪副作用，只对根节点进行一次 DOM 插入操作
export const mountChildFibers = ChildReconciler(false);
