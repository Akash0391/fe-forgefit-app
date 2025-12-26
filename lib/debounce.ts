export function debounce(fn: any, delay = 400) {
  let timeout: any;
  return (...args: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
