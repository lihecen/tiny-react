import * as React from 'react';
//将 react-reconciler 和 react 解耦，不从 react 包中调用数据共享层
const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
export default internals;
