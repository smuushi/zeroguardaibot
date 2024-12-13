export function defangUrl(url: string) {
  return url.replace(".", "(dot)");
}

export const URL_REGEX = /([^\s]+\.[^\s]+)/gi;

export function extractUrls(str: string) {
  return str.match(URL_REGEX);
}
