<template>
  <div class="progress-track" aria-label="Shipping progress">
    <div 
      class="progress-fill" 
      :style="animationStyle"
    ></div>

    <div 
      class="progress-marker"
      :style="animationStyle"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5zm0 4.5L12 16.5 21 12M3 16.5L12 21l9-4.5" stroke="#0046be" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="marker-glow" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShippingProgress',
  props: ['totalDuration', 'progressPercent'],
  data() {
    return {
      // Start as null so we know we haven't "locked" a value yet
      frozenPercent: null
    }
  },
  watch: {
    progressPercent: {
      immediate: true,
      handler(newVal) {
        // If we already have a frozenPercent, do nothing (Prevents Jitter)
        if (this.frozenPercent !== null) return;

        // If the new value is valid, lock it in (Fixes the Reset/0% issue)
        // We check for undefined/null to ensure we don't snapshot an empty state.
        if (newVal !== undefined && newVal !== null) {
          this.frozenPercent = newVal;
        }
      }
    }
  },
  computed: {
    animationStyle() {
      // Use the frozen percent. If it's still null (loading), default to 0.
      const percent = this.frozenPercent || 0;
      
      // Calculate delay based on the locked percentage
      const delay = -(this.totalDuration * (percent / 100));
      
      return {
        animationDuration: (this.totalDuration || 0) + 'ms',
        animationDelay: delay + 'ms'
      };
    }
  }
}
</script>

<style scoped>
.progress-track {
  position: relative;
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #e6ebf4 0%, #dde4ef 100%);
  border-radius: 999px;
  margin-top: 8px;
  overflow: visible;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #ffe007 0%, #ffd000 50%, #ffc400 100%);
  border-radius: 999px;
  width: 0%;
  animation-name: shipping-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  box-shadow: 0 0 0 1px rgba(255, 208, 0, 0.15), 0 4px 10px rgba(255, 204, 0, 0.25);
}

.progress-marker {
  position: absolute;
  top: 50%;
  left: 0%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1px solid #d7e0ed;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 14px rgba(11, 61, 145, 0.18);
  animation-name: shipping-marker;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.marker-glow {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid rgba(0, 70, 190, 0.25);
  animation: marker-pulse 1.8s ease-out infinite;
  pointer-events: none;
}

@keyframes shipping-progress {
  0% { width: 0%; }
  100% { width: 100%; }
}

@keyframes shipping-marker {
  0% { left: 0%; }
  100% { left: 100%; }
}

@keyframes marker-pulse {
  0% {
    transform: scale(0.75);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.15);
    opacity: 0;
  }
  100% {
    transform: scale(1.15);
    opacity: 0;
  }
}
</style>