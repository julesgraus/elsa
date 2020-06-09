export interface ScriptInterface {
  greetings: string[],
  transformations: {
    pre: {[key:string]: string}
    post: {[key:string]: string}
  },
  synonyms: string[][]
  repeated: string[];
  neutral: string[];
  empty: string[];
  script: {
    keyword: string,
    ranking: number,
    rules: {
      decompositionRule: string
      assemblyRules: {
        rule: string
      }[]
    }[]
  }[]
}
