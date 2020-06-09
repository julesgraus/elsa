<template>
  <div>
    <textarea :value="this.outputDisplay" class="output__outputHistory" title="" ref="output" readonly/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component
export default class Output extends Vue {
  @Prop({ default: '' }) readonly input!: string

  output: string[] = [];
  outputDisplay = '';

  @Watch('input')
  onInputChanged(val: string, oldVal: string) {
    this.output.unshift(val)
    this.outputDisplay = val + this.outputDisplay

    const textArea = this.$refs.output;
    // @ts-ignore
    textArea.scrollTop = 0;
  }
}
</script>

<style lang="scss">
  .output__outputHistory {
    color: darkseagreen;
    background-color: black;
    padding: 0 2px 0 2px;
    overflow: hidden;
    outline: none;
    resize: none;
    border: none;
    width: calc(100% - 0.375rem);
    height: calc(100%);
    font-family: monospace;
    font-size: 0.7rem;
  }
</style>
