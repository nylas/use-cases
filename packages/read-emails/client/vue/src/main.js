import { createApp } from 'vue';
import App from './App.vue';
import { Nylas } from '../../../../../../nylas-vue';

const app = createApp(App);

app.use(Nylas, {
  serverBaseUrl: 'http://localhost:9000',
});
app.mount('#app');

app.config.globalProperties.serverBaseUrl = 'http://localhost:9000';
