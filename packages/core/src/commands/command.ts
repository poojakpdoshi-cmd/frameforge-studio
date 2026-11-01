/**
 * FrameForge Studio: Invertible Command Bus & Transaction Architecture
 */

export interface ICommand<TContext = unknown> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  execute(context: TContext): Promise<void> | void;
  undo(context: TContext): Promise<void> | void;
  serialize(): Record<string, unknown>;
}

export class UndoManager<TContext> {
  private undoStack: ICommand<TContext>[] = [];
  private redoStack: ICommand<TContext>[] = [];
  private maxHistory: number;
  private context: TContext;
  private listeners: Set<() => void> = new Set();

  constructor(context: TContext, maxHistory: number = 200) {
    this.context = context;
    this.maxHistory = maxHistory;
  }

  setContext(context: TContext) {
    this.context = context;
  }

  async executeCommand(command: ICommand<TContext>): Promise<void> {
    await command.execute(this.context);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  async undo(): Promise<boolean> {
    const command = this.undoStack.pop();
    if (!command) return false;

    await command.undo(this.context);
    this.redoStack.push(command);
    this.notify();
    return true;
  }

  async redo(): Promise<boolean> {
    const command = this.redoStack.pop();
    if (!command) return false;

    await command.execute(this.context);
    this.undoStack.push(command);
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  getHistory(): { undo: string[]; redo: string[] } {
    return {
      undo: this.undoStack.map((c) => c.name),
      redo: this.redoStack.map((c) => c.name),
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

