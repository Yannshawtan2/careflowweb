import Cookies from 'js-cookie';

export const setCookie = (name: string, value: string, options?: { expires?: number }) => {
  Cookies.set(name, value, {
    expires: options?.expires || 7, // 7 days default
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

export const getCookie = (name: string) => {
  return Cookies.get(name);
};

export const deleteCookie = (name: string) => {
  Cookies.remove(name, { path: '/' });
}; 