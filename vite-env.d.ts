// Reference to vite/client removed due to missing type definition error

declare const process: {
  env: {
    [key: string]: string | undefined;
    API_KEY?: string;
  }
};
