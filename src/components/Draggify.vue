<template>
  <div ref="itemRef" :style="[itemStyles, style]" class="draggify-item" :class="containerResizeDirectionClass"
    :draggable="draggable" @dragstart="onDragStart">
    <div class="draggify-resizer draggify-resizer-top" @mousedown="onResizeStart($event, 'top')"></div>
    <div class="draggify-resizer draggify-resizer-right" @mousedown="onResizeStart($event, 'right')"></div>
    <div class="draggify-content">
      <slot></slot>
    </div>
    <div class="draggify-resizer draggify-resizer-bottom" @mousedown="onResizeStart($event, 'bottom')"></div>
    <div class="draggify-resizer draggify-resizer-left" @mousedown="onResizeStart($event, 'left')"></div>
  </div>
</template>

<script setup lang="ts">

import { CSSProperties, PropType, Ref, computed, reactive, ref, watch } from 'vue';
import { DraggifyDirection, DraggifyGridOptions, DraggifyInput, DraggifyOptions, DraggifyPosition, DraggifySize } from '../types';
import { DraggifyAxis } from "../types";
import deepMerge from 'deepmerge';
import { defaultOptions } from "../utils/options";
import { Position, useElementHover, useParentElement } from '@vueuse/core'
import { useDraggable, useElementBounding, clamp } from '@vueuse/core';
import { inRange } from '../utils';

