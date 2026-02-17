import { getRequestConfig } from 'next-intl/server';

export const locales = ['en'];

export default getRequestConfig(async () => {
  return {
    locale: 'en',
    messages: (await import('./messages/en.json')).default
  };
});
