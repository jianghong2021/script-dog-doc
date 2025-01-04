<script setup lang="ts">
import { onMounted } from 'vue'
const initParams = () => {
    const params = location.href.split('#')[1]
    dog.backupAuth(params)
}
onMounted(() => {
    initParams()
})
</script>
<template>
    <div class="w-full h-screen flex justify-center items-center">
        <span>
            loading
        </span>
    </div>
</template>