export const ANNOTATIONS = '__annotations__';
export const PARAMETERS = '__parameters__';

/**
 * @suppress {globalThis}
 */
export function makeDecorator(name: string,
                              props?: (...args: any[]) => any,
                              chain?: (decorator: any) => any):
                              {new (...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any;}{
    const metaCtor = makeMetadataCtor(props);

    function DecoratorFactory(obj: any): (cls: any ) => any {
        if (this instanceof DecoratorFactory) {
            metaCtor.call(this, obj);
            return this;
        }
        
        const annotationInstance = new (<any>DecoratorFactory)(obj); 
        
        const TypeDecorator = function(cls: any) {
            
            const annotations = cls.hasOwnProperty(ANNOTATIONS) ?
                (cls as any)[ANNOTATIONS]
                : Object.defineProperty(cls, ANNOTATIONS, {value:  []})[ANNOTATIONS];
                
            annotations.push(annotationInstance);
            
            return cls;
        };
        
        if (chain) {
            return chain(TypeDecorator);
        }

        return TypeDecorator;
    }
    
    DecoratorFactory.prototype.diMetadataName = name;
    
    return (DecoratorFactory as any);
}

export function makeParamDecorator(name: string,
                                   props?: (...args: any[]) => any): any {
    const meta = makeMetadataCtor(props);
    function ParameterDecoratorFactory(...args: any[]): any {
        if (this instanceof ParameterDecoratorFactory) {
            meta.apply(this, args);
            return this;
        }
        
        const annotation = new (<any>ParameterDecoratorFactory)(...args);
        (<any>ParameterDecoratorFactory).annotation = annotation;

        function ParameterDecorator(cls: any, target: any, index: number): any {
            const parameters = cls.hasOwnProperty(PARAMETERS) ?
                (cls as any)[PARAMETERS]
                : Object.defineProperty(cls, PARAMETERS, {value: []})[PARAMETERS];

            while(parameters.length <= index) {
                parameters.push(null);
            }
            
            (parameters[index] = parameters[index] || []).push(annotation);
            return cls;
        }
        
        return ParameterDecorator;
    }

    ParameterDecoratorFactory.prototype.diMetadataName = name;
    (<any>ParameterDecoratorFactory).annotationCls = ParameterDecoratorFactory;
    
    return ParameterDecoratorFactory;
}

export function makeMetadataCtor(props?: (...args: any[]) => any): any {
    return function ctor(...args: any[]) {
        if (props) {
            const values = props(...args);
            for (const propName in values) {
                this[propName] = values[propName];
            }
        }
    }
}