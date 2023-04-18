<template>
  <div class="draggify-item" :class="{ 'draggify-item-style': !_options?.style?.disabled }" :style="containerStyles"
    v-on="containerEvents">
    <div class="draggify-resizer draggify-resizer-top" v-if="checkResizeable('t')" :style="resizerStyles"
      @mousedown.stop="$event => onMouseDownResizer($event, 'top')"></div>
    <div class="draggify-resizer draggify-resizer-right" v-if="checkResizeable('r')" :style="resizerStyles"
      @mousedown.stop="$event => onMouseDownResizer($event, 'right')"></div>
    <div class="draggify-resizer draggify-resizer-bottom" v-if="checkResizeable('b')" :style="resizerStyles"
      @mousedown.stop="$event => onMouseDownResizer($event, 'bottom')">
    </div>
    <div class="draggify-resizer draggify-resizer-left" v-if="checkResizeable('l')" :style="resizerStyles"
      @mousedown.stop="$event => onMouseDownResizer($event, 'left')"></div>
    <div class="draggify-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CSSProperties, PropType, computed, reactive, ref } from 'vue';
import { DraggifyDirection, DraggifyGridOptions, DraggifyOptions, DraggifyPosition, DraggifySize } from '../types';
import { DraggifyState } from '../types';
import { mergeObjects } from "../utils";
import { defaultOptions } from "../utils/options";


