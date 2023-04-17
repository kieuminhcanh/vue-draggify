<template>
  <div class="draggify-container bg-blue" :style="containerStyles" v-on="containerEvents">
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
import { DraggifyDirection, DraggifyOptions, DraggifySize } from '../types';

const props = defineProps({
  width: {
    type: Number as PropType<number>,
    default: 200,
  },
  height: {
    type: Number as PropType<number>,
    default: 100,
  },
  x: {
    type: Number as PropType<number>,
    default: 0,
  },
  y: {
    type: Number as PropType<number>,
    default: 0,
  },
  options: {
    type: Object as PropType<DraggifyOptions>,
    default: () => ({
      resizeDirection: 'a',
      resizeColor: 'rgba(0, 0, 0, 0.5)',
      dragDirection: 'a',
    }),
  },
  resizeHandle: {
    type: String as PropType<'click' | 'hover'>,
    default: 'hover',
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
  resizeable: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  draggable: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
});

const containerEvents = reactive({
  click: props.resizeHandle === 'click' ? (e: Event) => { resizeable.value = true } : undefined,
  mouseover: props.resizeHandle === 'hover' ? (e: Event) => { resizeable.value = true } : undefined,
  mouseleave: props.resizeHandle === 'hover' ? (e: Event) => { resizeable.value = false } : undefined,
  'mousedown': (e: MouseEvent) => { onMouseDownContainer(e) },
});

const resizeable = ref(false);

const checkResizeable = (direction: DraggifyDirection) => {
  if (!resizeable.value)
    return false

  if (props.options.resizeDirection === 'a') return true

  switch (direction) {
    case 't': return ['t', 'y'].includes(props.options.resizeDirection)
    case 'r': return ['r', 'x'].includes(props.options.resizeDirection)
    case 'b': return ['b', 'y'].includes(props.options.resizeDirection)
    case 'l': return ['l', 'x'].includes(props.options.resizeDirection)
    default: return false
  }
};



const size = reactive<DraggifySize>({
  width: props.width,
  height: props.height,
  x: props.x,
  y: props.y,
});

const containerStyles = computed<CSSProperties>(() => {
  return {
    width: `${size.width}px`,
    height: `${size.height}px`,
    left: `${size.x}px`,
    top: `${size.y}px`,
    'user-select': props.draggable ? 'none' : 'text'
  };
});

const resizerStyles = computed(() => {
  return {
    backgroundColor: props.options.resizeColor,
  };
});

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

  let _top = size.y;
  let _left = size.x;



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
        if (props.draggable) {
          size.y = _top + dy;
        }
        size.height = _height + -(dy);
        break;
      case "right":
        size.width = _width + dx;
        break;
      case "bottom":
        size.height = _height + dy;
        break;
      case "left":
        if (props.draggable) {
          size.x = _left + dx;
        }
        size.width = _width + -(dx);
        break;
    }
    props.onResizeMove?.(size);
  };

  const onMouseUpHandler = (e: MouseEvent) => {

    element.style.removeProperty('cursor');
    resizeable.value = false;
    document.removeEventListener('mousemove', onMouseMoveHandler);
    document.removeEventListener('mouseup', onMouseUpHandler);
    props.onResizeEnd?.(size);
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

  let x = e.clientX;
  let y = e.clientY;

  let _top = size.y;
  let _left = size.x;

  element.style.cursor = 'move';

  const onMouseMoveHandler = (e: MouseEvent) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    if (props.options.dragDirection === 'a' || props.options.dragDirection === 'x') {
      size.x = _left + dx;
    }
    if (props.options.dragDirection === 'a' || props.options.dragDirection === 'y') {
      size.y = _top + dy;
    }
    props.onDragMove?.(size);
  }

  const onMouseUpHandler = (e: MouseEvent) => {

    element.style.removeProperty('cursor');

    document.removeEventListener('mousemove', onMouseMoveHandler);
    document.removeEventListener('mouseup', onMouseUpHandler);
    props.onDragEnd?.(size);
  };

  document.addEventListener('mousemove', onMouseMoveHandler);
  document.addEventListener('mouseup', onMouseUpHandler);

};
</script>

<style lang="scss" scoped>
.draggify-container {
  position: relative;
  cursor: pointer;

  .draggify-resizer {
    position: absolute;
    z-index: 1;

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
  }
}
</style>
