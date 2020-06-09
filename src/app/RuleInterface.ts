import { assemblyRule } from '@/app/AssemblyRule';

export default interface RuleInterface {
  decompositionRule: string;
  assemblyRules: assemblyRule[];
}
