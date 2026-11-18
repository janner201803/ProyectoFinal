/** Simple generic linked list used to keep the service catalog in insertion order. */
export class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length = 0;

  get size(): number {
    return this.length;
  }

  append(value: T): void {
    const node = new ListNode(value);
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.length += 1;
  }

  toArray(): T[] {
    const values: T[] = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }
}

class ListNode<T> {
  next: ListNode<T> | null = null;
  constructor(readonly value: T) {}
}

/** First-in, first-out queue used by breadth-first campus route search. */
export class Queue<T> {
  private first: QueueNode<T> | null = null;
  private last: QueueNode<T> | null = null;

  get isEmpty(): boolean {
    return this.first === null;
  }

  enqueue(value: T): void {
    const node = new QueueNode(value);
    if (this.last) this.last.next = node;
    else this.first = node;
    this.last = node;
  }

  dequeue(): T | undefined {
    if (!this.first) return undefined;
    const value = this.first.value;
    this.first = this.first.next;
    if (!this.first) this.last = null;
    return value;
  }
}

class QueueNode<T> {
  next: QueueNode<T> | null = null;
  constructor(readonly value: T) {}
}

/** Tree node that groups campus services by category. */
export class CategoryNode<T> {
  readonly children: CategoryNode<T>[] = [];
  readonly values: T[] = [];

  constructor(readonly label: string) {}

  addChild(label: string): CategoryNode<T> {
    const child = new CategoryNode<T>(label);
    this.children.push(child);
    return child;
  }
}

/** Trie for prefix lookup of service names and keywords. */
export class Trie {
  private readonly root = new TrieNode();

  insert(term: string): void {
    let node = this.root;
    for (const character of normalize(term)) {
      if (!node.children.has(character)) node.children.set(character, new TrieNode());
      node = node.children.get(character)!;
    }
    node.terms.add(term);
  }

  search(prefix: string): string[] {
    let node = this.root;
    for (const character of normalize(prefix)) {
      const next = node.children.get(character);
      if (!next) return [];
      node = next;
    }
    const results: string[] = [];
    this.collect(node, results);
    return results;
  }

  private collect(node: TrieNode, results: string[]): void {
    results.push(...node.terms);
    for (const child of node.children.values()) this.collect(child, results);
  }
}

class TrieNode {
  readonly children = new Map<string, TrieNode>();
  readonly terms = new Set<string>();
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}
