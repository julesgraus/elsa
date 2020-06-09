<template>
  <input class="input" title="" autofocus @keypress="keypressed" v-model="input" placeholder="Type je bericht hier en druk op enter"/>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class UserInput extends Vue {
  input = ''

  keypressed(event: KeyboardEvent) {
    if(event.key == 'Enter') {
      this.$emit('change', this.input);
      this.input = '';
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  .input {
    color: darkseagreen;
    font-size: 0.8rem;
    padding-left: 2px;
  }
</style>
