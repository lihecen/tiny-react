/* eslint-disable @typescript-eslint/no-explicit-any */
//生产环境
//执行 jsx 方法和 React.createElement 方法的返回结果是 ReactElement 的数据结构
import { REACT_ELEMENT_TYPE } from '../../shared/ReactSymbols';
import {
	Type,
	Ref,
	Key,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes';
//实现 ReactElement 数据结构
const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'lihecen'
	};
	return element;
};

//实现 jsx 方法
//import { jsx as _jsx } from 'react/jsx-runtime';
//function App() {
//	return _jsx('div', { children: 'Hello world!' });
//}
// jsx 方法接收两个参数，第一个为类型，第二个参数 config 为其他配置，可能有第三个参数 children
export const jsx = (type: ElementType, config: any, ...children: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	//处理 children
	const childrenLength = children.length;
	if (childrenLength) {
		if (childrenLength === 1) {
			// [child]
			props.children = children[0];
		} else {
			//[child, child, child]
			props.children = children;
		}
	}
	return ReactElement(type, key, ref, props);
};

//开发环境--> 不处理 children 参数，并且会多一些额外检查
export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	return ReactElement(type, key, ref, props);
};
