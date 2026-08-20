import { DirectMessage } from '../../types';
import { sendMessageDoc } from '../firebase/messaging';

interface QueuedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: Partial<DirectMessage>;
  timestamp: number;
  retryCount: number;
}

class MessageQueueService {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private storageKey = 'nearby_offline_message_queue';

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
    }
  }

  private loadQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          this.queue = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn("Failed to load message queue from storage:", e);
    }
  }

  private saveQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
      }
    } catch (e) {
      console.warn("Failed to save message queue to storage:", e);
    }
  }

  public enqueue(senderId: string, receiverId: string, message: Partial<DirectMessage>): QueuedMessage {
    const item: QueuedMessage = {
      id: message.id || `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      message,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(item);
    this.saveQueue();

    if (navigator.onLine) {
      this.processQueue();
    }

    return item;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) return;
    this.isProcessing = true;

    const remaining: QueuedMessage[] = [];

    for (const item of this.queue) {
      try {
        await sendMessageDoc(item.senderId, item.receiverId, item.message);
      } catch (err) {
        console.warn(`Failed to process queued message ${item.id}:`, err);
        item.retryCount += 1;
        if (item.retryCount < 5) {
          remaining.push(item);
        }
      }
    }

    this.queue = remaining;
    this.saveQueue();
    this.isProcessing = false;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

export const messageQueue = new MessageQueueService();
