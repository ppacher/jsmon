import {makePropDecorator, PROP_METADATA, Type} from '@jsmon/core';

export interface Topic {
    topic: string;
}

export interface TopicDecorator {
    (topic: string): any;
    new (topic: string): Topic;
}

export const Topic = makePropDecorator('Topic', (topic: string) => ({topic}));

export function getTopicHandlers(instance: Type<any>): {[handleName: string]: string[]} {
    const topics: {[key: string]: string[]} = {};
    
    const annotations = Reflect.getOwnPropertyDescriptor(instance, PROP_METADATA)
    if (annotations === undefined) {
        return {};
    }
    
    Object.keys(annotations.value)
        .forEach(propertyKey => {
            const topicDecorators: Topic[] = annotations.value[propertyKey].filter((a: any) => a instanceof Topic);
            
            if (topicDecorators.length === 0) {
                return;
            }
            
            topics[propertyKey] = topicDecorators.map(d => d.topic);
        });

    return topics;
}