<template>
  <div class="draggify-item" ref="itemRef" :class="{ 'draggify-item-style': !_options?.style?.disabled }"
    :style="containerStyles" v-on="containerEvents">
    <div class="draggify-content">
      <div class="draggify-resizer draggify-resizer-top" v-show="checkResizeable('t')" :style="resizerStyles"
        @mousedown.stop="$event => onMouseDownResizer($event, 'top')"></div>
      <div class="draggify-resizer draggify-resizer-right" v-show="checkResizeable('r')" :style="resizerStyles"
        @mousedown.stop="$event => onMouseDownResizer($event, 'right')"></div>
      <div class="draggify-text">
        <slot></slot>
      </div>
      <div class="draggify-resizer draggify-resizer-bottom" v-show="checkResizeable('b')" :style="resizerStyles"
        @mousedown.stop="$event => onMouseDownResizer($event, 'bottom')">
      </div>
      <div class="draggify-resizer draggify-resizer-left" v-show="checkResizeable('l')" :style="resizerStyles"
        @mousedown.stop="$event => onMouseDownResizer($event, 'left')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CSSProperties, PropType, computed, reactive, ref } from 'vue';
import { DraggifyDirection, DraggifyGridOptions, DraggifyInput, DraggifyOptions, DraggifyPosition, DraggifySize } from '../types';
import { DraggifyState } from '../types';
import deepMerge from 'deepmerge';
import { defaultOptions } from "../utils/options";
import { useElementHover } from '@vueuse/core'



const props = defineProps({
  modelValue: {
    type: Object as PropType<DraggifyInput>,
    required: true,
  },
  options: {
    type: Object as PropType<DraggifyOptions>,
    default: () => ({}),
  },
  onDragMove: {
    type: Function as PropType<(size: DraggifySize) => void>,
  },
  onDragEnd: {
    type: Function as PropType<(size: DraggifySize) => void>,
  },
  onResizeMove: {
    type: Function as PropType<(size: DraggifySize) => void>,
  },
  onResizeEnd: {
    type: Function as PropType<(size: DraggifySize) => void>,
  },
});


const itemRef = ref<HTMLElement>();

const isHovered = useElementHover(itemRef)


const _options = computed<DraggifyOptions>(() => deepMerge(defaultOptions, props.options))

const containerEvents = reactive({
  mousedown: (e: MouseEvent) => { onMouseDownContainer(e) },
});

const checkResizeable = (direction: DraggifyDirection) => {

  if (_options.value?.resize?.disabled)
    return false

  if (!isHovered.value) return false

  if (_options.value?.resize?.direction === 'a') return true

  switch (direction) {
    case 't': return ['t', 'y'].includes(_options.value?.resize?.direction as string)
    case 'r': return ['r', 'x'].includes(_options.value?.resize?.direction as string)
    case 'b': return ['b', 'y'].includes(_options.value?.resize?.direction as string)
    case 'l': return ['l', 'x'].includes(_options.value?.resize?.direction as string)
    default: return false
  }
};

const emit = defineEmits(['update:modelValue'])

const state = reactive<DraggifyState>({
  width: props.modelValue.width,
  height: props.modelValue.height - (_options.value?.style?.marginY as number * 2),
  x: props.modelValue.x,
  y: props.modelValue.y,
  isDragging: false,
  isResizing: false,
});

const position = computed<DraggifyPosition>(() => ({
  top: state.y as number,
  right: state.x as number + state.width as number,
  bottom: state.y as number + state.height as number,
  left: state.x as number,
}))

const containerStyles = computed<CSSProperties>(() => ({
  width: `${state.width}px`,
  height: `${state.height}px`,
  left: `${state.x}px`,
  top: `${state.y}px`,
  'user-select': state.isDragging ? 'none' : 'text',
  'margin': `${_options.value?.style?.marginY}px 0`,
}));

const resizerStyles = computed(() => ({
  'background-color': _options.value?.resize?.color
}));

