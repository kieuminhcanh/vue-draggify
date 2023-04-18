import { App } from 'vue';

import VueDraggify from "./components/Draggify.vue";

export default {
  install: (app: App, options?: any) => {
    app.component('VueDraggify', VueDraggify);
  },
};



