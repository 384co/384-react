type QueueOptions = { maxProcessing?: number }


class Queue {
    elements: any;
    head: number;
    tail: number;
    inProcess: number;
    maxProcessing: number;

    constructor(options?: QueueOptions) {
        this.elements = {};
        this.head = 0;
        this.tail = 0;
        this.inProcess = 0;
        this.maxProcessing = options?.maxProcessing ? options?.maxProcessing : 1;
    }
    enqueue(item: unknown) {
        this.elements[this.tail] = item;
        this.tail++;
    }
    dequeue(): unknown {
        const item = this.elements[this.head];
        delete this.elements[this.head];
        this.head++;
        return item;
    }
    peek() {
        return this.elements[this.head];
    }

    get processing() {
        return this.inProcess;
    }

    set processing(processing) {
        this.inProcess = processing;
    }

    get length() {
        return this.tail - this.head;
    }

    get isEmpty() {
        return this.length === 0;
    }

    get isMaxed() {
        return this.processing >= this.maxProcessing;
    }
}

export default Queue