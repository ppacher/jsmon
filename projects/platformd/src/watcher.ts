import {Observable} from 'rxjs/Observable';
import {watch} from 'fs';

/**
 * Watcher is capable of watching a given resource for changes
 */
export interface Watcher {
    watch(path: string): Observable<string>;
}

/**
 * FileWatcher is a {@link Watcher} implementation that watches
 * a file for modifications and emits an event whenever the file has
 * been modified
 */
export class FileWatcher implements Watcher {
    watch(path: string): Observable<string> {
        return new Observable<string>(observer => {
            let watcher = watch(path, event => {
                observer.next(event);
            });
            
            return () => {
                watcher.close();
            }
        })
    }
}
