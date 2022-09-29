import Vue from 'vue';
import App from './App';
import vueCompositionApi from '@vue/composition-api';

Vue.use(vueCompositionApi);

new Vue({
  components: {
    App,
  },
  render: (h) => h(App),
}).$mount('#app');
