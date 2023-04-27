<template>
  <v-layout>
    <v-app-bar title="Vuetify Notifier">
      <v-btn icon="mdi-github" variant="text" href="https://github.com/kieuminhcanh/vuetify-notifier" target="_blank">
        <v-tooltip activator="parent" location="bottom">Github</v-tooltip></v-btn>
      <v-btn icon="mdi-code-tags" variant="text"
        href="https://github.com/kieuminhcanh/vuetify-notifier/blob/master/src/App.vue" target="_blank">
        <v-tooltip activator="parent" location="bottom">Source Code</v-tooltip></v-btn>


      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" href="https://github.com/kieuminhcanh/vuetify-notifier" target="_blank">
            <v-icon>
              mdi-github
            </v-icon>
          </v-btn>
        </template>
        <span>Github</span>
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" href="https://github.com/kieuminhcanh/vuetify-notifier/blob/master/src/App.vue"
            target="_blank">
            <v-icon>
              mdi-code-tags
            </v-icon>
          </v-btn>
        </template>
        <span>Source Code</span>
      </v-tooltip>

    </v-app-bar>
    <v-main>
      <VContainer>
        <VCard width="825" height="600" style="position: relative;">

          <Draggify :modelValue="config.modelValue" :options="config.options" v-for="config in configs" v-slot="{ x, y }">
            <VListItem prepend-avatar="https://cdn.vuetifyjs.com/images/john.png" title="John Leider">
              <VListItemSubtitle>{{ x }} - {{ y }}</VListItemSubtitle>
            </VListItem>
          </Draggify>
        </VCard>
      </VContainer>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { VContainer, VList, VSheet, VListItem, VListItemSubtitle } from "vuetify/components";
import { ref } from "vue";
// import Draggify from "../src/components/Draggify.vue";
import Draggify from "../src/components/DraggifyMove.vue";
import { reactive } from "vue";
import { VCard } from "vuetify/components";
import { DraggifyProps } from "../src/types";

const configs = reactive([
  {
    modelValue: {
      width: 250,
      height: 56,
      x: 300,
      y: 300,
    },
    options: {
      grid: {
        stickToGrid: true,
        x: 100,
        y: 50,
      },
      resize: {
        direction: 'all',
        handle: 'click'
      }
    }
  },
  {
    modelValue: {
      width: 250,
      height: 56,
      x: 150,
      y: 100,
    },
    options: {
      grid: {
        stickToGrid: true,
        x: 100,
        y: 50,
      },
      resize: {
        direction: 'y',
        handle: 'click'
      }
    }
  },
])

const onDrop = (e: DragEvent, data) => {
  console.log(data);
  data.y = 0
  return data
}
</script>


