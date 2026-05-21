<script setup lang="ts">
import { useMeetingStore } from '@/stores/meetingStore'

defineProps<{
  decisions: string[]
}>()

const store = useMeetingStore()
</script>

<template>
  <article class="rounded-2xl border border-amber-800/50 bg-amber-950/25 p-5">
    <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-amber-300">
      <span class="text-lg">☐</span> 결정 항목
    </h3>
    <ul class="space-y-2">
      <li
        v-for="(item, i) in decisions"
        :key="i"
        class="flex items-start gap-2 text-sm"
        :class="store.checkedDecisions[i] ? 'text-slate-500 line-through' : 'text-slate-200'"
      >
        <input
          :id="`decision-${i}`"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
          :checked="!!store.checkedDecisions[i]"
          @change="store.toggleDecision(i)"
        />
        <label :for="`decision-${i}`" class="cursor-pointer flex-1">{{ item }}</label>
      </li>
    </ul>
  </article>
</template>
