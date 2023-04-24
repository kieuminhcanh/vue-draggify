<script setup lang="ts">

import { CSSProperties, EmitsOptions, PropType, computed, reactive, ref, watch } from 'vue';
import { DraggifyDirection, DraggifyGridOptions, DraggifyOptions, DraggifySize, DraggifyState } from '../types';
import { DraggifyAxis } from "../types";
import deepMerge from 'deepmerge';
import { defaultOptions } from "../utils/options";
import { useCurrentElement, useElementHover, useParentElement, useEventListener } from '@vueuse/core'
import { clamp } from '@vueuse/core';

const props = defineProps({
  modelValue: {
    type: Object as PropType<{
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      [key: string]: any;
    }>,
    required: true,
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
  (e: 'onDragStart', event: DragEvent, data: DraggifyState): void
  (e: 'onDragMove', event: DragEvent, data: DraggifyState): void
  (e: 'onDragEnter', event: DragEvent, data: DraggifyState): void
  (e: 'onDragOver', event: DragEvent, data: DraggifyState): void
  (e: 'onDragLeave', event: DragEvent, data: DraggifyState): void
  (e: 'onDrop', event: DragEvent, data: DraggifyState): any
  (e: 'onDragEnd', event: DragEvent, data: DraggifyState): void
  (e: 'onResizeStart', event: MouseEvent, data: DraggifyState): void
  (e: 'onResizeMove', event: MouseEvent, data: DraggifyState, direction: DraggifyDirection): void
  (e: 'onResizeEnd', event: MouseEvent, data: DraggifyState): void
  (e: 'update:modelValue', value: any): void
  (e: 'update:draggable', value: boolean): void
  (e: 'update:resizeable', value: boolean): void
}>()

const draggable = ref(props.draggable)
const resizeable = ref(props.resizeable)

// const modelValue = computed({
//   get: () => reactive(props.modelValue),
//   set: (value: any) => emit('update:modelValue', value),
// });

const modelValue = ref(props.modelValue)

watch(() => props.modelValue, (value) => modelValue.value = { ...value }, { deep: true })

const rootElement = useCurrentElement<HTMLElement>();

const rootBounding = computed(() => {
  const width = Math.round(rootElement.value?.clientWidth || parseInt(rootElement.value?.style.width || '0'))
  const height = Math.round(rootElement.value?.clientHeight || parseInt(rootElement.value?.style.height || '0'))
  const x = Math.round(parseInt(rootElement.value?.style.left || '0'))
  const y = Math.round(parseInt(rootElement.value?.style.top || '0'))
  const top = Math.round(parseInt(rootElement.value?.style.top) || y)
  const left = Math.round(parseInt(rootElement.value?.style.left) || x)
  const right = Math.round(parseInt(rootElement.value?.style.left) || left + width)
  const bottom = Math.round(parseInt(rootElement.value?.style.bottom) || top + height)

  return { width, height, x, y, top, left, right, bottom, }
});

const submitEmits = (eventName: any, e: DragEvent | MouseEvent, data: any) => {
  if (props.onChangeData) {
    const result = props.onChangeData(data)
  }

  modelValue.value = { ...data }
  emit('update:modelValue', data)
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
const itemStyles = computed<CSSProperties>(() => {
  return {
    userSelect: 'none',
    position: props.fixed ? 'fixed' : 'absolute',
    width: modelValue.value.width !== undefined ? `${modelValue.value.width}px` : `${rootBounding.value.width}px`,
    height: modelValue.value.height !== undefined ? `${modelValue.value.height}px` : `${rootBounding.value.height}px`,
    backgroundColor: props.color,
    left: modelValue.value.x !== undefined ? `${modelValue.value.x}px` : `${rootBounding.value.left}px`,
    top: !!modelValue.value.y !== undefined ? `${modelValue.value.y}px` : `${rootBounding.value.top}px`,
  }
});

/**
 * Hover state
 */
const isHovered = useElementHover(rootElement)


/**
 * State
 */
const state = computed<DraggifyState>(() => ({
  width: modelValue.value.width !== undefined ? modelValue.value.width : rootBounding.value.width,
  height: modelValue.value.height !== undefined ? modelValue.value.height : rootBounding.value.height,
  x: modelValue.value.x !== undefined ? modelValue.value.x : rootBounding.value.left,
  y: modelValue.value.y !== undefined ? modelValue.value.y : rootBounding.value.top,
  top: modelValue.value.y as number,
  left: modelValue.value.x as number,
  right: (modelValue.value.x as number) + (modelValue.value.width as number),
  bottom: (modelValue.value.y as number) + (modelValue.value.height as number),
}))

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

  const temp = state.value

  emit('onDragStart', e, state.value)

  const removeDragEnter = useEventListener(document, 'dragenter', (e) => {
    emit('onDragEnter', e, state.value)
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

    emit('onDragMove', e, state.value)
  });

  const removeDragLeave = useEventListener(document, 'dragleave', (e) => {
    emit('onDragLeave', e, state.value)
  })

  const removeDragOver = useEventListener(document, 'dragover', (e) => {
    // Need to prevent default to allow drop
    e.preventDefault();
    emit('onDragOver', e, state.value)
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

    let data = {
      x: clamp(axisNew.x, 0, container.value.width - rootBounding.value.width),
      y: clamp(axisNew.y, 0, container.value.height - rootBounding.value.height),
      width: temp.width,
      height: temp.height
    }

    submitEmits('onDrop', e, data)


  })


  const removeDragEnd = useEventListener(document, 'dragend', (e) => {

    resizeable.value = true

    let temp = state.value



    updateAxisItem(temp)
    emit('onDragEnd', e, temp)
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

  const temp = state.value
  emit('onResizeStart', e, state.value)


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


    let data = { x: 0, y: 0, width: 0, height: 0 }

    switch (direction) {
      case "top":
        data.x = temp.x
        data.y = clamp(axisNew.y, 0, temp.y + temp.height - options.value.resize.minHeight)
        data.width = temp.width
        data.height = temp.height - (data.y - temp.y)
        break;
      case "right":
        data.x = temp.y
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
    emit('onResizeEnd', e, state.value)
    draggable.value = true

    removeResizeMove()
    removeResizeEnd()
  });
}

const updateAxisItem = (axis: DraggifyAxis, direction: DraggifyDirection = "all") => {
  switch (direction) {
    case 'all':
      emit('update:modelValue', {
        ...modelValue.value,
        ...axis
      })
      break;
    case 'top':
      emit('update:modelValue', {
        ...modelValue.value,
        y: axis.y
      })
      break;
    case 'left':
      emit('update:modelValue', {
        ...modelValue.value,
        x: axis.x
      })
      break;
  }
}

const updateSizeItem = (size: DraggifySize, direction: DraggifyDirection) => {

  switch (direction) {
    case "top":
      emit('update:modelValue', {
        ...modelValue.value,
        height: size?.nHeight || modelValue.value.height,
      })
      break;
    case "right":
      emit('update:modelValue', {
        ...modelValue.value,
        width: size?.width || modelValue.value.width
      })

      break;
    case "bottom":
      emit('update:modelValue', {
        ...modelValue.value,
        height: size?.height || modelValue.value.height
      })
      break;
    case "left":
      emit('update:modelValue', {
        ...modelValue.value,
        width: size?.nWidth || modelValue.value.width
      })
      break;
  }
}
</script>

<template>
  <div :style="[itemStyles, style]" class="draggify-item" :class="containerResizeDirectionClass" :draggable="draggable"
    @dragstart.stop="onDragStart">
    <div class="draggify-content">
      <slot v-bind="state"></slot>
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

