/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// packages/react-dom/scr/hostConfig.ts
export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: any): Instance => {
	// TODO: 处理 props
	const element = document.createElement(type);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	const element = document.createTextNode(content);
	return element;
};

export const appendChildToContainer = (
	child: Instance,
	parent: Instance | Container
) => {
	parent.appendChild(child);
};
