/* eslint-disable @typescript-eslint/no-explicit-any */
export type Type = any;
export type Key = any;
export type Props = any;
export type Ref = any;
export type ElementType = any;
//定义 Action type
//有两种取值方式:
//1: 是一个新的状态 State 2: 是一个函数，这个函数接收前一个状态并返回一个新的状态
export type Action<State> = State | ((prevState: State) => State);
export interface ReactElementType {
	//$$typeof是内部使用的一个字段，通过这个字段来指明当前这个数据结构是否为ReactElement
	$$typeof: symbol | number;
	key: Key;
	props: Props;
	ref: Ref;
	type: ElementType;
	__mark: string;
}
