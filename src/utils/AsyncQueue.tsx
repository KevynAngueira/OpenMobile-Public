export async function processWithConcurrency<T>(
    items: T[],
    handler: (item: T) => Promise<void>,
    concurrency: number = 3
  ) {
    const queue = [...items];
    const workers: Promise<void>[] = [];
  
    const runWorker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
  
        try {
          await handler(item);
        } catch (err) {
          console.error("Queue item failed:", err);
        }
      }
    };
  
    for (let i = 0; i < concurrency; i++) {
      workers.push(runWorker());
    }
  
    await Promise.all(workers);
  }