/**
 * Resizeable event handlers
 * @param e 
 * @param direction 
 */
const onMouseDownResizer = (e: MouseEvent, direction: "top" | "right" | "bottom" | "left") => {
  let element: HTMLElement = e.target as HTMLElement;

  const container: DraggifySize = _options.value?.container ? _options.value?.container : {
    width: itemRef.value?.parentElement?.offsetWidth as number,
    height: itemRef.value?.parentElement?.offsetHeight as number
  }

  const axis = {
    x: e.clientX,
    y: e.clientY
  }

  const stateTemp = deepMerge(state, position.value) as DraggifyState;

  if (direction === 'top' || direction === 'bottom') {
    element.style.cursor = 'row-resize';
    document.body.style.cursor = 'row-resize';
  } else {
    element.style.cursor = 'col-resize';
    document.body.style.cursor = 'col-resize';
  }

  const onResizeMove = (e: MouseEvent) => {
    const moveAxis = {
      x: e.clientX - axis.x,
      y: e.clientY - axis.y
    }

    const newAxis = {
      x: stateTemp.x as number + moveAxis.x,
      y: stateTemp.y as number + moveAxis.y,
    }
    const newSize = {
      width: stateTemp.width as number + moveAxis.x,
      height: stateTemp.height as number + moveAxis.y,
    }

    if (_options.value?.grid?.stickToGrid) {
      newAxis.x = Math.round((newAxis.x) / (_options.value?.grid?.x as number)) * (_options.value?.grid?.x as number);
      newAxis.y = Math.round((newAxis.y) / (_options.value?.grid?.y as number)) * (_options.value?.grid?.y as number);
      moveAxis.x = Math.round((moveAxis.x) / (_options.value?.grid?.x as number)) * (_options.value?.grid?.x as number);
      moveAxis.y = Math.round((moveAxis.y) / (_options.value?.grid?.y as number)) * (_options.value?.grid?.y as number);
      newSize.width = Math.round((newSize.width) / (_options.value?.grid?.x as number)) * (_options.value?.grid?.x as number);
      newSize.height = Math.round((newSize.height) / (_options.value?.grid?.y as number)) * (_options.value?.grid?.y as number);

      // Limit execution to every 10px
      if (Math.abs(moveAxis.x) % Math.round((_options.value?.grid?.x / 2)) > 2) {
        return
      }
      // Good for both but only oneway
      // if (Math.abs(moveAxis.x) < (50 + Math.abs(((state.x as number) - (stateTemp.x as number))))) return
      if (newAxis.x < 10) {
        newAxis.x = 0
        moveAxis.x = -(stateTemp.x as number)
      } else if (newAxis.x > container.width - stateTemp.width) {
        newAxis.x = container.width - state.width
        newSize.width = container.width - (stateTemp.x as number)
      }

      if (newAxis.y < 10) {
        newAxis.y = 0
        moveAxis.y = -(stateTemp.y as number)
      } else if (newAxis.y > container.height - 10) {
        newAxis.y = container.height - state.height
        newSize.height = container.height - (stateTemp.y as number)
      }
    }


    switch (direction) {
      case "top":
        if (!_options.value?.drag?.disabled)
          state.y = newAxis.y;
        state.height = stateTemp.height as number + -moveAxis.y;
        break;
      case "right":
        state.width = newSize.width
        break;
      case "bottom":
        state.height = newSize.height
        break;
      case "left":
        if (!_options.value?.drag?.disabled)
          state.x = newAxis.x;
        state.width = stateTemp.width + -moveAxis.x;
        break;
    }
    props.onResizeMove?.({ ...state, ...position.value });

  };

  const onResizeEnd = (e: MouseEvent) => {

    console.log('disable resize');

    state.isResizing = false;
    itemRef.value?.style.removeProperty('cursor');
    document.body.style.removeProperty('cursor');
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);

    props.onResizeEnd?.(state);
  };

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
};

