// Fix: Use namespace augmentation for process.env to avoid "redeclare block-scoped variable" error.
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY?: string;
      [key: string]: string | undefined;
    }
  }
}
