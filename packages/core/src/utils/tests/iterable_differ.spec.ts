import {createIterableDiffer, IterableDiffer} from '../iterable_differ';

describe('IterableDiffer', () => {
    let differ: IterableDiffer<any>;
    
    beforeEach(() => {
        differ = createIterableDiffer();
    })
        
    it('should add all as new for the first time', () => {
        let diff = differ.diff([
            1,
            2,
            3,
            4,
        ]);

        let newRecords = [];
        let changedRecords = [];
        let deletedRecords = [];

        diff.forEachNewIdentity((record) => newRecords.push(record.item));
        diff.forEachDeletedIdentity(record => deletedRecords.push(record.item));
        diff.forEachIdentityChanged(record => changedRecords.push(record.item));

        expect(newRecords).toEqual([1, 2, 3, 4]);
        expect(changedRecords).toEqual([]);
        expect(deletedRecords).toEqual([]);
    });

    describe('with numbers', () => {
        beforeEach(() => {
            differ = createIterableDiffer();
        });
        
        it('should find deleted records', () => {
            differ.diff([1, 2, 3, 4]);
            
            let diff = differ.diff([2, 3]);

            let deleted = [];
            diff.forEachDeletedIdentity(record => deleted.push(record.item));
            expect(deleted).toEqual([1, 4]);
        });
        
        it('should return null when nothing changed', () => {
            differ.diff([1, 2, 3, 4]);
            expect(differ.diff([1, 2, 3, 4])).toBeNull();
        });

        it('should find new entries', () => {
            differ.diff([1, 2]);
            let diff = differ.diff([1, 2, 3, 4]);

            let newRecords = [];
            diff.forEachNewIdentity(record => newRecords.push(record.item));
            
            expect(newRecords).toEqual([3, 4]);
        });
    });

    describe('with objects', () => {
        describe('without a TrackByFunction', () => {
            beforeEach(() => differ = createIterableDiffer());

            it('should detect new elements', () => {
                let diff = differ.diff([
                    {
                        x: 1
                    },
                    {
                        x: 2 
                    }
                ]);

                let newElements = [];
                diff.forEachNewIdentity(record => newElements.push(record.item));
                
                expect(newElements[0].x).toBe(1);
                expect(newElements[1].x).toBe(2);
            });

            it('should detect all elements as deleted', () => {
                differ.diff([
                    {x: 1},
                    {x: 2},
                ]);
                
                let diff = differ.diff([
                    {x: 1},
                    {x: 2},
                ]);
                
                let deletedElements = [];

                diff.forEachDeletedIdentity(record => deletedElements.push(record.item));

                expect(deletedElements[0].x).toBe(1);
                expect(deletedElements[1].x).toBe(2);
            });
        });

        describe('with a TrackByFunction', () => {
            let a = {id: 1};
            let b = {id: 2};
                
            beforeEach(() => differ = createIterableDiffer((idx, item) => item.id));

            it('should detect new elements', () => {
                let diff = differ.diff([a, b])
                
                let newElements = [];

                diff.forEachNewIdentity(record => newElements.push(record));
                
                expect(newElements.length).toBe(2);
                expect(newElements[0].item.id).toBe(1);
                expect(newElements[0].trackById).toBe(1);
                expect(newElements[1].item.id).toBe(2);
                expect(newElements[1].trackById).toBe(2);
            });
            
            it('should detect deleted elements', () => {
                differ.diff([a, b])
                let diff = differ.diff([a])
                
                let deletedElements = [];

                diff.forEachDeletedIdentity(record => deletedElements.push(record));
                
                expect(deletedElements.length).toBe(1);
                expect(deletedElements[0].item.id).toBe(2);
                expect(deletedElements[0].trackById).toBe(2);
                
                let changed = [];
                diff.forEachIdentityChanged(record => changed.push(record));
                expect(changed.length).toBe(0);
            });
            
            it('should detect changed elements', () => {
                differ.diff([a, b])
                let diff = differ.diff([a, {id: 2, value: 'foo'}])
                
                let deletedElements = [];

                let changed = [];
                diff.forEachIdentityChanged(record => changed.push(record));
                expect(changed.length).toBe(1);
                
                expect(changed[0].item.id).toBe(2);
                expect(changed[0].item.value).toBe('foo');
                expect(changed[0].trackById).toBe(2);
            });
        })
    });
})

