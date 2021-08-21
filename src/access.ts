/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: { currentUser?: API.CurrentUser | undefined }) {
  const { currentUser = {} } = initialState || {};
  const access = Array.isArray(currentUser?.access) ? currentUser?.access : [currentUser?.access];
  console.log('access', access);
  checkAuth.prototype.access = access;
  return {
    canAdmin: checkAuth,
    canReadFoo: checkAuth,
  };
}
function checkAuth({ authority }: any) {
  const access = checkAuth.prototype.access;
  if (typeof authority === 'string') {
    return access.includes(authority);
  } else if (authority instanceof Array) {
    const result = authority.some((item: string | []) => {
      if (item instanceof Array) {
        const andResult = item.every((k) => {
          return access?.includes(k);
        });
        return andResult;
      }
      return access?.includes(item);
    });
    return result;
  } else {
    throw '路由authority配置必须是字符串或者数组';
  }
}
