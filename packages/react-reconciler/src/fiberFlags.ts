//标识不同类型的副作用
export type Flags = number;
//0 -> 表示没有任何的副作用
export const NoFlags = 0b0000000;
//1 -> 表示执行过更新
export const PerformedWork = 0b0000001;
//2 -> 表示节点被插入
export const Placement = 0b0000010;
//4 -> 表示节点被更新
export const Update = 0b0000100;
//8 -> 表示子节点被删除
export const ChildDeletion = 0b0001000;
export const MutationMask = Placement | Update | ChildDeletion;
