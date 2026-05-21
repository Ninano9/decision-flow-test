<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow, type Node, type Edge } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import type { AgentPipelineStep } from '@/types/meeting'

const props = defineProps<{
  steps: AgentPipelineStep[]
}>()

const nodes = computed<Node[]>(() =>
  props.steps.map((step, i) => ({
    id: step.id,
    label: step.label,
    position: { x: i * 180, y: 40 },
    class: statusClass(step.status),
    style: {
      padding: '10px 14px',
      borderRadius: '12px',
      border: '1px solid #475569',
      background: nodeBg(step.status),
      color: '#f1f5f9',
      fontSize: '12px',
      minWidth: '140px',
      textAlign: 'center',
    },
  })),
)

const edges = computed<Edge[]>(() =>
  props.steps.slice(0, -1).map((step, i) => ({
    id: `e-${step.id}`,
    source: step.id,
    target: props.steps[i + 1].id,
    animated: props.steps[i + 1].status === 'running',
    style: { stroke: '#64748b' },
  })),
)

function statusClass(status: AgentPipelineStep['status']) {
  return `agent-${status}`
}

function nodeBg(status: AgentPipelineStep['status']) {
  switch (status) {
    case 'running':
      return '#1e3a5f'
    case 'done':
      return '#14532d'
    case 'error':
      return '#7f1d1d'
    default:
      return '#1e293b'
  }
}
</script>

<template>
  <section class="h-[260px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :fit-view-on-init="true"
      :nodes-draggable="false"
      :zoom-on-scroll="false"
      class="agent-flow"
    />
  </section>
</template>

<style scoped>
.agent-flow {
  background-image: radial-gradient(#334155 1px, transparent 1px);
  background-size: 16px 16px;
}
</style>