/**
 * Draggable event handlers
 * @param e 
 */
const onMouseDownContainer = (e: MouseEvent) => {
  const container: DraggifySize = _options.value?.container ? _options.value?.container : {
    width: itemRef.value?.parentElement?.offsetWidth as number,
    height: itemRef.value?.parentElement?.offsetHeight as number
  }

  const axis = {
    x: e.clientX,
    y: e.clientY
  }

  const stateTemp = deepMerge(state, position.value) as DraggifyState;

  state.isDragging = true;

  (itemRef.value?.style as CSSStyleDeclaration).cursor = 'move';

  const onDragging = (e: MouseEvent) => {
    const moveAxis = {
      x: e.clientX - axis.x,
      y: e.clientY - axis.y
    }

    // Return if no movement
    if (!moveAxis.x && !moveAxis.y) return

    let newAxis = {
      x: stateTemp.x as number + moveAxis.x,
      y: stateTemp.y as number + moveAxis.y
    }

    if (_options.value?.grid?.stickToGrid) {
      newAxis.x = Math.round((newAxis.x) / (_options.value?.grid?.x as number)) * (_options.value?.grid?.x as number);
      newAxis.y = Math.round((newAxis.y) / (_options.value?.grid?.y as number)) * (_options.value?.grid?.y as number);

      // Limit execution to every 10px
      // if (Math.abs(moveAxis.x) % Math.round((_options.value?.grid?.x / 2)) > 2) {
      //   return
      // }
      // Good for both but only oneway
      // if (Math.abs(moveAxis.x) < (50 + Math.abs(((state.x as number) - (stateTemp.x as number))))) return
      if (newAxis.x < 10) {
        newAxis.x = 0
      } else if (newAxis.x > container.width - state.width) {
        newAxis.x = container.width - state.width
      }

      if (newAxis.y < 10) {
        newAxis.y = 0
      } else if (newAxis.y > container.height - state.height) {
        newAxis.y = container.height - state.height
      }
    }

    if (['a', 'x'].includes(_options.value?.drag?.direction as string)) {
      state.x = newAxis.x;
    }
    if (['a', 'y'].includes(_options.value?.drag?.direction as string)) {
      state.y = newAxis.y;
    }
    props.onDragMove?.({ ...state, ...position.value });
  }

  const onDragEnd = (e: MouseEvent) => {

    itemRef.value?.style.removeProperty('cursor');
    state.isDragging = false;
    document.removeEventListener('mousemove', onDragging);
    document.removeEventListener('mouseup', onDragEnd);

    props.onDragEnd?.(state);
  };

  document.addEventListener('mousemove', onDragging);
  document.addEventListener('mouseup', onDragEnd);

};
</script>

<style lang="scss">
.draggify-item {
  position: absolute;
  cursor: move;
  user-select: none;



  .draggify-content {
    position: relative;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;

    .draggify-resizer {
      position: absolute;
      border-radius: 5px;

      &.draggify-resizer-top {
        top: -3px;
        left: 0;
        right: 0;
        width: 100%;
        height: 5px;
        cursor: n-resize;
      }

      &.draggify-resizer-right {
        top: 0;
        right: -3px;
        bottom: 0;
        height: 100%;
        width: 5px;
        cursor: e-resize;
      }

      &.draggify-resizer-bottom {
        left: 0;
        bottom: -3px;
        right: 0;
        width: 100%;
        height: 5px;
        cursor: n-resize;
      }

      &.draggify-resizer-left {
        top: 0;
        left: -3px;
        bottom: 0;
        height: 100%;
        width: 5px;
        cursor: e-resize;
      }

    }
  }

  &.draggify-item-style {
    background-color: #ffffff;
    border: 1px solid #dddddd;
    border-radius: 5px;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  }

  &.draggify-item-style:hover {
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
  }

  .draggify-text {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    user-select: none;
  }
}
</style>
