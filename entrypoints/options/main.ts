import { createApp } from 'vue';
import '@/assets/main.css';
import '@/assets/fonts.css'
import './style.css'
import App from './App.vue';
import router from './router'

createApp(App)
    .use(router)
    .mount('#prismify');