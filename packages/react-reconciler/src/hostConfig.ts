/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Container = any;
//模拟实现构建 DOM 函数
//createInstance: 创建 DOM
export const createInstance = (...args: any) => {
	return {} as any;
};
//appendInitialChild 将子节点挂载当前 DOM 实例上
export const appendInitialChild = (...args: any) => {
	return {} as any;
};
//createTextInstance: 创建文本节点
export const createTextInstance = (...args: any) => {
	return {} as any;
};
export const appendChildToContainer = (child: any, parent: Container) => {
	const prevParentID = child.parent;
	if (prevParentID !== -1 && prevParentID !== parent.rootID) {
		throw new Error('不能重复挂载child');
	}
	child.parent = parent.rootID;
	parent.children.push(child);
};
