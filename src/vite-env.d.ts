declare module 'gifshot' {
  const gifshot: any;
  export default gifshot;
}

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}