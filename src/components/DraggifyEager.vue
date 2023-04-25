<script setup lang="ts">

import { CSSProperties, PropType, computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { DraggifyDirection, DraggifyGridOptions, DraggifyState, DraggifyInput } from '../types';
import deepMerge from 'deepmerge';
import { defaultOptions } from "../utils/options";
import { useCurrentElement, useElementHover, useParentElement, useEventListener, clamp } from '@vueuse/core'


const props = defineProps({
  modelValue: {
    type: Object as PropType<{
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      [key: string]: any;
    }>,
    default: () => ({}),
  },
  returnObject: {
    type: Boolean,
    default: false,
  },
  fixed: {
    type: Boolean,
    default: false,
  },
  draggable: {
    type: Boolean,
    default: true,
  },
  resizeable: {
    type: Boolean,
    default: true,
  },
  color: {
    type: String,
    default: 'white',
  },
  style: {
    type: Object as PropType<CSSProperties>,
    default: () => ({
      backgroundColor: '#ffffff',
      border: '1px solid #dddddd',
      borderRadius: '5px',
      boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)',
    } as CSSProperties),
  },
  stickToGrid: {
    type: Boolean,
    default: true,
  },
  grid: {
    type: Object as PropType<DraggifyGridOptions>,
    required: false,
    default: () => ({
      x: 10,
      y: 10,
    }),
  },
  options: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  onChangeData: {
    type: Function as PropType<(data: DraggifyState) => void>,
    required: false,
  },
});

const emit = defineEmits<{
  (e: 'onDragStart', event: DragEvent, data: any): void
  (e: 'onDragMove', event: DragEvent, data: any): void
  (e: 'onDragEnter', event: DragEvent, data: any): void
  (e: 'onDragOver', event: DragEvent, data: any): void
  (e: 'onDragLeave', event: DragEvent, data: any): void
  (e: 'onDrop', event: DragEvent, data: any): any
  (e: 'onDragEnd', event: DragEvent, data: any): void
  (e: 'onResizeStart', event: MouseEvent, data: any): void
  (e: 'onResizeMove', event: MouseEvent, data: any, direction: DraggifyDirection): void
  (e: 'onResizeEnd', event: MouseEvent, data: any): void
  (e: 'update:modelValue', value: any): void
  (e: 'update:draggable', value: boolean): void
  (e: 'update:resizeable', value: boolean): void
}>()

const draggable = ref<boolean>(props.draggable)
const resizeable = ref<boolean>(props.resizeable)

const rootElement = useCurrentElement<HTMLElement>();

