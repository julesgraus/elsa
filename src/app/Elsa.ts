import LanguageParser from '@/app/LanguageParser';
import Memory from '@/app/Memory';
import { ScriptInterface } from '@/app/ScriptInterface';

export default class Elsa {
  memory:Memory = new Memory();
  userHistory:string[] = []
  botHistory:string[] = []
  enableMemory:boolean = true;
  script: ScriptInterface|null = null;
  languageParser: LanguageParser;

  constructor() {
    this.languageParser = new LanguageParser();
    Elsa.randomInteger = Elsa.randomInteger.bind(this);
  }

  loadScript(locale: string = 'nl'): Promise<ScriptInterface>
  {
    let promise = fetch('eloquence/' + locale + '.json').then((response) => {
      return response.json().then((json: ScriptInterface) => {
        this.script = json;
        this.languageParser.setScript(this.script)
        return json
      });
    })

    promise.catch((error) => {
      console.error('Script fetch error: ', error)
    })

    return promise
  }

  respond(to: string): Promise<string> {
    this.userHistory.push(to);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const response = this.react(to);
        this.botHistory.push(response);
        resolve(response)
      }, Elsa.thinkTime(to))
    })
  }

  private static thinkTime(text: string) {
    // return 1; //debug line
    let time = Elsa.randomInteger(700, 1000);
    time += (text.length * 70)
    return time;
  }

  private react(to:string): string {
    if(!this.script) return 'I don\'t know how to respond yet. Give me a moment.';

    let response = '...'
    //Try to check if Elsa already responded to the given input;
    if(this.enableMemory && this.memory.recal(to)) {
      response = this.script.repeated[Elsa.randomInteger(0, this.script.repeated.length - 1)];
    }
    //React to an empty response
    else if(this.languageParser.isEmptyResponse(to)) {
      response = this.script.empty[Elsa.randomInteger(0, this.script.empty.length - 1)];
    } else {
      console.log('Response from parsing')
      response = this.languageParser.parse(to);
    }

    this.memory.remember(to, response);
    return response
  }

  startConversation(): string {
    if(!this.script) return 'I don\'t know how to respond yet. Give me a moment.';

    const response = this.script.greetings[Elsa.randomInteger(0, this.script.greetings.length - 1)];
    this.botHistory.push(response);
    return response;
  }

  public static randomInteger(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static shuffleArray<T>(array:T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
