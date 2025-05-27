//实现 React 首屏渲染流程
//通过 ReactDOM.createRoot(root).render(<App />)方法，创建 React 应用的根节点，将一个 Placement 加入到更新队列中，并触发了首屏渲染的更新流程
//在对 Fiber 树进行深度优先遍历 (DFS) 的过程中，比较新旧节点，生成更新计划，执行 DOM 操作，最终将 <App /> 渲染到根节点上
import {
	createContainer,
	updateContainer
} from '../../react-reconciler/src/fiberReconciler';
import { Container } from './hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
//实现 ReactDOM.createRoot(root).render(<App />)
export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElementType) {
			updateContainer(element, root);
		}
	};
}