const state = !props.returnObject ? ref<DraggifyInput>(props.modelValue)
  : computed<DraggifyInput>({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

if (!props.returnObject) {
  watch(() => props.modelValue, (value) => {
    console.log('modelValue just updated', value);

    state.value = { ...value }
  }, { deep: true })
}



onMounted(() => {

  // if (!props.modelValue) {
  state.value = {
    ...{
      width: rootElement.value?.clientWidth,
      height: rootElement.value?.clientHeight,
      x: rootElement.value?.style.left ? parseInt(rootElement.value?.style.left) : rootElement.value?.offsetLeft,
      y: rootElement.value?.style.top ? parseInt(rootElement.value?.style.top) : rootElement.value?.offsetTop,
    }, ...props.modelValue
  }
  // }

})

onUnmounted(() => state.value = {})

const submitEmits = (eventName: any, e: DragEvent | MouseEvent, data: any) => {
  state.value = { ...data }
  emit(eventName, e, data)
}
/**
 * Options
 */
const options = computed(() => deepMerge(defaultOptions, props.options))

/**
 * Get container size
 */
const container = computed(() => {
  if (!options.value.container) {
    const containerRef = useParentElement(rootElement);
    return {
      width: containerRef.value?.clientWidth as number,
      height: containerRef.value?.clientHeight as number,
    }
  }
  return options.value.container
});

/**
 * Container resize direction class
 */
const containerResizeDirectionClass = computed(() => {
  return isHovered.value && resizeable.value && options.value.resize.direction ? `draggify-resizer-direction-${options.value.resize.direction}` : undefined
})

/**
 * Item styles
 */
// const { state: state, style: itemStyles } = reactiveStyle({
//   userSelect: 'none',
//   position: props.fixed ? 'fixed' : 'absolute',
//   width: modelValue.value.width ?? rootBounding.value.width,
//   height: modelValue.value.height ?? rootBounding.value.height,
//   left: modelValue.value.x ?? rootBounding.value.left,
//   top: modelValue.value.y ?? rootBounding.value.top,
//   backgroundColor: props.color,
// })

const itemStyles = computed<CSSProperties>(() => {

  return {
    userSelect: 'none',
    position: props.fixed ? 'fixed' : 'absolute',
    backgroundColor: props.color,
    width: `${state.value.width}px`,
    height: `${state.value.height}px`,
    left: `${state.value.x}px`,
    top: `${state.value.y}px`,
  }
});

/**
 * Hover state
 */
const isHovered = useElementHover(rootElement)

/**
 * Drag start event handler
 * @param e 
 */
const onDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.clearData();
  }

  resizeable.value = false

  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', rootElement.value.innerHTML);
    e.dataTransfer.effectAllowed = "move";
    rootElement.value.classList.add('dragging');
  }

  const axisStart = {
    x: e.clientX,
    y: e.clientY
  }

  const temp = {
    x: state.value.x as number,
    y: state.value.y as number,
    width: state.value.width as number,
    height: state.value.height as number,
  }

  let data = { ...temp }

  // emit('onDragStart', e, data)

  const removeDragEnter = useEventListener(document, 'dragenter', (e) => {
    // emit('onDragEnter', e, data)
  });

  /**
   * Might be useful when we want to move the element horizontally or vertically
   * Turn off default for better performance
   * @param e 
   */
  const removeDragMove = useEventListener(document, 'drag', (e) => {
    // e.preventDefault();
    // const axisMove = {
    //   x: e.clientX - axisStart.x,
    //   y: e.clientY - axisStart.y
    // }
    // let axisNew = {
    //   x: temp.x + axisMove.x,
    //   y: temp.y + axisMove.y
    // }
    // if (itemRef.value?.style) {
    //   itemRef.value.style.opacity = "0.8";
    //   modelValue.value.x = axisNew.x;
    //   modelValue.value.y = axisNew.y;
    // }

    // emit('onDragMove', e, data)
  });

  const removeDragLeave = useEventListener(document, 'dragleave', (e) => {
    // emit('onDragLeave', e, data)
  })


  const removeDragOver = useEventListener(document, 'dragover', (e) => {
    // Need to prevent default to allow drop
    e.preventDefault();
    // emit('onDragOver', e, data)
  })

  const removeDrop = useEventListener(document, 'drop', (e) => {
    rootElement.value.classList.remove('dragging');

    const axisEnd = {
      x: e.clientX - axisStart.x,
      y: e.clientY - axisStart.y
    }

    let axisNew = {
      x: temp.x + axisEnd.x,
      y: temp.y + axisEnd.y
    }

    if (options.value.grid.stickToGrid) {
      axisNew.x = Math.round(axisNew.x / options.value.grid.x) * options.value.grid.x;
      axisNew.y = Math.round(axisNew.y / options.value.grid.y) * options.value.grid.y;
    }

    data = {
      x: clamp(axisNew.x, 0, container.value.width - temp.width),
      y: clamp(axisNew.y, 0, container.value.height - temp.height),
      width: temp.width,
      height: temp.height
    }

    submitEmits('onDrop', e, data)


  })


  const removeDragEnd = useEventListener(document, 'dragend', (e) => {

    resizeable.value = true

    submitEmits('onDragEnd', e, data)

    removeDragMove()
    removeDragEnter()
    removeDragOver()
    removeDragLeave()
    removeDrop()
    removeDragEnd()

  });
};


/**
 * Resize start event handler
 * @param e 
 * @param direction 
 */
