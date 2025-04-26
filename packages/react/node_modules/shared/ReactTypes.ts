/* eslint-disable @typescript-eslint/no-explicit-any */
export type Type = any;
export type Key = any;
export type Props = any;
export type Ref = any;
export type ElementType = any;
export interface ReactElementType {
	//$$typeof是内部使用的一个字段，通过这个字段来指明当前这个数据结构是否为ReactElement
	$$typeof: symbol | number;
	key: Key;
	props: Props;
	ref: Ref;
	type: ElementType;
	__mark: string;
}
