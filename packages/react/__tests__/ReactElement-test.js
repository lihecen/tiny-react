/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';
let React;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ReactDOM;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let ReactTestUtils;
describe('ReactElement', () => {
	let ComponentFC;
	let originalSymbol;
	beforeEach(() => {
		jest.resetModules();
		originalSymbol = global.Symbol;
		global.Symbol = undefined;
		React = require('react').default;
		ReactDOM = require('react-dom');
		ReactTestUtils = require('react-dom/test-utils');
		ComponentFC = () => {
			return React.createElement('div');
		};
	});
	afterEach(() => {
		global.Symbol = originalSymbol;
	});
	it('uses the fallback value when in an environment without Symbol', () => {
		//测试在没有 Symbol 的环境中，React 元素的 $$typeOf属性是否使用备用值
		expect((<div />).$$typeof).toBe(0xeac7);
	});
	it('returns a complete element according to spec', () => {
		//测试 React.createElement 是否返回一个符合规范的完整元素
		const element = React.createElement(ComponentFC);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});
	it('allows a string to be passed as the type', () => {
		//测试是否可以将字符串作为类型传递给 React.createElement
		const element = React.createElement('div');
		expect(element.type).toBe('div');
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});
	it('returns an immutable element', () => {
		//测试 React.createElement 返回的元素是否是不可变的
		const element = React.createElement(ComponentFC);
		expect(() => (element.type = 'div')).not.toThrow();
	});
	it('does not reuse the original config object', () => {
		//测试 React.createElement是否重用原始配置对象
		const config = { foo: 1 };
		const element = React.createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
		config.foo = 2;
		expect(element.props.foo).toBe(1);
	});
	it('does not fail if config has no prototype', () => {
		//测试如果配置对象没有原型，React.createElement 是否失败
		const config = Object.create(null, { foo: { value: 1, enumerable: true } });
		const element = React.createElement(ComponentFC, config);
		expect(element.props.foo).toBe(1);
	});
	it('extracts key and ref from the config', () => {
		//测试 React.createElement 是否从配置中提取 key 和 ref
		const element = React.createElement(ComponentFC, {
			key: '12',
			ref: '34',
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe('34');
		expect(element.props).toEqual({ foo: '56' });
	});
	it('extracts null key and ref', () => {
		//测试 React.createElement 是否提取 null 的 key 和 ref
		const element = React.createElement(ComponentFC, {
			key: null,
			ref: null,
			foo: '12'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('null');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '12' });
	});
	it('ignores undefined key and ref', () => {
		//测试 React.createElement 是否忽略未定义的 key 和 ref
		const props = {
			foo: '56',
			key: undefined,
			ref: undefined
		};
		const element = React.createElement(ComponentFC, props);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});
	it('ignores key and ref warning getters', () => {
		//测试 React.createElement 是否忽略 key 和 ref 的警告 getter
		const elementA = React.createElement('div');
		const elementB = React.createElement('div', elementA.props);
		expect(elementB.key).toBe(null);
		expect(elementB.ref).toBe(null);
	});
	it('coerces the key to a string', () => {
		//测试 React.createElement 是否将 key 强制转化为字符串
		const element = React.createElement(ComponentFC, {
			key: 12,
			foo: '56'
		});
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe('12');
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({ foo: '56' });
	});
	it('merges an additional argument onto the children prop', () => {
		//测试 React.createElement 是否将额外的参数合并到 children 属性上
		const a = 1;
		const element = React.createElement(
			ComponentFC,
			{
				children: 'text'
			},
			a
		);
		expect(element.props.children).toBe(a);
	});
	it('does not override children if no rest args are provided', () => {
		//测试如果没有提供其他参数，React.createElement 是否覆盖 children 属性
		const element = React.createElement(ComponentFC, {
			children: 'text'
		});
		expect(element.props.children).toBe('text');
	});
	it('overrides children if null is provided as an argument', () => {
		//测试如果将 null 作为参数提供，React.createElement 是否覆盖 children 属性
		const element = React.createElement(
			ComponentFC,
			{
				children: 'text'
			},
			null
		);
		expect(element.props.children).toBe(null);
	});
	it('merges rest arguments onto the children prop in an array', () => {
		//测试 React.createElement 是否将剩余参数合并到 children 属性的数组中
		const a = 1;
		const b = 2;
		const c = 3;
		const element = React.createElement(ComponentFC, null, a, b, c);
		expect(element.props.children).toEqual([1, 2, 3]);
	});
	it('allows static methods to be called using the type property', () => {
		//测试是否可以使用类型属性调用静态方法
		function StaticMethodComponent() {
			return React.createElement('div');
		}
		StaticMethodComponent.someStaticMethod = () => `someReturnValue`;
		const element = React.createElement(StaticMethodComponent);
		expect(element.type.someStaticMethod()).toBe('someReturnValue');
	});
	it('is indistinguishable from a plain object', () => {
		//测试 React 元素是否与普通对象无法区分
		const element = React.createElement('div', { className: 'foo' });
		const object = {};
		expect(element.constructor).toBe(object.constructor);
	});
});