const onResizeStart = (e: MouseEvent, direction: "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-left" | "bottom-right") => {
  draggable.value = false
  const resizer = e.target as HTMLDivElement
  resizer.style.cursor = 'col-resize'
  document.body.style.cursor = 'col-resize'



  const axisStart = {
    x: e.clientX,
    y: e.clientY
  }

  const temp = {
    x: state.value.x as number,
    y: state.value.y as number,
    width: state.value.width as number,
    height: state.value.height as number,
  }

  let data = { ...temp }
  emit('onResizeStart', e, data)


  const removeResizeMove = useEventListener(document, 'mousemove', (e) => {
    const moveAxis = {
      x: e.clientX - axisStart.x,
      y: e.clientY - axisStart.y
    }

    const axisNew = {
      x: temp.x + moveAxis.x,
      y: temp.y + moveAxis.y,
      width: temp.width + moveAxis.x,
      height: temp.height + moveAxis.y
    }




    switch (direction) {
      case "top":
        data.x = temp.x
        data.y = clamp(axisNew.y, 0, temp.y + temp.height - options.value.resize.minHeight)
        data.width = temp.width
        data.height = temp.height - (data.y - temp.y)
        break;
      case "right":
        data.x = temp.x
        data.y = temp.y
        data.width = clamp(axisNew.width, options.value.resize.minWidth, container.value.width - temp.x)
        data.height = temp.height
        break;
      case "bottom":
        data.x = temp.x
        data.y = temp.y
        data.width = temp.width
        data.height = clamp(axisNew.height, options.value.resize.minHeight, container.value.height - temp.y)
        break;
      case "left":
        data.x = clamp(axisNew.x, 0, temp.x + temp.width - options.value.resize.minWidth)
        data.y = temp.y
        data.width = temp.width - (data.x - temp.x)
        data.height = temp.height
        break;
      case "top-left":
        data.x = clamp(axisNew.x, 0, temp.x + temp.width - options.value.resize.minWidth)
        data.y = clamp(axisNew.y, 0, temp.y + temp.height - options.value.resize.minHeight)
        data.width = temp.width - (data.x - temp.x)
        data.height = temp.height - (data.y - temp.y)
        break;
      case "top-right":
        data.x = temp.x
        data.y = clamp(axisNew.y, 0, temp.y + temp.height - options.value.resize.minHeight)
        data.width = clamp(axisNew.width, options.value.resize.minWidth, container.value.width - temp.x)
        data.height = temp.height - (data.y - temp.y)
        break;
      case "bottom-left":
        data.x = clamp(axisNew.x, 0, temp.x + temp.width - options.value.resize.minWidth)
        data.y = temp.y
        data.width = temp.width - (data.x - temp.x)
        data.height = clamp(axisNew.height, options.value.resize.minHeight, container.value.height - temp.y)
        break;
      case "bottom-right":
        data.x = temp.x
        data.y = temp.y
        data.width = clamp(axisNew.width, options.value.resize.minWidth, container.value.width - temp.x)
        data.height = clamp(axisNew.height, options.value.resize.minHeight, container.value.height - temp.y)
        break;
      default:
        break;

    }

    submitEmits('onResizeMove', e, data)
  });



  const removeResizeEnd = useEventListener(document, 'mouseup', (e) => {
    resizer.style.removeProperty('cursor')
    document.body.style.removeProperty('cursor')
    submitEmits('onResizeEnd', e, data)
    draggable.value = true

    removeResizeMove()
    removeResizeEnd()
  });
}

const bindState = computed(() => {
  return {
    ...state.value,
    ...{
      top: state.value.y,
      left: state.value.x,
      right: state.value.x as number + (state.value.width as number),
      bottom: state.value.y as number + (state.value.height as number),
    }
  }
})
</script>

