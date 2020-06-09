<template>
  <div id="app">
    <Output :input="this.response" class="output"/>
    <br>
    <UserInput class="input" @change="inputChanged"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import UserInput from "@/components/UserInput.vue";
import Elsa from "@/app/Elsa";
import Output from '@/components/Output.vue';
import moment from 'moment';

@Component({
  components: {
    Output,
    UserInput,
  }
})
export default class App extends Vue {
  elsa!: Elsa;
  response = '';

  inputChanged(text: string) {
    this.response = this.timestamp('Jij', text + '\n');

    this.elsa.respond(text).then((response: string) => {
      this.response = this.timestamp('Elsa', response + '\n');
    })
  }

  async mounted() {
    this.elsa = new Elsa();
    this.elsa.loadScript('nl').then((script) => {
      this.response = this.timestamp('Elsa', this.elsa.startConversation());
    })
  }

  timestamp(user:string, data:string) {
    const currentTimeDate = moment().format('YYYY-MM-DD HH:ss')
    return currentTimeDate + ' ' + user + ': ' + data;
  }
}
</script>

<style lang="scss">
html {
  background-color: black;
  color: darkseagreen;
  font-size: 16px;

  #app {
    text-align: center;

    .output {
      margin: 0 auto;
      width: 80vw;
      height: 80vh;
      border: 1px solid #ffffff;
    }

    .input {
      width: 80vw;
      height: 1rem;
      border: 1px solid #ffffff;
      background-color: black;
    }

    .submit {
      height: 1rem;
    }
  }
}
</style>
