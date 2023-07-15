<template>
    <v-dialog v-model="dialog" width="auto">
        <v-card>
            <v-toolbar style="color: white;" color="red" title="Error">Error</v-toolbar>
            <v-card-text>
                <div class="pa-7">
                    Something went wrong: {{ new_message }}, please try again later.
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn color="red" style="color: white;" block @click="dialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
export default {
    computed: {
        text() {
            return this.$store.state.error;
        },
    },
    watch: {
        text(new_text, old_text) {
            console.log(new_text)
            if (new_text != null) {
                this.new_message = new_text
                this.old_message = old_text
                this.dialog = true
                this.$store.dispatch('setError', null)
            }
        }
    },
    data() {
        return {
            old_message: '',
            new_message: '',
            dialog: false,
        }
    },
}
</script>