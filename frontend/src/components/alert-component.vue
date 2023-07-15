<template>
    <div class="text-center ma-2">
        <v-snackbar v-model="snackbar">
            {{ new_message }}
            <template v-slot:action="{ attrs }">
                <v-btn color="green" text v-bind="attrs" @click="snackbar = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
  
<script>
export default {
    computed: {
        text() {
            return this.$store.state.message
        },
    },
    watch: {
        text(new_text, old_text) {
            console.log(new_text)
            if (new_text != null) {
                this.new_message = new_text
                this.old_message = old_text
                this.snackbar = true
                this.$store.dispatch('setMessage', null)
            }
        }
    },
    data: () => ({
        old_message: '',
        new_message: '',
        snackbar: false,
    }),
}
</script>