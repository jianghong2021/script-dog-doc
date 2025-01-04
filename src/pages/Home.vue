<script setup lang="ts">
import { onMounted } from 'vue';

const init = ()=>{
    const params = location.href.split('#')[1]
    if(params){
        dog.backupAuth(params)
    }
}
onMounted(() => {
    init()
})
</script>
<template>
    <div class="w-full h-screen flex justify-center items-center">
        <h3 class="text-2xl font-bold">
            Developing...
        </h3>
    </div>
</template>