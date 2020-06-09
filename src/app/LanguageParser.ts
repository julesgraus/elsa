/**
 * Tries to make sense of human written language
 */
import ScriptItem from '@/app/ScriptItem';
import Elsa from '@/app/Elsa';
import { assemblyRule } from '@/app/AssemblyRule';
import MutationInterface from '@/app/MutationInterface';
import { ScriptInterface } from '@/app/ScriptInterface';

export default class LanguageParser {
  private script: ScriptInterface|null = null;

  constructor() {
    this.processPost = this.processPost.bind(this);
    this.processPre = this.processPre.bind(this);
  }

  setScript(script: ScriptInterface) {
    this.script = script;
  }

  isEmptyResponse(to: string) {
    return (to.trim() === '')
  }

  /**
   * Parse human language, and try to respond.
   *
   * @param input
   */
  parse(input: string): string {
    input = input.toLowerCase();

    //https://web.stanford.edu/class/linguist238/p36-weizenabaum.pdf
    let scripts = this.searchForKeywords(input); //Search for keywords. And return scripts to handle the keywords

    let output = '...';
    if(scripts.length > 0) {
      console.log('parse: keywords found in scripts: ', scripts)
      let inputToParse = this.processPre(input);
      //If the first sentence contains a keyword, use that.
      //Else have a look at the next sentence. We only parse one sentence at a time.
      inputToParse.split(/[.,]/).map(line => line.trim()).forEach((line: string) => {
        let scriptsCount = scripts.length;
        for(let index = 0; index < scriptsCount; index++) {
          let currentScript = scripts[index];

          //Check if the keyword or synonyms for that keyword are found in the current line.
          const regex = this.insertSynonymRegexes(this.escapeRegExp(currentScript.keyword));
          const matches = line.match(new RegExp('(?=[\\w])' + regex + '(?!\\w)'));
          if(!matches || matches.length == 0) continue; //keyword not found. Goto next script or line.

          //The script's decomposition rule establishes a context (place, time, characteristics of user),
          //that will also help determine how a response should be assembled and given back.
          console.log('Keyword "' + currentScript.keyword + '" found in line: ' + line)
          const possibleOutput = this.transform(line, currentScript);
          if(possibleOutput) {
            output = possibleOutput;
            break;
          }
        }
      })
    } else {
      //If no keywords found, say something like: Does that have something todo with the fact that ... earlier subject
      //OR say something like neutral / content free: Tell me more, Why do you think, Interesting, Please go on
      if(this.script) output = this.script.neutral[Elsa.randomInteger(0, this.script.neutral.length - 1)]
    }

    return output;
  }

  /**
   * Transform the string into a response. If that is not possible, return null
   * @param input
   * @param script
   */
  private transform(input:string, script: ScriptItem): string|null {
    //Create an array of indexes we use to randomly select rules
    let indexes = [];
    for(let index = 0; index < script.rules.length; index++) indexes.push(index);
    indexes = Elsa.shuffleArray(indexes);

    input = this.removeEndMarks(input);

    //Get the first index. And use that to get the rules.
    let index = indexes.shift();
    while(index !== undefined) {
      //Choose random decomposition and assembly rules.
      let randomRules = script.rules[index]
      const decompositionRule = randomRules.decompositionRule;
      const assemblyRule = randomRules.assemblyRules[Elsa.randomInteger(0, randomRules.assemblyRules.length - 1)];
      console.log('Using this decomposition rule: ', decompositionRule);
      console.log('Using this assembly rule: ', assemblyRule)

      //Decompose the input into an array of parts.
      let decomposedInput = this.decompose(input, decompositionRule);
      if(!decomposedInput) {
        index = indexes.shift();
        continue;
      }
      console.log('Decomposed input: ', decomposedInput);

      //Do the post transformation in the decomposed input parts.
      decomposedInput = decomposedInput.map(this.processPost);

      //Re-assemble
      let reassembled = LanguageParser.reassemble(decomposedInput, assemblyRule);
      if(reassembled) {
        console.log('Reassembled: '+reassembled);
        return reassembled;
      }

      index = indexes.shift();
      console.log('next index' + index);
    }
    return null;
  }

  /**
   * Removes dots and question, exclamation marks at the end of the input.
   *
   * @param input
   */
  public removeEndMarks(input: string)
  {
    return input.replace(/[!?.]+$/, '');
  }

  /**
   * Returns the input, decomposed into an array.
   * But if that was not possible, it returns null
   *
   * @param input
   * @param decompositionRule string
   */
  private decompose(input:string, decompositionRule: string): string[]|null {
    //Transform the decomposition rule to a regex one
    let regexDecompositionRule = decompositionRule
      .trim()
      .split('\*')
      .map((part: string) => {
        if(part === '') return part;
        return '(' + this.insertSynonymRegexes(this.escapeRegExp(part.trim())) + ')'
      })
      .join('(.*)')
      .trim();

    let regex = new RegExp('^' + regexDecompositionRule + '$', 'i')
    console.log('Regexed decomposition rule: '+ '^' + regexDecompositionRule + '$')

    //Try to match the decomposition rule.
    let matches = input.match(regex);
    if(matches) {
      matches.shift(); //The first element is the input. We don't need that.
      matches = matches.map(match => match.trim());
    }

    //Return an array
    return  matches;
  }

