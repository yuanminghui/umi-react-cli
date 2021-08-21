/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { message, notification } from 'antd';
// @ts-ignore
import Cookie from 'js-cookie';
import { history } from 'umi';
import { extend } from 'umi-request';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */
export const errorHandler = (error: { response: Response }): Response => {
  const { response } = error;
  if (!response) {
    history.push('/404');
    notification.error({
      message: `请求出错`,
    });
  }
  console.log(response);
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;

    notification.error({
      message: `Request error ${status}: ${url}`,
      description: errorText,
    });
  }
  return response;
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  errorHandler, // 默认错误处理
  credentials: 'include', // 默认请≥求是否带上cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Lang': 'zh',
  },
});

request.use(async (ctx, next) => {
  const { req } = ctx;
  const { options } = req;
  const headers = { ...options.headers } as any;
  if (Cookie.get('X-Auth-Token')) {
    headers['X-Auth-Token'] = Cookie.get('X-Auth-Token');
  }

  headers['X-Terminal'] = Cookie.get('X-Terminal');

  ctx.req.options = {
    ...options,
    headers,
  };

  await next();
  const { res } = ctx;
  const { success = false } = res; // 假设返回结果为 : { success: false, errorCode: 'B001' }
  if (!success) {
    // 对异常情况做对应处理
  }
});

// @ts-ignore
request.interceptors.response.use(async (response, options) => {
  if (options.responseType === 'blob') {
    return response;
  }
  const { code, data, msg } = await response.clone().json();
  console.log(code, data, msg);
  if (code === '0') {
    return {
      data,
      error: false,
    };
  }
  message.error(msg || 'Server error');
  if (code === '10') {
    history.replace('/price/check?needLogin=true');
  } else if (code === '11') {
    // 没有权限
    history.replace('/price/check');
  }

  return {
    error: true,
  };
});
export default {
  post: async (
    url: string,
    params: any = {},
    successMessage?: string,
    headers = {},
    options = {},
    getResponse = false,
  ) => {
    const response = await request.post(url, {
      data: params,
      headers,
      ...options,
    });
    if (getResponse) {
      return response;
    }
    const { error, data = {} } = (response || {}) as any;
    if (!error) {
      if (successMessage) {
        message.success(successMessage);
      }
      return data;
    }
    return { error };
  },
  put: request.put,
  get: async (url: string, successMessage = '') => {
    const response = await request.get(url);
    const { error, data = {} } = (response || {}) as any;
    if (!error) {
      if (successMessage) {
        message.success(successMessage);
      }
      return data;
    }
    return { error };
  },
  delete: async (url: string, params: any, successMessage?: string) => {
    const response = await request.delete(url, params);
    const { error, data = {} } = (response || {}) as any;
    if (!error) {
      if (successMessage) {
        message.success(successMessage);
      }
    }
    return data;
  },
};
