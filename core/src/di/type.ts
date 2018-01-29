/** Type definition for a class / interface constructor */
export const Type = Function;

export function isType(v: any): v is Type<any> {
  return typeof v === 'function';
}

export interface Type<T> extends Function { new (...args: any[]): T; }