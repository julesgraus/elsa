import RuleInterface from '@/app/RuleInterface';

export default interface ScriptItem {
  keyword: string;
  ranking: number;
  rules: RuleInterface[];
}
