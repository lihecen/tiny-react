//updateFiberProps 函数
//将事件的回调保存到 DOM 上
//eg: onClick: () => void, className: string
import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';
//在原生 DOM 元素上存储对应的 React Props
export const elementPropsKey = '__props';
export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}
//定义一个支持事件类型的集合，将事件监听器注册到顶层容器上
//支持的事件类型
const validEventTypeList = ['click'];
//初始化事件
export function initEvent(container: Container, eventType: string) {
	//如果不是支持的事件类型，则不执行初始化
	if (!validEventTypeList.includes(eventType)) {
		console.warn('initEvent 未实现的事件类型', eventType);
		return;
	}
	if (__DEV__) {
		console.log('初始化事件', eventType);
	}
	container.addEventListener(eventType, (e: Event) => {
		//不是直接执行组件的 onClick
		//将事件转发给 React 的内部事件系统 dispatchEvent
		//dispatchEvent 会查找真实的组件 props 并调用响应的事件处理函数
		dispatchEvent(container, eventType, e);
	});
}
//dispatchEvent 是用于模拟浏览器事件触发过程的方法，它能够按照事件的冒泡或捕获阶段顺序触发注册的事件处理函数，并提供了一致性的事件接口，大致分为以下处理步骤:
//1: 收集沿途事件: 在事件冒泡或者捕获过程中，浏览器会按照一定的顺序触发相关的事件。在这个过程中，dispatchEvent 会收集经过的节点上注册的事件处理函数
//2: 构造合成事件: 在触发事件之前，dispatchEvent 会创建一个事件合成对象 SyntheticEvent，该对象会封装原生的事件对象并添加一些额外的属性和方法。这个合成事件对象用于提供一致性的事件接口，并解决不同浏览器之间的兼容性问题
//3: 遍历捕获阶段: 如果事件是冒泡型且支持捕获阶段，dispatchEvent 会从根节点开始向目标节点的父级节点遍历，依次触发沿途经过的节点上注册的捕获阶段事件处理函数
//4：遍历冒泡阶段: 如果事件是冒泡型事件，dispatchEvent 会从目标节点开始向根节点遍历，依次触发沿途经过的节点上注册的冒泡阶段事件处理函数
interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}
function dispatchEvent(container: Container, eventType: string, e: Event) {
	//获取事件的目标元素
	const targetElement = e.target;
	if (targetElement === null) {
		console.warn('事件不存在targetElement', e);
		return;
	}
	//收集沿途事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	//构造合成事件
	const syntheticEvent = createSyntheticEvent(e);
	//遍历捕获 capture
	triggerEventFlow(capture, syntheticEvent);
	//遍历冒泡 bubble
	if (!syntheticEvent.__stopPropagation) {
		triggerEventFlow(bubble, syntheticEvent);
	}
}
//收集沿途事件
//collectPaths 函数主要用于收集沿途的事件处理函数，并构建一个对象 paths, 其中包括捕获阶段和冒泡阶段的事件处理函数列表
//在函数开始时，创建一个对象 paths，包括 capture 和 bubble 两个数组，用于分别存储捕获阶段和冒泡阶段的事件处理函数
//从目标元素 targetElement 开始一直循环到容器元素 container，逐级向上遍历 DOM 树。对于每个遍历到的元素，判断该元素上是否有注册的事件处理函数
//通过 getEventCallbackNameFromEventType 函数获取事件回调函数名列表，对于每个回调函数名，检查元素属性中是否存在对应的回调函数。如果存在，则将回调函数添加到 paths 对象的相应阶段（捕获或冒泡）的事件处理函数数组
//其中，捕获阶段的事件要 unshift 进 capture 数组，方便后续从根节点向目标节点遍历，依次触发沿途节点上注册的捕获阶段事件处理函数
//冒泡阶段的事件要 push 进 bubble 数组，方便后续从目标节点向根节点遍历，依次触发沿途节点上注册的冒泡阶段事件处理函数
//最终返回构建好的 paths 对象，其中包含了捕获阶段和冒泡阶段的事件处理函数路径
type EventCallBack = (e: Event) => void;
interface Paths {
	capture: EventCallBack[];
	bubble: EventCallBack[];
}
//收集沿途事件
function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};
	//收集
	while (targetElement && targetElement !== container) {
		//获取当前 DOM 元素挂载的 props 属性
		const elementProps = targetElement[elementPropsKey];
		//如果存在 props
		if (elementProps) {
			//通过事件类型来获取对应的事件回调函数名列表
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			//如果存在对应的回调名
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const callback = elementProps[callbackName];
					if (callback) {
						if (i == 0) {
							//表示捕获阶段的回调
							paths.capture.unshift(callback);
						} else {
							paths.bubble.push(callback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}
	return paths;
}
function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}
//构造合成事件
//dispatchEvent 方法触发的事件是一个合成事件，而不是原生事件。SyntheticEvent 对象是一个用于包装浏览器原生事件的合成事件对象，它包含了与原生事件相关的信息，可以替代浏览器的原生事件对象
interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}
function createSyntheticEvent(e: Event) {
	const syntheticEvent = e as SyntheticEvent;
	//初始化
	syntheticEvent.__stopPropagation = false;
	//将原始对象的 stopPropagation 方法保存下来
	const originStopPropagation = e.stopPropagation;
	syntheticEvent.stopPropagation = () => {
		syntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return syntheticEvent;
}
//遍历捕获和冒泡阶段
function triggerEventFlow(
	paths: EventCallBack[],
	syntheticEvent: SyntheticEvent
) {
	for (let i = 0; i < paths.length; i++) {
		//取出当前的事件处理函数
		const callback = paths[i];
		callback.call(null, syntheticEvent);
		if (syntheticEvent.__stopPropagation) {
			break;
		}
	}
}
