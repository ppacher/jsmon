import {readFileSync} from 'fs';
import { unescape } from 'querystring';

export class Node {
    public leafs: Node[] = [];

    constructor(
        public line: string,
        public indent: number,
        public parent?: Node,
    ) {}
    
    create(t: string, indent: number): Node {
        let n = new Node(t, indent, this);
        this.leafs.push(n);

        return n;
    }

    toString(): string {
        let i = "";

        for (let a = 0; a < this.level; a++) {
            i = i + " ";
        }
        return `${i}Node<${this.level}: ${this.line}>\r\n` + this.leafs.map(l => l.toString()).join('');
    }
    
    findNode(s: string): Node|undefined {
        s = s.toLowerCase();

        let node = this.leafs.find(l => l.line.toLowerCase().startsWith(s));
        
        return node;
    }
    

    findNodeRec(s: string): Node|undefined {
        let n = this.findNode(s);
        if (n !== undefined) {
            return n;
        }
        
        for(let i = 0; i < this.leafs.length; i++) {
            n = this.leafs[i].findNodeRec(s);

            if (n !== undefined) {
                return n;
            }
        }
        
        return undefined;
    }
    
    get level(): number {
        let l = 0;
        let p: Node|undefined = this;

        while(p !== undefined) {
            p = p.parent;
            l++;
        }
    
        return l - 1;
    }
}

export class Tokenizer {
    static parse(data: string): Node {
        const lines = data.split(/\r?\n/);
        
        const root = new Node("(root)", -1);
        let sec = root;


        lines.forEach((line, idx) => {
            if (line === "") {
                return;
            }

            let i = Tokenizer.getIndent(line);
            
            line = line.trim();
            
            if (i === sec.indent) {
                sec = sec.parent!.create(line, i);
            }
            
            if (i > sec.indent) {
                sec = sec.create(line, i);
            }
            
            if (i < sec.indent) {
                while(i <= sec.indent) {
                    sec = sec.parent!;
                }
                
                sec = sec.create(line, i);
            }
        });
        
        return root;
    }
    
    static getIndent(l: string): number {
        let i = 0;
        for(i = 0; i < l.length; i++) {
            if (l[i] !== ' ' && l[i] !== '\t') {
                return i;
            }
        }
        
        return Math.round(l.length / 2);
    }
}