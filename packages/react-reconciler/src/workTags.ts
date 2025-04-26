//标识不同类型的工作单元
export type workTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

//函数式组件
export const FunctionComponent = 0;
//应用在宿主环境挂载的根节点
export const HostRoot = 3;
//宿主组件
export const HostComponent = 5;
//文本节点
export const HostText = 6;
