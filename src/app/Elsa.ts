import LanguageParser from '@/app/LanguageParser';
import Memory from '@/app/Memory';
import { ScriptInterface } from '@/app/ScriptInterface';

export default class Elsa {
  private memory:Memory = new Memory();
  private userHistory:string[] = []
  private botHistory:string[] = []
  private enableMemory:boolean = true;
  private script: ScriptInterface|null = null;
  private languageParser: LanguageParser;
  private speechUtterance: SpeechSynthesisUtterance|null = null;

  constructor() {
    this.languageParser = new LanguageParser();
    Elsa.randomInteger = Elsa.randomInteger.bind(this);
    this.setupSpeech();
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
        this.speak(response);
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

    let response = 'Ok'
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
    this.speak(response);
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

  canSpeak() {
    return ('speechSynthesis' in window);
  }

  private setupSpeech() {
    return new Promise((resolve, reject) => {
      if (!this.canSpeak()) resolve();

      let voice: SpeechSynthesisVoice | null = null;
      this.getVoices().then((voices: SpeechSynthesisVoice[]) => {
        for (let voiceNumber in voices) {
          let currentVoice = window.speechSynthesis.getVoices()[voiceNumber];
          if (currentVoice.lang !== 'nl-NL') continue;

          voice = currentVoice;
          break;
        }

        if (!voice) {
          console.log('No voice found. Elsa will not speak')
          resolve();
          return;
        }

        console.log('speech setup')
        this.speechUtterance = new SpeechSynthesisUtterance();
        this.speechUtterance.voice = voice;
        this.speechUtterance.volume = 1; // 0 to 1
        this.speechUtterance.rate = 0.75; // 0.1 to 10
        this.speechUtterance.pitch = 0.95; //0 to 2
        this.speechUtterance.lang = 'nl-NL';
        resolve();
      })
    });
  }

  getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise(resolve => {
      let voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices()
      if (voices.length) {
        resolve(voices)
        return
      }
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices()
        resolve(voices)
      }
    })
  }


  speak(text: string) {
    if(!this.canSpeak() || !this.speechUtterance) {
      console.log('Elsa cannot speak');
      return;
    }
    this.speechUtterance.text = text;
    console.log('Speaking: '+text)
    speechSynthesis.speak(this.speechUtterance);
  }

  whenReady(locale: string = 'nl') {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.loadScript(locale),
        this.setupSpeech()
      ]).then(() => { resolve(this) })
        .catch(reason => { reject(reason) })
    })
  }
}