<template>
  <div :style="[itemStyles, style]" class="draggify-item" :class="containerResizeDirectionClass" :draggable="draggable"
    @dragstart.stop="onDragStart">
    <div class="draggify-content">
      <slot v-bind="bindState"></slot>
    </div>
    <div class="draggify-resizer draggify-resizer-top-left" @mousedown.stop="onResizeStart($event, 'top-left')"></div>
    <div class="draggify-resizer draggify-resizer-top" @mousedown.stop="onResizeStart($event, 'top')"></div>
    <div class="draggify-resizer draggify-resizer-right" @mousedown.stop="onResizeStart($event, 'right')"></div>
    <div class="draggify-resizer draggify-resizer-bottom" @mousedown.stop="onResizeStart($event, 'bottom')"></div>
    <div class="draggify-resizer draggify-resizer-left" @mousedown.stop="onResizeStart($event, 'left')"></div>
    <div class="draggify-resizer draggify-resizer-top-right" @mousedown.stop="onResizeStart($event, 'top-right')"></div>
    <div class="draggify-resizer draggify-resizer-bottom-left" @mousedown.stop="onResizeStart($event, 'bottom-left')">
    </div>
    <div class="draggify-resizer draggify-resizer-bottom-right" @mousedown.stop="onResizeStart($event, 'bottom-right')">
    </div>
  </div>
</template>

<style lang="scss">
.draggify-item {
  opacity: 1;

  &.dragging {
    opacity: 0.4;
  }

  .draggify-content {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  .draggify-resizer {
    position: absolute;
    visibility: hidden;

    &.draggify-resizer-top {
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 5px;
      cursor: n-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
    }

    &.draggify-resizer-right {
      top: 0;
      right: 0;
      bottom: 0;
      height: 100%;
      width: 5px;
      cursor: e-resize;
      background-color: red;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    &.draggify-resizer-bottom {
      left: 0;
      bottom: -3px;
      right: 0;
      width: 100%;
      height: 5px;
      cursor: n-resize;
      background-color: red;
      border-bottom-right-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &.draggify-resizer-left {
      top: 0;
      left: 0;
      bottom: 0;
      height: 100%;
      width: 5px;
      cursor: e-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &.draggify-resizer-top-left {
      top: 0;
      left: 0;
      height: 10px;
      width: 10px;
      cursor: nw-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &.draggify-resizer-top-right {
      top: 0;
      right: 0;
      height: 10px;
      width: 10px;
      cursor: ne-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &.draggify-resizer-bottom-left {
      bottom: 0;
      left: 0;
      height: 10px;
      width: 10px;
      cursor: ne-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &.draggify-resizer-bottom-right {
      bottom: 0;
      right: 0;
      height: 10px;
      width: 10px;
      cursor: nw-resize;
      background-color: red;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

  }

  &.draggify-resizer-direction-all {
    .draggify-resizer {
      &.draggify-resizer-top {
        visibility: visible !important;
        ;
      }

      &.draggify-resizer-right {
        visibility: visible;
      }

      &.draggify-resizer-bottom {
        visibility: visible;
      }

      &.draggify-resizer-left {
        visibility: visible;
      }

      &.draggify-resizer-top-left {
        visibility: visible;
      }

      &.draggify-resizer-top-right {
        visibility: visible;
      }

      &.draggify-resizer-bottom-left {
        visibility: visible;
      }

      &.draggify-resizer-bottom-right {
        visibility: visible;
      }
    }
  }

  &.draggify-resizer-direction-x,
  &.draggify-resizer-direction-left {
    .draggify-resizer {
      &.draggify-resizer-left {
        visibility: visible;
      }
    }
  }

  &.draggify-resizer-direction-x,
  &.draggify-resizer-direction-right {
    .draggify-resizer {
      &.draggify-resizer-right {
        visibility: visible;
      }
    }
  }

  &.draggify-resizer-direction-y,
  &.draggify-resizer-direction-top {
    .draggify-resizer {
      &.draggify-resizer-top {
        visibility: visible;
      }
    }
  }

  &.draggify-resizer-direction-y,
  &.draggify-resizer-direction-bottom {
    .draggify-resizer {
      &.draggify-resizer-bottom {
        visibility: visible;
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

