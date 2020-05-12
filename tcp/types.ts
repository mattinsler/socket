export interface IPOptions {
  port: number;
  host?: string;
}
export interface LocalOptions {
  path: string;
}

export type Options = IPOptions | LocalOptions;

export function isIPOptions(value: Options): value is IPOptions {
  return typeof (value as IPOptions).port === 'number';
}

export function isLocalOptions(value: Options): value is LocalOptions {
  return typeof (value as LocalOptions).path === 'string';
}