const props = defineProps({
  size: {
    type: Object as PropType<DraggifySize>,
    default: () => ({
      width: 200,
      height: 100,
    }),
  },
  position: {
    type: Object as PropType<DraggifyPosition>,
    default: () => ({
      x: 0,
      y: 0,
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

const _options = computed<DraggifyOptions>(() => {
  return mergeObjects(defaultOptions, props.options)
})

const containerEvents = reactive({
  click: _options.value?.resize?.handle === 'click' ? (e: Event) => { state.isResizing = !state.isResizing } : undefined,
  mouseover: _options.value?.resize?.handle === 'hover' ? (e: Event) => { state.isResizing = true } : undefined,
  mouseleave: _options.value?.resize?.handle === 'hover' ? (e: Event) => { state.isResizing = false } : undefined,
  mousedown: (e: MouseEvent) => { onMouseDownContainer(e) },
});

const checkResizeable = (direction: DraggifyDirection) => {

  if (_options.value?.resize?.disabled || !state.isResizing)
    return false


  if (_options.value?.resize?.direction === 'a') return true

  switch (direction) {
    case 't': return ['t', 'y'].includes(_options.value?.resize?.direction as string)
    case 'r': return ['r', 'x'].includes(_options.value?.resize?.direction as string)
    case 'b': return ['b', 'y'].includes(_options.value?.resize?.direction as string)
    case 'l': return ['l', 'x'].includes(_options.value?.resize?.direction as string)
    default: return false
  }
};

const state = reactive<DraggifyState>({
  width: props.size.width,
  height: props.size.height,
  x: props.position.x,
  y: props.position.y,
  isDragging: false,
  isResizing: false,
});

const containerStyles = computed<CSSProperties>(() => ({
  width: `${state.width}px`,
  height: `${state.height}px`,
  left: `${state.x}px`,
  top: `${state.y}px`,
  'user-select': state.isDragging ? 'none' : 'text'
}));

const resizerStyles = computed(() => ({
  'background-color': _options.value?.resize?.color
}));

/**
 * 
 * @param e 
 * @param direction 
 */
const onMouseDownResizer = (e: any, direction: "top" | "right" | "bottom" | "left") => {
  e.preventDefault();
  let element: HTMLElement = e.target as HTMLElement;
  let rootElement = element.parentElement;

  if (!rootElement) return

  let _width: number = rootElement.offsetWidth;
  let _height: number = rootElement.offsetHeight;

  let x = e.clientX;
  let y = e.clientY;

  let _top = state.y;
  let _left = state.x;

  if (direction === 'top' || direction === 'bottom') {
    element.style.cursor = 'row-resize';
  } else {
    element.style.cursor = 'col-resize';
  }

  const onMouseMoveHandler = (e: MouseEvent) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    if (!rootElement) return
    switch (direction) {
      case "top":
        if (!_options.value?.drag?.disabled) {
          state.y = _top + dy;
        }
        state.height = _height + -(dy);
        break;
      case "right":
        state.width = _width + dx;
        break;
      case "bottom":
        state.height = _height + dy;
        break;
      case "left":
        if (!_options.value?.drag?.disabled) {
          state.x = _left + dx;
        }
        state.width = _width + -(dx);
        break;
    }
    props.onResizeMove?.(state);
  };

  const onMouseUpHandler = (e: MouseEvent) => {

    element.style.removeProperty('cursor');
    state.isResizing = false;
    document.removeEventListener('mousemove', onMouseMoveHandler);
    document.removeEventListener('mouseup', onMouseUpHandler);
    props.onResizeEnd?.(state);
  };

  document.addEventListener('mousemove', onMouseMoveHandler);
  document.addEventListener('mouseup', onMouseUpHandler);
};

/**
 * Draggable container
 * @param e 
 */
const onMouseDownContainer = (e: MouseEvent) => {
  let element = e.target as HTMLElement;

  let itemElement: HTMLElement | null = element.closest('div .draggify-item');
  let containerElement: HTMLElement | null | undefined = itemElement?.parentElement

  let x = e.clientX;
  let y = e.clientY;

  let _top = state.y;
  let _left = state.x;


  if (itemElement) {
    (itemElement?.style as CSSStyleDeclaration).cursor = 'move';
  }

  const onMouseMoveHandler = (e: MouseEvent) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    const newX = _left + dx;
    const newY = _top + dy;


    if (_options.value?.drag?.direction === 'a' || _options.value?.drag?.direction === 'x') {
      if (newX < 10) {
        state.x = 0
      } else if (containerElement && newX > (containerElement?.offsetWidth as number - state.width - 5)) {
        state.x = containerElement?.offsetWidth as number - state.width
      } else {

        if (_options.value?.grid?.stickToGrid) {
          const stickX = Math.round((newX) / (_options.value?.grid?.x as number)) * (_options.value?.grid?.x as number);
          state.x = stickX;
        } else {
          state.x = newX;
        }
      }
    }
    if (_options.value?.drag?.direction === 'a' || _options.value?.drag?.direction === 'y') {
      if (newY < 10) {
        state.y = 0
      } else if (containerElement && newY > (containerElement?.offsetHeight as number - state.height - 10)) {
        state.y = containerElement?.offsetHeight as number - state.height
      } else {


        if (_options.value.grid?.stickToGrid) {
          const stickY = Math.round((_top + dy) / (_options.value?.grid?.y as number)) * (_options.value?.grid?.y as number);
          state.y = stickY;
        } else {
          state.y = newY;
        }
      }
    }
    props.onDragMove?.(state);
  }

  const onMouseUpHandler = (e: MouseEvent) => {
    if (itemElement) {
      itemElement.style.removeProperty('cursor');
    }
    document.removeEventListener('mousemove', onMouseMoveHandler);
    document.removeEventListener('mouseup', onMouseUpHandler);
    props.onDragEnd?.(state);
  };

  document.addEventListener('mousemove', onMouseMoveHandler);
  document.addEventListener('mouseup', onMouseUpHandler);

};
</script>

<style lang="scss">
.draggify-item {
  position: absolute;
  cursor: pointer;

  &.draggify-item-style {
    background-color: #ffffff;
    border: 1px solid #dddddd;
    border-radius: 5px;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
  }

  &.draggify-item-style:hover {
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
  }

  .draggify-resizer {
    position: absolute;

    border-radius: 5px;

    &.draggify-resizer-top {
      top: 0;
      width: 100%;
      height: 5px;
      cursor: n-resize;
    }

    &.draggify-resizer-right {
      right: 0;
      height: 100%;
      width: 5px;
      cursor: e-resize;
    }

    &.draggify-resizer-bottom {
      bottom: 0;
      width: 100%;
      height: 5px;
      cursor: n-resize;
    }

    &.draggify-resizer-left {
      left: 0;
      height: 100%;
      width: 5px;
      cursor: e-resize;
    }

  }

  .draggify-content {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    user-select: none;
  }
}
</style>
