export const ANNOTATIONS = '__annotations__'
export const PARAMETERS = '__parameters__'
export const PROP_METADATA = '__property__'

/**
 * @suppress {globalThis}
 */
export function makeDecorator(
  name: string,
  props?: (...args: any[]) => any,
  chain?: (decorator: any) => any
): { new (...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any } {
  const metaCtor = makeMetadataCtor(props)

  function DecoratorFactory(obj: any): (cls: any) => any {
    if (this instanceof DecoratorFactory) {
      metaCtor.call(this, obj)
      return this
    }

    const annotationInstance = new (<any>DecoratorFactory)(obj)

    const TypeDecorator = function(cls: any) {
      const annotations = cls.hasOwnProperty(ANNOTATIONS)
        ? (cls as any)[ANNOTATIONS]
        : Object.defineProperty(cls, ANNOTATIONS, { value: [] })[ANNOTATIONS]

      annotations.push(annotationInstance)

      return cls
    }

    if (chain) {
      return chain(TypeDecorator)
    }

    return TypeDecorator
  }

  DecoratorFactory.prototype.diMetadataName = name

  return DecoratorFactory as any
}

export function makeParamDecorator(name: string, props?: (...args: any[]) => any): any {
  const meta = makeMetadataCtor(props)
  function ParameterDecoratorFactory(...args: any[]): any {
    if (this instanceof ParameterDecoratorFactory) {
      meta.apply(this, args)
      return this
    }

    const annotation = new (<any>ParameterDecoratorFactory)(...args)
    ;(<any>ParameterDecoratorFactory).annotation = annotation

    function ParameterDecorator(cls: any, target: any, index: number): any {
      const parameters = cls.hasOwnProperty(PARAMETERS)
        ? (cls as any)[PARAMETERS]
        : Object.defineProperty(cls, PARAMETERS, { value: [] })[PARAMETERS]

      while (parameters.length <= index) {
        parameters.push(null)
      }

      ;(parameters[index] = parameters[index] || []).push(annotation)
      return cls
    }

    return ParameterDecorator
  }

  ParameterDecoratorFactory.prototype.diMetadataName = name
  ;(<any>ParameterDecoratorFactory).annotationCls = ParameterDecoratorFactory

  return ParameterDecoratorFactory
}

export function makePropDecorator(
  name: string,
  props?: (...args: any[]) => any,
  parentClass?: any
): any {
  const metaCtor = makeMetadataCtor(props)

  function PropDecoratorFactory(...args: any[]): any {
    if (this instanceof PropDecoratorFactory) {
      metaCtor.apply(this, args)
      return this
    }

    const decoratorInstance = new (<any>PropDecoratorFactory)(...args)

    return function PropDecorator(target: any, name: string) {
      const constructor = target.constructor
      // Use of Object.defineProperty is important since it creates non-enumerable property which
      // prevents the property from being copied during subclassing.
      const meta = constructor.hasOwnProperty(PROP_METADATA)
        ? (constructor as any)[PROP_METADATA]
        : Object.defineProperty(constructor, PROP_METADATA, { value: {} })[PROP_METADATA]
      meta[name] = (meta.hasOwnProperty(name) && meta[name]) || []
      meta[name].unshift(decoratorInstance)
    }
  }

  if (parentClass) {
    PropDecoratorFactory.prototype = Object.create(parentClass.prototype)
  }

  PropDecoratorFactory.prototype.diMetadataName = name
  ;(<any>PropDecoratorFactory).annotationCls = PropDecoratorFactory
  return PropDecoratorFactory
}

export function makeMetadataCtor(props?: (...args: any[]) => any): any {
  return function ctor(...args: any[]) {
    if (props) {
      const values = props(...args)
      for (const propName in values) {
        this[propName] = values[propName]
      }
    }
  }
}

export function getDiMetadataName(value: any): string {
  // BUG(ppacher): the following work-around fixes a bug where
  // instanceof Device does not work for classes within the @homebot/common
  // package. No clue why ...
  // (we may have two version of homebot/common in the path...)
  let diMetadataName = ''
  if (value.constructor) {
    diMetadataName = value.constructor.prototype.diMetadataName
  }

  return diMetadataName
}
