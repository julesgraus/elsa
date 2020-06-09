import levenshteinDistance from '@/app/Levenshtein';

/**
 * Somewhat tries to emulate human memory
 *
 * can keep track of a certain amount of data
 * and forgets the oldest data if an item is remembered and the amount is exceeded.
 * It can also recall a given output value, if you give it an input value.
 */
export default class Memory {
  input:string[] = [];
  output:string[] = [];
  memoryLength:number = 1

  /**
   * Remembers and input and output value
   *
   * @param input
   * @param output
   */
  public remember(input: string, output: string) {
    this.input.push(input);
    this.output.push(output);
    this.forget();
  }

  /**
   * Forgets something from both input and output if they
   * contain more items then a certain amount
   */
  private forget() {
    if(this.input.length > this.memoryLength) {
      this.input.shift();
      this.output.shift();
    }
  }

  /**
   * Searches the input array for the given or similar value.
   * If found, it returns the corresponding output
   * @param input
   */
  public recal(input: string): string | null {
    let inputsLength = this.input.length;
    let foundRecollectionIndex = null;
    for(let index = 0; index < inputsLength; index++) {
      let currentRecollection = this.input[index];
      if(currentRecollection == '' && input == '') continue;
      const distance = levenshteinDistance(input, currentRecollection);
      // console.table({
      //   'input': input,
      //   'inputLength': input.length,
      //   'treshold': input.length * 0.2,
      //   'currentRecollection': currentRecollection,
      //   'distance': distance,
      // })
      if (distance < input.length * .2) foundRecollectionIndex = index; //We want the last one
    }

    if(foundRecollectionIndex === null) {
      console.log('nothing in memory')
      return null;
    }
    return this.output[foundRecollectionIndex];
  }
}
