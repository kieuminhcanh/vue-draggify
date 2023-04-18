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
        <VCard width="800" height="600" style="position: relative;">
          <Draggify v-bind="config" v-for="config in configs">
            <v-list-item prepend-avatar="https://cdn.vuetifyjs.com/images/john.png" title="John Leider"
              subtitle="john@google.com">
            </v-list-item>
          </Draggify>

        </VCard>
      </VContainer>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { VContainer, VSheet } from "vuetify/components";
import { ref } from "vue";
import Draggify from "../src/components/Draggify.vue";
import { reactive } from "vue";
import { VCard } from "vuetify/components";
import { DraggifyProps } from "../src/types";

const configs = ref<DraggifyProps[]>([
  {
    size: {
      width: 300,
      height: 56,
    },
    position: {
      x: 0,
      y: 0,
    },
    options: {
      grid: {
        stickToGrid: true,
        x: 100,
        y: 10,
      },
      resize: {
        direction: 'a',
        handle: 'click'
      }
    }
  },
  {
    size: {
      width: 300,
      height: 56,
    },
    position: {
      x: 350,
      y: 0,
    },
    options: {
      grid: {
        stickToGrid: false,
        x: 10,
        y: 10,
      },
      resize: {
        direction: 'x',
      },
      drag: {
        direction: 'y'
      }
    }
  },

])

</script>


