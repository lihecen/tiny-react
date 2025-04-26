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
import { Props, Key, Ref } from 'shared/ReactTypes';
import { workTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';
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