  /**
   * @param input
   */
  private insertSynonymRegexes(input:string): string {
    if(!this.script) return input;

    let matches = input.match(/(?<=@)\w+/);
    if(!matches) return input;

    matches.forEach((match) => {
      if(!this.script) return;
      this.script.synonyms.forEach((set: string[]) => {
          if(set.indexOf(match) !== -1) {
            const setRegex = set.map((word) => this.escapeRegExp(word)).join('|');
            console.log('Replacing @'+match+' with the set from synonyms: '+setRegex);
            input = input.replace('@'+match, '(' + setRegex + ')');
          }
      })
    })

    return input;
  }

  /**
   * Re-assemble the decomposed input (an array of strings) according to a given input rule.
   * If it wasn't possible to (completely) assemble the input, return null.
   *
   * @param decomposedInput
   * @param assemblyRule
   */
  private static reassemble(decomposedInput: string[], assemblyRule: assemblyRule): string|null {
    //Reassemble
    let assembled = assemblyRule.rule;
    console.log('Parts to assemble: ', decomposedInput);
    console.log('String to assemble: ', assemblyRule);
    decomposedInput.forEach((part: string, index) => {
      console.log('Part to place at index ' + (index + 1) + ' ' + part)
      assembled = assembled.replace('(' +(index+1)+')', part.toLowerCase());
    })

    //If there still are patterns like (1), (2) to be found, we return null, because we could not completely reassemble.
    const replacementRegex = /(?<=\()\d+(?=\))/g; //Matches (1) and (2) in this string for example: "Ik denk (1) en dat betekent (2)"
    let matches = assembled.match(replacementRegex);
    if(matches && matches.length > 1) return null;

    return assembled;
  }

  /**
   * Replace words with other words
   * @param input
   */
  processPre(input: string): string {
    if(!this.script) return input;
    console.log('processPre on "' + input + '"')
    this.processFrom(this.script.transformations.pre, input)
    return input;
  }

  /**
   * Replace words with other words
   * @param input
   */
  processPost(input: string): string {
    if(!this.script) return input;

    console.log('processPost on "' + input + '"')
    const result = this.processFrom(this.script.transformations.post, input)
    console.log('processPost result: ' + result);
    return result;
  }

  /**
   * @param object
   * @param input
   */
  processFrom(object: {[key:string]: string}, input:string): string {
    //Collect replacements into an array of objects first.
    let mutations: MutationInterface[] = [];
    for (let keyword in object) {
      if(!object.hasOwnProperty(keyword)) continue;
      let regex = '(?<!\\w)' + this.escapeRegExp(this.escapeRegExp(keyword)) + '(?!\\w)'
      let matches = input.match(new RegExp(regex, 'i'));
      if(!matches || matches.length == 0) continue;
      mutations.push({
        word: keyword,
        index: <number>matches.index,
        replace_with: object[keyword]
      })
    }

    //Sort them on the index, descending. So that we can replace from the end of the string to the beginning.
    //We do this to keep the indexes intact
    mutations.sort((mutationInterfaceA, mutationInterfaceB) => {
      return mutationInterfaceB.index - mutationInterfaceA.index;
    })

    //Do the mutations
    let mutation;
    while(mutation = mutations.shift()) {
      console.log('mutation! ', mutation);
      let parts:string[] = [];
      parts.push(input.substring(0, mutation.index))
      parts.push(mutation.replace_with)
      parts.push(input.substring(mutation.index + mutation.word.length))
      input = parts.join('')
    }

    return input;
  }

  /**
   * Search for keywords in the input string, return an array of
   * ScriptItems, where the first item is the one with the highest
   * ranking, and the last one with the lowest ranking.
   *
   * @param input
   */
  private searchForKeywords(input: string): ScriptItem[] {
    if(!this.script) return [];
    return this.script.script.filter((scriptItem: ScriptItem) => {
      let regex = this.insertSynonymRegexes(this.escapeRegExp(scriptItem.keyword));
      regex = '(?=[\\w])' + regex + '(?!\\w)'
      console.log('Using this regex to search for keywords: ' + regex);
      const matches = input.match(new RegExp(regex));
      return matches && matches.length > 0;
    }).sort((scriptItemA: ScriptItem, scriptItemB: ScriptItem) => {
      return (scriptItemA.ranking > scriptItemB.ranking) ? -1 : ((scriptItemA.ranking < scriptItemB.ranking) ? 1 : 0);
    })
  }

  private static removeEndingPunctuation(input: string) {
    return input.replace(/[.?!,:]/i, '')
  }


  /**
   * Escape regex characters for a string so it can be safely used in regex functions
   *
   * @param string
   */
  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string (backreference)
  }
}