const props = defineProps({
  modelValue: {
    type: Object as PropType<{
      width?: number;
      height?: number;
      x?: number;
      y?: number;
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
    default: () => ({
      x: 10,
      y: 10,
    }),
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

const containerRef = props.options.container ? props.options.container : useParentElement()
const itemRef = ref<HTMLElement>();

const container = useElementBounding(containerRef as Ref<HTMLElement>);
const element = useElementBounding(itemRef);

const emits = defineEmits(['update:modelValue', 'update:draggable']);

const draggable = ref(props.draggable);
const resizeable = ref(props.options.resize.disabled ? false : true);

const modelValue = ref(props.modelValue);

const options = computed(() => deepMerge(defaultOptions, props.options));

const containerResizeDirectionClass = computed(() => {
  return isHovered.value && resizeable.value && options.value.resize.direction ? `draggify-resizer-direction-${options.value.resize.direction}` : undefined
})

const itemStyles = computed<CSSProperties>(() => ({
  userSelect: 'none',
  position: props.fixed ? 'fixed' : 'absolute',
  width: modelValue.value.width !== undefined ? `${modelValue.value.width}px` : `${element.width.value}px`,
  height: modelValue.value.height !== undefined ? `${modelValue.value.height}px` : `${element.height.value}px`,
  backgroundColor: props.color,
  left: modelValue.value.x !== undefined ? `${modelValue.value.x}px` : `${element.x}px`,
  top: !!modelValue.value.y !== undefined ? `${modelValue.value.y}px` : `${element.y}px`,
}));

const isHovered = useElementHover(itemRef)

const onDragStart = (e: DragEvent, type: "drag" | "resize" = "drag") => {
  if (e.dataTransfer) {
    e.dataTransfer.clearData();
  }

  resizeable.value = false

  if (itemRef.value && e.dataTransfer) {
    e.dataTransfer.setData('text/plain', itemRef.value?.innerHTML || '');
    e.dataTransfer.effectAllowed = "move";

    // e.dataTransfer?.setDragImage(new Image(), 0, 0)
    itemRef.value.classList.add('dragging');
  }

  const axis = {
    x: e.clientX,
    y: e.clientY
  }

  const temp = {
    width: modelValue.value.width as number,
    height: modelValue.value.height as number,
    x: modelValue.value.x as number,
    y: modelValue.value.y as number,
  }

  /**
   * Might be useful when we want to move the element horizontally or vertically
   * Turn off default for better performance
   * @param e 
   */
  const onDragMove = (e: DragEvent) => {
    // e.preventDefault();
    // const moveAxis = {
    //   x: e.clientX - axis.x,
    //   y: e.clientY - axis.y
    // }
    // let newAxis = {
    //   x: temp.x + moveAxis.x,
    //   y: temp.y + moveAxis.y
    // }
    // if (itemRef.value?.style) {
    //   itemRef.value.style.opacity = "0.8";
    //   modelValue.value.x = newAxis.x;
    //   modelValue.value.y = newAxis.y;
    // }
  };

  const onDragEnd = (e: DragEvent) => {
    if (itemRef.value) {
      itemRef.value.classList.remove('dragging');
    }

    const endAxis = {
      x: e.clientX - axis.x,
      y: e.clientY - axis.y
    }

    let newAxis = {
      x: temp.x + endAxis.x,
      y: temp.y + endAxis.y
    }

    newAxis = {
      x: clamp(newAxis.x, 0, container.width.value - element.width.value),
      y: clamp(newAxis.y, 0, container.height.value - element.height.value),
    }

    updateItemAxis(newAxis)

    resizeable.value = true
    document.removeEventListener('drag', onDragMove);
    document.removeEventListener('dragend', onDragEnd);
  };

  document.addEventListener('drag', onDragMove);
  document.addEventListener('dragend', onDragEnd);
};

const onResizeStart = (e: MouseEvent, direction: "top" | "right" | "bottom" | "left") => {
  draggable.value = false
  const resizer = e.target as HTMLDivElement
  resizer.style.cursor = 'col-resize'
  document.body.style.cursor = 'col-resize'

  const axis = {
    x: e.clientX,
    y: e.clientY
  }

  const temp = {
    width: modelValue.value.width as number,
    height: modelValue.value.height as number,
    x: modelValue.value.x as number,
    y: modelValue.value.y as number,
  }


  const onResizeMove = (e: MouseEvent) => {
    const moveAxis = {
      x: e.clientX - axis.x,
      y: e.clientY - axis.y
    }

    let newAxis = {
      x: temp.x as number + moveAxis.x,
      y: temp.y as number + moveAxis.y,
    }

    const axisLimit = {
      minX: 0,
      minY: 0,
      maxX: temp.x + temp.width - options.value.resize.minWidth,
      maxY: temp.y + temp.height - options.value.resize.minHeight,
    }

    newAxis = {
      x: clamp(newAxis.x, axisLimit.minX, axisLimit.maxX),
      y: clamp(newAxis.y, axisLimit.minY, axisLimit.maxY),
    }


    const newSize = {
      width: clamp(temp.width as number + moveAxis.x, options.value.resize.minWidth, container.width.value - temp.x),
      height: clamp(temp.height as number + moveAxis.y, options.value.resize.minHeight, container.height.value - temp.y),
      nWidth: inRange(newAxis.x, axisLimit.minX, axisLimit.maxX, "()")
        ? temp.width as number + -moveAxis.x : modelValue.value.width as number,
      nHeight: inRange(newAxis.y, axisLimit.minY, axisLimit.maxY, "()") ? temp.height as number + -moveAxis.y : modelValue.value.height as number,
    }

    updateItemAxis(newAxis, direction)
    updateItemSize(newSize, direction)

  }

  const onResizeEnd = (e: MouseEvent) => {
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    resizer.style.removeProperty('cursor')
    document.body.style.removeProperty('cursor')
    draggable.value = true
  };

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

const updateItemAxis = (axis: DraggifyAxis, direction: DraggifyDirection = "all") => {
  switch (direction) {
    case 'all':
      modelValue.value.x = axis.x
      modelValue.value.y = axis.y
      break;
    case 'left':
      modelValue.value.x = axis.x
      break;
    case 'top':
      modelValue.value.y = axis.y
      break;
  }
}

const updateItemSize = (size: DraggifySize, direction: DraggifyDirection) => {

  switch (direction) {
    case "top":
      modelValue.value.height = size?.nHeight || modelValue.value.height
      break;
    case "right":
      modelValue.value.width = size?.width || modelValue.value.width
      break;
    case "bottom":
      modelValue.value.height = size?.height || modelValue.value.height
      break;
    case "left":
      modelValue.value.width = size?.nWidth || modelValue.value.width
      break;
  }
}
</script>

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
